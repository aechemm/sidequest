import { loadStoredConversations } from "@/lib/conversation-store";
import { fetchGraph, getMockGraph } from "@/lib/neo4j";
import { runDemoMock, runDiscovery } from "@/lib/pipeline";
import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";
import type {
  AgentActivityEvent,
  Conversation,
  GraphData,
  NetworkStats,
  PipelineStatus,
  SideQuest,
} from "@/lib/types";

export interface AppState {
  conversations: Conversation[];
  sideQuests: SideQuest[];
  graph: GraphData;
  activities: AgentActivityEvent[];
  stats: NetworkStats;
  status: PipelineStatus;
  services: Record<string, boolean>;
  bandRoomUrl: string | null;
}

export async function getAppState(): Promise<AppState> {
  const stored = await loadStoredConversations();
  const conversations =
    stored.length > 0
      ? stored
      : DEMO_CONVERSATIONS.map((c) => ({
          ...c,
          processingStatus: "complete" as const,
        }));

  let graph: GraphData;
  try {
    graph = await fetchGraph();
    if (graph.nodes.length === 0) graph = getMockGraph();
  } catch {
    graph = getMockGraph();
  }

  // Prefer live discovery when we have stored Plaud conversations
  let sideQuests: SideQuest[] = [];
  let activities: AgentActivityEvent[] = [];
  let status: PipelineStatus;
  let stats: NetworkStats;

  if (stored.length > 0) {
    const discovery = await runDiscovery(conversations);
    sideQuests = discovery.sideQuests;
    activities = discovery.activities;
    status = discovery.status;
    stats = discovery.stats;
    if (discovery.graph.nodes.length > 0) graph = discovery.graph;
  } else {
    const demo = await runDemoMock(DEMO_CONVERSATIONS);
    sideQuests = demo.sideQuests;
    activities = demo.activities;
    status = demo.status;
    stats = demo.stats;
    graph = demo.graph;
  }

  return {
    conversations,
    sideQuests,
    graph,
    activities,
    stats,
    status,
    services: {
      crusoe: Boolean(process.env.CRUSOE_API_KEY),
      neo4j: Boolean(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
      plaud: Boolean(process.env.PLAUD_API_KEY && process.env.PLAUD_CLIENT_ID),
      band: Boolean(process.env.BAND_CHAT_ID || process.env.BAND_EXTRACTOR_ID),
    },
    bandRoomUrl: process.env.BAND_ROOM_URL ?? null,
  };
}
