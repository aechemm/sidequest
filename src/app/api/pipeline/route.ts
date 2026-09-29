import { ingestConversation, runDiscovery } from "@/lib/pipeline";
import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";
import type { AgentActivityEvent, Conversation } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      conversation?: Conversation;
      conversations?: Conversation[];
      action?: "ingest" | "discover" | "demo";
    };

    if (body.action === "discover" || body.action === "demo") {
      const conversations =
        body.conversations ??
        (body.action === "demo" ? DEMO_CONVERSATIONS : []);

      if (conversations.length === 0) {
        return Response.json(
          { error: "conversations required for discovery" },
          { status: 400 },
        );
      }

      const allActivities: AgentActivityEvent[] = [];

      if (body.action === "demo") {
        for (const conv of conversations) {
          const ingested = await ingestConversation(conv);
          allActivities.push(...ingested.activities);
        }
      }

      const result = await runDiscovery(conversations);
      return Response.json({
        ...result,
        activities: [...allActivities, ...result.activities],
      });
    }

    const conversation = body.conversation;
    if (!conversation) {
      return Response.json({ error: "conversation required" }, { status: 400 });
    }

    const result = await ingestConversation(conversation);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed";
    return Response.json(
      { error: message, status: { stage: "error", message } },
      { status: 500 },
    );
  }
}
