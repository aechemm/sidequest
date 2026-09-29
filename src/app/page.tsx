import { SideQuestShell, type SideQuestInitialState } from "@/components/sidequest-shell";
import { runDemoMock } from "@/lib/pipeline";
import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";

async function loadInitialState(): Promise<SideQuestInitialState> {
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
      plaud: Boolean(process.env.PLAUD_API_KEY),
      band: Boolean(process.env.BAND_CHAT_ID || process.env.BAND_EXTRACTOR_ID),
    },
    bandRoomUrl: process.env.BAND_ROOM_URL ?? null,
  };
}

export default async function Home() {
  const initial = await loadInitialState();
  return <SideQuestShell initial={initial} />;
}
