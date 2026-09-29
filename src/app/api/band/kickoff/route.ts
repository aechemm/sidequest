import { spawn } from "node:child_process";
import path from "node:path";
import type { Transcript } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    transcript: Transcript;
    meetingId?: string;
  };

  if (!body.transcript) {
    return Response.json({ error: "transcript required" }, { status: 400 });
  }

  const coordinatorPath = path.join(process.cwd(), "agents", "coordinator.py");
  const payload = JSON.stringify({
    transcript: body.transcript,
    meetingId: body.meetingId ?? body.transcript.id,
  });

  return new Promise<Response>((resolve) => {
    const proc = spawn("python3", [coordinatorPath], {
      env: { ...process.env, TALKTRACE_PAYLOAD: payload },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(
          Response.json({
            ok: true,
            message: stdout.trim() || "Kickoff posted to Band room",
            bandRoomUrl: process.env.BAND_ROOM_URL ?? null,
          }),
        );
      } else {
        resolve(
          Response.json(
            {
              ok: false,
              error: stderr.trim() || "Coordinator failed",
              hint: "Start Band agents with: cd agents && pip install -r requirements.txt",
              fallback: "Use Run Pipeline to process without Band",
            },
            { status: 503 },
          ),
        );
      }
    });
  });
}
