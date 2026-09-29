"""Shared utilities for TalkTrace Band agents."""

from __future__ import annotations

import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from neo4j import GraphDatabase
from openai import OpenAI

load_dotenv()

CRUSOE_BASE_URL = os.getenv(
    "CRUSOE_BASE_URL", "https://api.inference.crusoecloud.com/v1/"
)
CRUSOE_MODEL = os.getenv("CRUSOE_MODEL", "meta-llama/Llama-3.3-70B-Instruct")


def get_crusoe_client() -> OpenAI | None:
    api_key = os.getenv("CRUSOE_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key, base_url=CRUSOE_BASE_URL)


def get_neo4j_driver():
    uri = os.getenv("NEO4J_URI")
    password = os.getenv("NEO4J_PASSWORD")
    username = os.getenv("NEO4J_USERNAME", "neo4j")
    if not uri or not password:
        return None
    return GraphDatabase.driver(uri, auth=(username, password))


def extract_facts(transcript: dict[str, Any]) -> list[dict[str, Any]]:
    client = get_crusoe_client()
    segments = transcript.get("segments", [])
    segment_hints = "\n".join(
        f"[{s.get('start')}s-{s.get('end')}s] {s.get('speaker', 'Unknown')}: {s.get('text')}"
        for s in segments
    )
    full_text = transcript.get("text", "")

    if not client:
        return _extract_facts_mock(transcript)

    response = client.chat.completions.create(
        model=CRUSOE_MODEL,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract facts from meeting transcripts. Return JSON: "
                    '{"facts": [{"type":"decision|commitment|blocker|question",'
                    '"text":"...", "speaker":"...", "quote":"...", '
                    '"timestampStart": number|null, "timestampEnd": number|null, '
                    '"confidence": 0-1}]}'
                ),
            },
            {
                "role": "user",
                "content": f"Segments:\n{segment_hints}\n\nFull:\n{full_text}",
            },
        ],
    )
    raw = response.choices[0].message.content or '{"facts":[]}'
    parsed = json.loads(raw)
    facts = parsed.get("facts", [])
    meeting_id = transcript.get("id", "meeting")
    for i, fact in enumerate(facts):
        fact["id"] = f"fact-{meeting_id}-{i}"
    return facts


def _extract_facts_mock(transcript: dict[str, Any]) -> list[dict[str, Any]]:
    facts: list[dict[str, Any]] = []
    meeting_id = transcript.get("id", "meeting")
    for i, segment in enumerate(transcript.get("segments", [])):
        text = segment.get("text", "")
        lower = text.lower()
        fact_type = None
        if "decision:" in lower:
            fact_type = "decision"
        elif "commits to" in lower or "commit to" in lower:
            fact_type = "commitment"
        elif "blocked" in lower or "blocking" in lower:
            fact_type = "blocker"
        elif "open question" in lower or "?" in text:
            fact_type = "question"
        if not fact_type:
            continue
        facts.append(
            {
                "id": f"fact-{meeting_id}-{i}",
                "type": fact_type,
                "text": re.sub(r"^decision:\s*", "", text, flags=re.I).strip(),
                "speaker": segment.get("speaker", "Unknown"),
                "quote": text,
                "timestampStart": segment.get("start"),
                "timestampEnd": segment.get("end"),
                "confidence": 0.85,
            }
        )
    return facts


def critique_fact(transcript: dict[str, Any], fact: dict[str, Any]) -> dict[str, Any]:
    client = get_crusoe_client()
    quote = fact.get("quote", "")
    full_text = transcript.get("text", "")

    if not client:
        supported = quote.lower()[:20] in full_text.lower() if quote else False
        if supported and len(quote) > 10:
            return {"approved": True, "reason": "Quote found in transcript."}
        return {
            "approved": False,
            "reason": "BLOCKED — no supporting quote found in transcript.",
        }

    response = client.chat.completions.create(
        model=CRUSOE_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Verify extracted facts against transcript. "
                    'Return {"approved": bool, "reason": str}. '
                    "Use BLOCKED in reason when rejecting."
                ),
            },
            {
                "role": "user",
                "content": json.dumps({"transcript": full_text, "fact": fact}),
            },
        ],
    )
    raw = response.choices[0].message.content or "{}"
    return json.loads(raw)


def write_facts_to_neo4j(
    meeting_id: str,
    transcript: dict[str, Any],
    facts: list[dict[str, Any]],
    verdicts: list[dict[str, Any]],
) -> int:
    driver = get_neo4j_driver()
    if not driver:
        raise RuntimeError("Neo4j not configured")

    approved_ids = {v["factId"] for v in verdicts if v.get("approved")}
    written = 0

    with driver.session() as session:
        session.run(
            "MERGE (m:Meeting {id: $meetingId}) SET m.title = $title, m.source = $source",
            meetingId=meeting_id,
            title=f"Meeting {meeting_id}",
            source=transcript.get("source", "band"),
        )

        for fact in facts:
            if fact["id"] not in approved_ids:
                continue
            written += 1
            speaker = fact.get("speaker") or "Unknown"
            session.run(
                "MERGE (p:Person {name: $speaker})",
                speaker=speaker,
            )

            if fact["type"] == "decision":
                session.run(
                    """
                    MERGE (d:Decision {id: $factId})
                    SET d.text = $text, d.quote = $quote, d.status = 'approved'
                    WITH d MATCH (p:Person {name: $speaker}) MERGE (p)-[:DECIDED]->(d)
                    """,
                    factId=fact["id"],
                    text=fact["text"],
                    quote=fact["quote"],
                    speaker=speaker,
                )
            elif fact["type"] == "commitment":
                session.run(
                    """
                    MERGE (t:Task {id: $factId})
                    SET t.text = $text, t.quote = $quote, t.status = 'committed'
                    WITH t MATCH (p:Person {name: $speaker}) MERGE (p)-[:COMMITTED_TO]->(t)
                    """,
                    factId=fact["id"],
                    text=fact["text"],
                    quote=fact["quote"],
                    speaker=speaker,
                )
            elif fact["type"] == "blocker":
                session.run(
                    """
                    MERGE (b:Blocker {id: $factId})
                    SET b.text = $text, b.quote = $quote
                    WITH b MATCH (p:Person {name: $speaker}) MERGE (p)-[:BLOCKED_BY]->(b)
                    """,
                    factId=fact["id"],
                    text=fact["text"],
                    quote=fact["quote"],
                    speaker=speaker,
                )
            elif fact["type"] == "question":
                session.run(
                    """
                    MERGE (q:Question {id: $factId})
                    SET q.text = $text, q.quote = $quote
                    WITH q MATCH (p:Person {name: $speaker}) MERGE (p)-[:RAISED]->(q)
                    """,
                    factId=fact["id"],
                    text=fact["text"],
                    quote=fact["quote"],
                    speaker=speaker,
                )

    driver.close()
    return written
