import { runDemoMock } from "@/lib/pipeline";
import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";

/** Internal sample pipeline — not linked from the product UI. */
export async function GET() {
  const result = await runDemoMock(DEMO_CONVERSATIONS);
  return Response.json({
    ok: true,
    sideQuestCount: result.sideQuests.length,
    firstSideQuest: result.sideQuests[0]?.title ?? null,
    message: result.status.message,
  });
}
