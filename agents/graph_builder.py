#!/usr/bin/env python3
"""TalkTrace GraphBuilder — writes approved facts to Neo4j, hands off to Critic."""

from __future__ import annotations

import asyncio
import json
import logging
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

from shared import write_facts_to_neo4j

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("graph_builder")

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
        custom_section="""You are the TalkTrace GraphBuilder agent in a Band room.

When @mentioned by Extractor with structured facts:
1. Parse the facts JSON and meeting ID from the message.
2. Stage the facts for Critic review — do NOT write to Neo4j until Critic approves.
3. @mention @Critic with the facts array and transcript for verification.

You have access to Neo4j via the write_facts_to_neo4j tool logic — but ONLY after Critic approves.
When Critic sends APPROVED verdicts, write approved facts to Neo4j and post the count.

Always @mention @Critic before any graph write.""",
    )


def load_credentials() -> tuple[str, str]:
    agent_id = os.getenv("BAND_GRAPHBUILDER_ID")
    api_key = os.getenv("BAND_GRAPHBUILDER_KEY")
    if agent_id and api_key:
        return agent_id, api_key
    from band.config import load_agent_config

    return load_agent_config("graph_builder")


async def main() -> None:
    from band import Agent

    adapter = build_adapter()
    agent_id, api_key = load_credentials()
    agent = Agent.create(adapter=adapter, agent_id=agent_id, api_key=api_key)
    logger.info("GraphBuilder agent running — waiting for @mentions")
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
