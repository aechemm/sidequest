#!/usr/bin/env python3
"""SideQuest ExtractorAgent — extracts people, companies, problems, offers from transcripts."""

from __future__ import annotations

import asyncio
import logging
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("extractor")

CRUSOE_BASE_URL = os.getenv("CRUSOE_BASE_URL", "https://api.inference.crusoecloud.com/v1/")
CRUSOE_MODEL = os.getenv("CRUSOE_MODEL", "meta-llama/Llama-3.3-70B-Instruct")


def build_adapter():
    from band.adapters import LangGraphAdapter

    return LangGraphAdapter(
        llm=ChatOpenAI(
            model=CRUSOE_MODEL,
            api_key=os.getenv("CRUSOE_API_KEY"),
            base_url=CRUSOE_BASE_URL,
        ),
        checkpointer=InMemorySaver(),
        custom_section="""You are SideQuest ExtractorAgent in a Band room.

When @mentioned with a conversation transcript:
1. Extract people, companies, products, skills, problems, needs, offers, claims, interests.
2. Every fact needs provenance: conversation ID, quote, speaker, timestamp.
3. Post structured JSON, then @mention @GraphAgent.

Do NOT discover cross-conversation connections — ScoutAgent does that.""",
    )


async def main() -> None:
    from band import Agent
    from band.config import load_agent_config

    agent_id, api_key = load_agent_config("extractor")
    agent = Agent.create(adapter=build_adapter(), agent_id=agent_id, api_key=api_key)
    logger.info("ExtractorAgent running")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
