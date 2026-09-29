import { critiqueSideQuest, extractEntities } from "./crusoe";
import { discoverSideQuests } from "./discover";
import { fetchGraph, getMockGraph, writeEntitiesToGraph } from "./neo4j";
import type {
  Conversation,
  CriticVerdict,
  ExtractedEntity,
  PipelineStatus,
  SideQuest,
} from "./types";

export async function ingestConversation(
  conversation: Conversation,
): Promise<{
  entities: ExtractedEntity[];
  verdicts: CriticVerdict[];
  status: PipelineStatus;
}> {
  const status: PipelineStatus = {
    stage: "extracting",
    message: `Scout extracting entities from ${conversation.title}…`,
    conversationId: conversation.id,
  };

  const entities = await extractEntities(conversation);
  status.entitiesExtracted = entities.length;
  status.stage = "building_graph";
  status.message = "Writing entities to relationship graph…";

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
  } catch {
    status.message = "Entities extracted — connect Neo4j to persist graph.";
  }

  status.stage = "complete";
  status.message = `Ingested ${conversation.title} — ${verdicts.filter((v) => v.approved).length} entities approved.`;

  return { entities, verdicts, status };
}

export async function runDiscovery(
  conversations: Conversation[],
): Promise<{ sideQuests: SideQuest[]; status: PipelineStatus; graph: ReturnType<typeof getMockGraph> extends infer G ? G : never }> {
  const status: PipelineStatus = {
    stage: "discovering",
    message: "Connector scanning cross-conversation paths…",
  };

  let graph;
  try {
    graph = await fetchGraph();
  } catch {
    graph = getMockGraph();
  }

  let sideQuests = discoverSideQuests(conversations, graph);

  status.stage = "critiquing";
  status.message = "Critic verifying SideQuest introductions…";

  for (const sq of sideQuests) {
    const { approved, reason } = await import("./crusoe").then((m) =>
      m.critiqueSideQuest(sq, conversations),
    );
    sq.approved = approved;
    sq.criticReason = reason;
  }

  sideQuests = sideQuests.filter((sq) => sq.approved);
  status.sideQuestsFound = sideQuests.length;
  status.stage = "complete";
  status.message =
    sideQuests.length > 0
      ? `SideQuest discovered — ${sideQuests.length} connection${sideQuests.length > 1 ? "s" : ""} found across ${conversations.length} conversations.`
      : "No cross-conversation connections yet — ingest more conversations.";

  return { sideQuests, status, graph };
}
