#!/usr/bin/env python3
"""SideQuest Scout — extracts people, problems, offers from conversations."""

from __future__ import annotations

import asyncio
import logging
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scout")

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
        custom_section="""You are SideQuest Scout in a Band room.

When @mentioned with a conversation transcript:
1. Extract people, skills, problems, products, needs, and offers.
2. Each entity needs: person, relation (WORKS_ON/HAS_PROBLEM/SEEKS/PROVIDES/NEEDS), topic, quote.
3. Post findings, then @mention @GraphAgent with the entities JSON.

Do NOT find cross-conversation connections — that's Connector's job.""",
    )


async def main() -> None:
    from band import Agent
    from band.config import load_agent_config

    agent_id, api_key = load_agent_config("scout")
    agent = Agent.create(adapter=build_adapter(), agent_id=agent_id, api_key=api_key)
    logger.info("Scout running — listening for @mentions")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
