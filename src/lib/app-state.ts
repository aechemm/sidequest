import { loadStoredConversations } from "@/lib/conversation-store";
import { fetchGraph } from "@/lib/neo4j";
import { computeStats, runDiscovery } from "@/lib/pipeline";
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
  status: PipelineStatus | null;
  services: Record<string, boolean>;
  bandRoomUrl: string | null;
}

const EMPTY_STATS: NetworkStats = {
  people: 0,
  companies: 0,
  conversations: 0,
  connectionsDiscovered: 0,
};

const EMPTY_GRAPH: GraphData = { nodes: [], links: [] };

export async function getAppState(): Promise<AppState> {
  const conversations = await loadStoredConversations();

  const services = {
    crusoe: Boolean(process.env.CRUSOE_API_KEY),
    neo4j: Boolean(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
    plaud: Boolean(process.env.PLAUD_API_KEY && process.env.PLAUD_CLIENT_ID),
    band: Boolean(process.env.BAND_CHAT_ID || process.env.BAND_EXTRACTOR_ID),
  };
  const bandRoomUrl = process.env.BAND_ROOM_URL ?? null;

  let graph: GraphData = EMPTY_GRAPH;
  try {
    graph = await fetchGraph();
  } catch {
    graph = EMPTY_GRAPH;
  }

  if (conversations.length === 0) {
    return {
      conversations: [],
      sideQuests: [],
      graph,
      activities: [],
      stats: {
        ...EMPTY_STATS,
        people: graph.nodes.filter((n) => n.type === "Person").length,
        companies: graph.nodes.filter((n) => n.type === "Company").length,
      },
      status: null,
      services,
      bandRoomUrl,
    };
  }

  const discovery = await runDiscovery(conversations);
  const sideQuests: SideQuest[] = discovery.sideQuests;
  const activities: AgentActivityEvent[] = discovery.activities;
  const status: PipelineStatus | null = discovery.status;
  const stats: NetworkStats = discovery.stats;
  if (discovery.graph.nodes.length > 0) graph = discovery.graph;

  return {
    conversations,
    sideQuests,
    graph,
    activities,
    stats: stats ?? computeStats(conversations, graph, sideQuests),
    status,
    services,
    bandRoomUrl,
  };
}
