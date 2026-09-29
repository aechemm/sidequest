#!/usr/bin/env python3
"""SideQuest Connector — discovers cross-conversation introduction opportunities."""

from __future__ import annotations

import asyncio
import logging
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("connector")

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
        custom_section="""You are SideQuest Connector in a Band room.

When @mentioned by GraphAgent:
1. Scan the Neo4j graph for paths ACROSS different conversations.
2. Find when Person A's PROVIDES/WORKS_ON matches Person B's HAS_PROBLEM/NEEDS.
3. Propose SideQuest introductions with path explanation.
4. @mention @Critic with each proposed intro for verification.

The value is connections NO single conversation reveals.""",
    )


async def main() -> None:
    from band import Agent
    from band.config import load_agent_config

    agent_id, api_key = load_agent_config("connector")
    agent = Agent.create(adapter=build_adapter(), agent_id=agent_id, api_key=api_key)
    logger.info("Connector running — hunting cross-conversation paths")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
