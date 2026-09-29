import { SAMPLE_TRANSCRIPT } from "@/lib/sample-transcript";
import { submitPlaudTranscription, uploadAudioToPlaud } from "@/lib/plaud";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { useMock?: boolean; fileUrl?: string };

    if (body.useMock) {
      return Response.json({
        mode: "mock",
        transcript: SAMPLE_TRANSCRIPT,
      });
    }

    if (body.fileUrl) {
      const { transcriptionId } = await submitPlaudTranscription(body.fileUrl);
      return Response.json({ mode: "plaud", transcriptionId });
    }

    return Response.json({ error: "Provide useMock or fileUrl" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No audio file provided" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadUrl = await uploadAudioToPlaud(buffer, file.name);
    const { transcriptionId } = await submitPlaudTranscription(downloadUrl);
    return Response.json({ mode: "plaud", transcriptionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    if (message.includes("not configured")) {
      return Response.json({
        mode: "mock",
        transcript: SAMPLE_TRANSCRIPT,
        notice: "Plaud not configured — using sample transcript",
      });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
