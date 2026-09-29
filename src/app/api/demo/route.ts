import { runDemoMock } from "@/lib/pipeline";
import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";

/** Quick health check: open http://127.0.0.1:4318/api/demo in a browser */
export async function GET() {
  const result = await runDemoMock(DEMO_CONVERSATIONS);
  return Response.json({
    ok: true,
    sideQuestCount: result.sideQuests.length,
    firstSideQuest: result.sideQuests[0]?.title ?? null,
    message: result.status.message,
  });
}
