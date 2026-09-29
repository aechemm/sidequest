#!/usr/bin/env python3
"""TalkTrace Extractor — pulls facts from transcripts, hands off to GraphBuilder."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("extractor")

CRUSOE_BASE_URL = os.getenv(
    "CRUSOE_BASE_URL", "https://api.inference.crusoecloud.com/v1/"
)
CRUSOE_MODEL = os.getenv("CRUSOE_MODEL", "meta-llama/Llama-3.3-70B-Instruct")


def build_adapter():
    from band.adapters import LangGraphAdapter

    llm = ChatOpenAI(
        model=CRUSOE_MODEL,
        api_key=os.getenv("CRUSOE_API_KEY"),
        base_url=CRUSOE_BASE_URL,
    )
    return LangGraphAdapter(
        llm=llm,
        checkpointer=InMemorySaver(),
        custom_section="""You are the TalkTrace Extractor agent in a Band room.

When @mentioned with a meeting transcript:
1. Parse the JSON transcript from the message.
2. Extract decisions, commitments, blockers, and open questions.
3. Each fact MUST include a verbatim quote and speaker.
4. Post your findings, then @mention @GraphBuilder with the structured facts JSON.
5. Do NOT write to Neo4j yourself — that is GraphBuilder's job.

Always end by @mentioning @GraphBuilder with the facts array.""",
    )


def load_credentials() -> tuple[str, str]:
    agent_id = os.getenv("BAND_EXTRACTOR_ID")
    api_key = os.getenv("BAND_EXTRACTOR_KEY")
    if agent_id and api_key:
        return agent_id, api_key
    from band.config import load_agent_config

    return load_agent_config("extractor")


async def main() -> None:
    from band import Agent

    adapter = build_adapter()
    agent_id, api_key = load_credentials()
    agent = Agent.create(adapter=adapter, agent_id=agent_id, api_key=api_key)
    logger.info("Extractor agent running — waiting for @mentions in Band room")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
