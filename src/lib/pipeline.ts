import {
  agentEvent,
  connectorEvents,
  criticEvents,
  extractionEvents,
  graphEvents,
  scoutEvents,
} from "./agent-activity";
import { critiqueSideQuest, extractEntities } from "./crusoe";
import { discoverSideQuests } from "./discover";
import { fetchGraph, getMockGraph, writeEntitiesToGraph } from "./neo4j";
import type {
  AgentActivityEvent,
  Conversation,
  CriticVerdict,
  ExtractedEntity,
  GraphData,
  NetworkStats,
  PipelineStatus,
  SideQuest,
} from "./types";

export function computeStats(
  conversations: Conversation[],
  graph: GraphData,
  sideQuests: SideQuest[],
): NetworkStats {
  return {
    people: graph.nodes.filter((n) => n.type === "Person").length,
    companies: graph.nodes.filter((n) => n.type === "Company").length,
    conversations: conversations.length,
    connectionsDiscovered: sideQuests.length,
  };
}

export async function ingestConversation(
  conversation: Conversation,
): Promise<{
  entities: ExtractedEntity[];
  verdicts: CriticVerdict[];
  status: PipelineStatus;
  activities: AgentActivityEvent[];
}> {
  const activities: AgentActivityEvent[] = [];
  const status: PipelineStatus = {
    stage: "extracting",
    message: `ExtractorAgent processing ${conversation.title}…`,
    conversationId: conversation.id,
  };

  const entities = await extractEntities(conversation);
  status.entitiesExtracted = entities.length;
  activities.push(
    ...extractionEvents(entities.length, entities.length),
  );

  status.stage = "building_graph";
  status.message = "GraphAgent updating Neo4j…";

  const verdicts: CriticVerdict[] = entities.map((e) => {
    const supported =
      e.quote.length > 8 &&
      (conversation.text.includes(e.quote.slice(0, 30)) ||
        conversation.text.toLowerCase().includes(e.person.toLowerCase()));
    return {
      entityId: e.id,
      approved: supported,
      reason: supported
        ? "Supported by recorded conversation."
        : "BLOCKED — quote not found in conversation.",
    };
  });

  try {
    await writeEntitiesToGraph(
      conversation.id,
      conversation.title,
      entities,
      verdicts,
    );
    activities.push(...graphEvents());
  } catch {
    status.message = "Entities extracted — connect Neo4j Aura to persist graph.";
    activities.push(
      agentEvent("GraphAgent", "Mock graph mode — Neo4j not connected", "info"),
    );
  }

  status.stage = "complete";
  status.message = `Ingested ${conversation.title} — ${verdicts.filter((v) => v.approved).length} entities approved.`;

  return { entities, verdicts, status, activities };
}

export async function runDiscovery(
  conversations: Conversation[],
): Promise<{
  sideQuests: SideQuest[];
  status: PipelineStatus;
  graph: GraphData;
  activities: AgentActivityEvent[];
  stats: NetworkStats;
}> {
  const activities: AgentActivityEvent[] = [];
  const status: PipelineStatus = {
    stage: "discovering",
    message: "ScoutAgent scanning cross-conversation paths…",
  };

  activities.push(...scoutEvents());

  let graph: GraphData;
  try {
    graph = await fetchGraph();
  } catch {
    graph = getMockGraph();
  }

  let sideQuests = discoverSideQuests(conversations, graph);

  status.stage = "critiquing";
  status.message = "ConnectorAgent + CriticAgent reviewing introductions…";

  const approvedQuests: SideQuest[] = [];
  for (const sq of sideQuests) {
    activities.push(...connectorEvents(sq.title));
    const { approved, reason } = await critiqueSideQuest(sq, conversations);
    sq.approved = approved;
    sq.criticReason = reason;
    activities.push(...criticEvents(approved, reason));
    if (approved) approvedQuests.push(sq);
  }

  sideQuests = approvedQuests;
  status.sideQuestsFound = sideQuests.length;
  status.stage = "complete";
  status.message =
    sideQuests.length > 0
      ? `SideQuest discovered — ${sideQuests.length} connection${sideQuests.length > 1 ? "s" : ""} across ${conversations.length} conversations.`
      : "No cross-conversation connections yet — ingest more conversations.";

  return {
    sideQuests,
    status,
    graph,
    activities,
    stats: computeStats(conversations, graph, sideQuests),
  };
}

/** Instant deterministic demo — no Crusoe/Neo4j calls (reliable on local laptops). */
export async function runDemoMock(conversations: Conversation[]): Promise<{
  sideQuests: SideQuest[];
  status: PipelineStatus;
  graph: GraphData;
  activities: AgentActivityEvent[];
  stats: NetworkStats;
}> {
  const activities: AgentActivityEvent[] = [];

  for (const conv of conversations) {
    activities.push(
      agentEvent("ExtractorAgent", `Processing ${conv.title}…`, "info"),
    );
    activities.push(...extractionEvents(1, 1));
    activities.push(...graphEvents());
  }

  activities.push(...scoutEvents());

  const graph = getMockGraph();
  const sideQuests = discoverSideQuests(conversations, graph);

  for (const sq of sideQuests) {
    activities.push(...connectorEvents(sq.title));
    activities.push(
      ...criticEvents(
        true,
        "Demo mode — Alice/Bob connection supported by sample conversations.",
      ),
    );
    sq.approved = true;
    sq.criticReason =
      "Demo mode — Alice/Bob connection supported by sample conversations.";
  }

  const status: PipelineStatus = {
    stage: "complete",
    message:
      sideQuests.length > 0
        ? `SideQuest discovered — ${sideQuests.length} connection${sideQuests.length > 1 ? "s" : ""} across ${conversations.length} conversations.`
        : "No cross-conversation connections yet — ingest more conversations.",
    sideQuestsFound: sideQuests.length,
  };

  return {
    sideQuests,
    status,
    graph,
    activities,
    stats: computeStats(conversations, graph, sideQuests),
  };
}
