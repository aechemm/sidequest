import { runPipeline } from "@/lib/pipeline";
import { SAMPLE_TRANSCRIPT } from "@/lib/sample-transcript";
import type { Transcript } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: Transcript;
      meetingId?: string;
      useMock?: boolean;
    };

    const transcript =
      body.transcript ?? (body.useMock ? SAMPLE_TRANSCRIPT : null);
    if (!transcript) {
      return Response.json({ error: "transcript required" }, { status: 400 });
    }

    const meetingId = body.meetingId ?? transcript.id;
    const result = await runPipeline(transcript, meetingId);

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed";
    return Response.json(
      {
        error: message,
        status: {
          stage: "error",
          message,
        },
      },
      { status: 500 },
    );
  }
}
