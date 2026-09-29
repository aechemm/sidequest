import { runDiscovery } from "@/lib/pipeline";
import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";
import type { Conversation } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      conversations?: Conversation[];
      useDemo?: boolean;
    };

    const conversations = body.useDemo
      ? DEMO_CONVERSATIONS
      : (body.conversations ?? []);

    if (conversations.length === 0) {
      return Response.json({ error: "No conversations provided" }, { status: 400 });
    }

    const result = await runDiscovery(conversations);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
