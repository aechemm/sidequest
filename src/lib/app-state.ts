import { loadStoredConversations } from "@/lib/conversation-store";
import {
  loadDiscoveryCache,
  saveDiscoveryCache,
} from "@/lib/discovery-cache";
import { fetchGraph } from "@/lib/neo4j";
import { computeStats, runDiscovery } from "@/lib/pipeline";
import type {
  AgentActivityEvent,
  GraphData,
  NetworkStats,
  PipelineStatus,
  SideQuest,
} from "@/lib/types";

export interface AppState {
  conversations: Awaited<ReturnType<typeof loadStoredConversations>>;
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

/** Prevent stampedes when many tabs hit a cold cache at once. */
let discoveryInFlight: Promise<void> | null = null;

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

  const cached = await loadDiscoveryCache(conversations);
  if (cached) {
    return {
      conversations,
      sideQuests: cached.sideQuests,
      graph,
      activities: cached.activities,
      stats: {
        ...cached.stats,
        conversations: conversations.length,
        people:
          cached.stats.people ||
          graph.nodes.filter((n) => n.type === "Person").length,
        companies:
          cached.stats.companies ||
          graph.nodes.filter((n) => n.type === "Company").length,
      },
      status: cached.status,
      services,
      bandRoomUrl,
    };
  }

  if (!discoveryInFlight) {
    discoveryInFlight = (async () => {
      try {
        const discovery = await runDiscovery(conversations);
        await saveDiscoveryCache({
          conversations,
          sideQuests: discovery.sideQuests,
          activities: discovery.activities,
          stats: discovery.stats,
          status: discovery.status,
        });
      } finally {
        discoveryInFlight = null;
      }
    })();
  }

  // Don't block the page on a multi-minute AI pass — show conversations now.
  void discoveryInFlight;

  return {
    conversations,
    sideQuests: [],
    graph,
    activities: [],
    stats: {
      ...EMPTY_STATS,
      conversations: conversations.length,
      people: graph.nodes.filter((n) => n.type === "Person").length,
      companies: graph.nodes.filter((n) => n.type === "Company").length,
    },
    status: {
      stage: "discovering",
      message: "Looking for introductions in the background…",
    },
    services,
    bandRoomUrl,
  };
}
