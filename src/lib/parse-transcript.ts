import type { Conversation } from "./types";

/** Parse "Name: hello\nOther: hi" into segments */
export function parseManualTranscript(
  title: string,
  participant: string,
  company: string,
  transcript: string,
): Conversation {
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const segments = lines.map((line, index) => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    const speaker = match?.[1]?.trim() ?? participant ?? "Speaker";
    const text = match?.[2]?.trim() ?? line;
    return {
      start: index * 5,
      end: index * 5 + 4,
      speaker,
      text,
    };
  });

  return {
    id: `conv-manual-${Date.now()}`,
    title,
    text: segments.map((s) => `${s.speaker}: ${s.text}`).join("\n"),
    segments,
    source: "manual",
    participant,
    company: company || undefined,
    recordedAt: new Date().toISOString(),
    processingStatus: "pending",
  };
}
