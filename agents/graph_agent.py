#!/usr/bin/env python3
"""SideQuest GraphAgent — writes entities to Neo4j."""

from __future__ import annotations

import asyncio
import logging
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("graph_agent")

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
        custom_section="""You are SideQuest GraphAgent in a Band room.

When @mentioned by Scout with extracted entities:
1. Write Person→Topic relationships to Neo4j (accumulate across conversations).
2. Post graph update summary.
3. @mention @Connector to scan for cross-conversation paths.

Never approve introductions — that's Critic's job.""",
    )


async def main() -> None:
    from band import Agent
    from band.config import load_agent_config

    agent_id, api_key = load_agent_config("graph_agent")
    agent = Agent.create(adapter=build_adapter(), agent_id=agent_id, api_key=api_key)
    logger.info("GraphAgent running — accumulating relationship graph")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
