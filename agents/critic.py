#!/usr/bin/env python3
"""TalkTrace Critic — vetoes facts not supported by transcript quotes."""

from __future__ import annotations

import asyncio
import logging
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("critic")

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
        custom_section="""You are the TalkTrace Critic agent in a Band room.

Your ONLY job is to verify extracted facts against the source transcript.

Rules:
- If a claim is NOT supported by a verbatim quote in the transcript, reply BLOCKED and name the missing evidence.
- If supported, reply APPROVED with the quote that proves it.
- You can VETO an outcome — a BLOCKED verdict is terminal until Extractor revises.
- After reviewing all facts, @mention @GraphBuilder with APPROVED/BLOCKED verdicts per fact.

Be strict. Judges are watching.""",
    )


def load_credentials() -> tuple[str, str]:
    agent_id = os.getenv("BAND_CRITIC_ID")
    api_key = os.getenv("BAND_CRITIC_KEY")
    if agent_id and api_key:
        return agent_id, api_key
    from band.config import load_agent_config

    return load_agent_config("critic")


async def main() -> None:
    from band import Agent

    adapter = build_adapter()
    agent_id, api_key = load_credentials()
    agent = Agent.create(adapter=adapter, agent_id=agent_id, api_key=api_key)
    logger.info("Critic agent running — ready to BLOCK unsupported facts")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
