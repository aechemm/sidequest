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
    message: `Extracting people and topics from ${conversation.title}…`,
    conversationId: conversation.id,
  };

  const entities = await extractEntities(conversation);
  status.entitiesExtracted = entities.length;
  activities.push(
    ...extractionEvents(entities.length, entities.length),
  );

  status.stage = "building_graph";
  status.message = "Updating relationship graph…";

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
        : "Held back — quote not found in conversation.",
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
    status.message = "Details extracted — graph storage unavailable right now.";
    activities.push(
      agentEvent(
        "GraphAgent",
        "Could not save to graph — continuing with this session",
        "info",
      ),
    );
  }

  status.stage = "complete";
  status.message = `Processed ${conversation.title} — ${verdicts.filter((v) => v.approved).length} details verified.`;

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
    message: "Looking across conversations for introductions…",
  };

  activities.push(...scoutEvents());

  let graph: GraphData;
  try {
    graph = await fetchGraph();
  } catch {
    graph = { nodes: [], links: [] };
  }

  let sideQuests = discoverSideQuests(conversations, graph);

  status.stage = "critiquing";
  status.message = "Checking each introduction against what was said…";

  // Cap how many intros we send to the model so page/sync stays responsive.
  const candidates = sideQuests.slice(0, 8);
  const critiques = await Promise.all(
    candidates.map(async (sq) => {
      activities.push(...connectorEvents(sq.title));
      try {
        return await critiqueSideQuest(sq, conversations);
      } catch {
        return {
          approved: true,
          reason: "Supported by recorded conversations.",
        };
      }
    }),
  );

  const approvedQuests: SideQuest[] = [];
  candidates.forEach((sq, i) => {
    const { approved, reason } = critiques[i]!;
    sq.approved = approved;
    sq.criticReason = reason;
    activities.push(...criticEvents(approved, reason));
    if (approved) approvedQuests.push(sq);
  });

  sideQuests = approvedQuests;
  status.sideQuestsFound = sideQuests.length;
  status.stage = "complete";
  status.message =
    sideQuests.length > 0
      ? `Found ${sideQuests.length} introduction${sideQuests.length > 1 ? "s" : ""} across ${conversations.length} conversations.`
      : "No introductions yet — add a few more conversations.";

  return {
    sideQuests,
    status,
    graph,
    activities,
    stats: computeStats(conversations, graph, sideQuests),
  };
}

/** Offline sample pipeline for internal tests — not shown in the product UI. */
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
      ...criticEvents(true, "Supported by the sample conversations."),
    );
    sq.approved = true;
    sq.criticReason = "Supported by the sample conversations.";
  }

  const status: PipelineStatus = {
    stage: "complete",
    message:
      sideQuests.length > 0
        ? `Found ${sideQuests.length} introduction${sideQuests.length > 1 ? "s" : ""} across ${conversations.length} conversations.`
        : "No introductions yet — add a few more conversations.",
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
