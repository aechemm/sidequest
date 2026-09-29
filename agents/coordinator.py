#!/usr/bin/env python3
"""Post a transcript kickoff message to the Band room via Agent API."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

from dotenv import load_dotenv

load_dotenv()

BAND_API_BASE = "https://app.band.ai/api/v1/agent"


def load_extractor_credentials() -> tuple[str, str]:
    agent_id = os.getenv("BAND_EXTRACTOR_ID")
    api_key = os.getenv("BAND_EXTRACTOR_KEY")
    if agent_id and api_key:
        return agent_id, api_key

    try:
        import yaml

        with open("agent_config.yaml", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        extractor = config.get("extractor", {})
        return extractor["agent_id"], extractor["api_key"]
    except Exception as exc:
        raise RuntimeError(
            "Band Extractor credentials missing. Set BAND_EXTRACTOR_ID/KEY or agent_config.yaml"
        ) from exc


def post_kickoff(transcript: dict, meeting_id: str) -> str:
    chat_id = os.getenv("BAND_CHAT_ID")
    if not chat_id:
        raise RuntimeError("BAND_CHAT_ID not set — create a room in Band and copy its ID")

    _, api_key = load_extractor_credentials()
    preview = transcript.get("text", "")[:1200]
    message = (
        f"@hmorder/graphagent Process this SideQuest conversation (id: {meeting_id}).\n\n"
        f"```json\n{json.dumps({'conversation': transcript, 'meetingId': meeting_id}, indent=2)[:8000]}\n```\n\n"
        f"Preview:\n{preview}"
    )

    payload = json.dumps({
        "message": {
            "content": f"@hmorder/extractor {message}",
            "mentions": [{"handle": "hmorder/extractor"}],
        }
    }).encode("utf-8")
    request = urllib.request.Request(
        f"{BAND_API_BASE}/chats/{chat_id}/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            return body or "Kickoff posted"
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise RuntimeError(f"Band API error {exc.code}: {detail}") from exc


def main() -> int:
    raw = os.getenv("TALKTRACE_PAYLOAD")
    if not raw:
        print("TALKTRACE_PAYLOAD missing", file=sys.stderr)
        return 1

    payload = json.loads(raw)
    transcript = payload["transcript"]
    meeting_id = payload.get("meetingId", transcript.get("id", "meeting"))

    result = post_kickoff(transcript, meeting_id)
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
