import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";
import { submitPlaudTranscription, uploadAudioToPlaud } from "@/lib/plaud";
import type { Conversation } from "@/lib/types";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      useMock?: boolean;
      useDemo?: boolean;
      fileUrl?: string;
    };

    if (body.useDemo) {
      return Response.json({ mode: "demo", conversations: DEMO_CONVERSATIONS });
    }

    if (body.useMock && DEMO_CONVERSATIONS[0]) {
      return Response.json({
        mode: "mock",
        conversation: DEMO_CONVERSATIONS[0],
      });
    }

    if (body.fileUrl) {
      const { transcriptionId } = await submitPlaudTranscription(body.fileUrl);
      return Response.json({ mode: "plaud", transcriptionId });
    }

    return Response.json({ error: "Provide useDemo, useMock, or fileUrl" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "New conversation");

  if (!(file instanceof File)) {
    return Response.json({ error: "No audio file provided" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadUrl = await uploadAudioToPlaud(buffer, file.name);
    const { transcriptionId } = await submitPlaudTranscription(downloadUrl);
    return Response.json({ mode: "plaud", transcriptionId, title });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    if (message.includes("not configured")) {
      return Response.json({
        mode: "mock",
        conversation: {
          ...DEMO_CONVERSATIONS[0],
          id: `conv-${Date.now()}`,
          title,
        },
        notice: "Plaud not configured — using sample conversation",
      });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
