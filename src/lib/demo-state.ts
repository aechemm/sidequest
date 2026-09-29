import { runDemoMock } from "@/lib/pipeline";
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
  const demo = await runDemoMock(DEMO_CONVERSATIONS);
  return {
    conversations: DEMO_CONVERSATIONS.map((c) => ({
      ...c,
      processingStatus: "complete" as const,
    })),
    sideQuests: demo.sideQuests,
    graph: demo.graph,
    activities: demo.activities,
    stats: demo.stats,
    status: demo.status,
    services: {
      crusoe: Boolean(process.env.CRUSOE_API_KEY),
      neo4j: Boolean(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
      plaud: Boolean(process.env.PLAUD_API_KEY && process.env.PLAUD_CLIENT_ID),
      band: Boolean(process.env.BAND_CHAT_ID || process.env.BAND_EXTRACTOR_ID),
    },
    bandRoomUrl: process.env.BAND_ROOM_URL ?? null,
  };
}
