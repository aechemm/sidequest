import type { Transcript } from "./types";

const PLAUD_API_BASE =
  process.env.PLAUD_API_BASE ??
  "https://platform-us.plaud.ai/developer/api/open/partner";

export function isPlaudConfigured(): boolean {
  return Boolean(process.env.PLAUD_CLIENT_ID && process.env.PLAUD_API_KEY);
}

function plaudHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Client-Id": process.env.PLAUD_CLIENT_ID!,
    "X-Client-Api-Key": process.env.PLAUD_API_KEY!,
  };
}

export async function submitPlaudTranscription(
  fileUrl: string,
): Promise<{ transcriptionId: string }> {
  if (!isPlaudConfigured()) {
    throw new Error("Plaud credentials not configured");
  }

  const response = await fetch(`${PLAUD_API_BASE}/ai/transcriptions/`, {
    method: "POST",
    headers: plaudHeaders(),
    body: JSON.stringify({
      file_url: fileUrl,
      params: {
        transcribe: { language: "auto", model: "plaud-fast-whisper" },
        vad: { decode_silence: false },
        diarization: { enabled: true, return_embedding: false },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Plaud submit failed: ${text}`);
  }

  const data = (await response.json()) as { transcription_id: string };
  return { transcriptionId: data.transcription_id };
}

export async function pollPlaudTranscription(
  transcriptionId: string,
): Promise<{ status: string; transcript?: Transcript }> {
  if (!isPlaudConfigured()) {
    throw new Error("Plaud credentials not configured");
  }

  const response = await fetch(
    `${PLAUD_API_BASE}/ai/transcriptions/${transcriptionId}`,
    { headers: plaudHeaders() },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Plaud poll failed: ${text}`);
  }

  const data = (await response.json()) as {
    status: string;
    data?: {
      text: string;
      language?: string;
      duration?: number;
      segments?: Array<{
        start: number;
        end: number;
        text: string;
        speaker?: string;
      }>;
    };
  };

  if (data.status !== "SUCCESS" || !data.data) {
    return { status: data.status };
  }

  return {
    status: data.status,
    transcript: {
      id: transcriptionId,
      text: data.data.text,
      language: data.data.language,
      duration: data.data.duration,
      segments: data.data.segments ?? [],
      source: "plaud",
    },
  };
}

export async function uploadAudioToPlaud(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  if (!isPlaudConfigured()) {
    throw new Error("Plaud credentials not configured");
  }

  const presignResponse = await fetch(
    `${PLAUD_API_BASE}/files/upload/generate-presigned-urls`,
    {
      method: "POST",
      headers: plaudHeaders(),
      body: JSON.stringify({
        file_name: filename,
        file_size: buffer.length,
      }),
    },
  );

  if (!presignResponse.ok) {
    throw new Error(`Plaud presign failed: ${await presignResponse.text()}`);
  }

  const presign = (await presignResponse.json()) as {
    file_id: string;
    upload_id: string;
    presigned_urls: Array<{ part_number: number; presigned_url: string }>;
  };

  const part = presign.presigned_urls[0];
  const uploadResponse = await fetch(part.presigned_url, {
    method: "PUT",
    body: new Uint8Array(buffer),
  });

  if (!uploadResponse.ok) {
    throw new Error("Plaud part upload failed");
  }

  const etag = uploadResponse.headers.get("ETag")?.replace(/"/g, "") ?? "";

  const completeResponse = await fetch(
    `${PLAUD_API_BASE}/files/upload/complete-upload`,
    {
      method: "POST",
      headers: plaudHeaders(),
      body: JSON.stringify({
        file_id: presign.file_id,
        upload_id: presign.upload_id,
        parts: [{ part_number: part.part_number, etag }],
      }),
    },
  );

  if (!completeResponse.ok) {
    throw new Error(`Plaud complete failed: ${await completeResponse.text()}`);
  }

  const complete = (await completeResponse.json()) as { download_url: string };
  return complete.download_url;
}
