import OpenAI from "openai";
import type { ExtractedFact, Transcript } from "./types";

const CRUSOE_BASE_URL =
  process.env.CRUSOE_BASE_URL ?? "https://api.inference.crusoecloud.com/v1/";
const CRUSOE_MODEL = process.env.CRUSOE_MODEL ?? "meta-llama/Llama-3.3-70B-Instruct";

export function getCrusoeClient(): OpenAI | null {
  const apiKey = process.env.CRUSOE_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: CRUSOE_BASE_URL });
}

const EXTRACTION_SYSTEM = `You extract structured facts from meeting transcripts.
Return ONLY valid JSON: an array of objects with keys:
- type: "decision" | "commitment" | "blocker" | "question"
- text: short summary of the fact
- speaker: who said it (if known)
- quote: exact supporting quote from the transcript
- timestampStart: seconds (number or null)
- timestampEnd: seconds (number or null)
- confidence: 0-1

Rules:
- Every fact MUST include a verbatim quote from the transcript.
- Do not invent facts not present in the text.
- Prefer fewer, high-confidence facts.`;

export async function extractFactsWithCrusoe(
  transcript: Transcript,
): Promise<ExtractedFact[]> {
  const client = getCrusoeClient();
  if (!client) {
    return extractFactsMock(transcript);
  }

  const segmentHints = transcript.segments
    .map(
      (s) =>
        `[${s.start}s-${s.end}s] ${s.speaker ?? "Unknown"}: ${s.text}`,
    )
    .join("\n");

  const response = await client.chat.completions.create({
    model: CRUSOE_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM },
      {
        role: "user",
        content: `Extract facts from this transcript.\n\nSegments:\n${segmentHints}\n\nFull text:\n${transcript.text}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{"facts":[]}';
  const parsed = JSON.parse(raw) as { facts?: Omit<ExtractedFact, "id">[] };
  const facts = parsed.facts ?? (Array.isArray(parsed) ? parsed : []);

  return facts.map((fact, index) => ({
    ...fact,
    id: `fact-${transcript.id}-${index}`,
    confidence: fact.confidence ?? 0.8,
  }));
}

function extractFactsMock(transcript: Transcript): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  transcript.segments.forEach((segment, index) => {
    const lower = segment.text.toLowerCase();
    let type: ExtractedFact["type"] | null = null;

    if (lower.includes("decision:")) type = "decision";
    else if (lower.includes("commits to") || lower.includes("commit to"))
      type = "commitment";
    else if (lower.includes("blocked") || lower.includes("blocking"))
      type = "blocker";
    else if (lower.includes("open question") || lower.includes("?"))
      type = "question";

    if (!type) return;

    facts.push({
      id: `fact-${transcript.id}-${index}`,
      type,
      text: segment.text.replace(/^decision:\s*/i, "").trim(),
      speaker: segment.speaker,
      quote: segment.text,
      timestampStart: segment.start,
      timestampEnd: segment.end,
      confidence: 0.85,
    });
  });
  return facts;
}

const CRITIC_SYSTEM = `You are a strict fact-checker for meeting extractions.
Given a transcript and an extracted fact, verify the fact is supported by a verbatim quote in the transcript.
Return ONLY valid JSON: {"approved": boolean, "reason": string}
If not approved, reason must explain what evidence is missing. Use "BLOCKED" in reason when rejecting.`;

export async function critiqueFactWithCrusoe(
  transcript: Transcript,
  fact: ExtractedFact,
): Promise<{ approved: boolean; reason: string }> {
  const client = getCrusoeClient();
  if (!client) {
    return critiqueFactMock(transcript, fact);
  }

  const response = await client.chat.completions.create({
    model: CRUSOE_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CRITIC_SYSTEM },
      {
        role: "user",
        content: JSON.stringify({
          transcript: transcript.text,
          fact,
        }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { approved?: boolean; reason?: string };
  return {
    approved: parsed.approved ?? false,
    reason: parsed.reason ?? "Unable to verify",
  };
}

function critiqueFactMock(
  transcript: Transcript,
  fact: ExtractedFact,
): { approved: boolean; reason: string } {
  const supported = transcript.text.toLowerCase().includes(fact.quote.toLowerCase().slice(0, 20));
  if (supported && fact.quote.length > 10) {
    return { approved: true, reason: "Quote found in transcript." };
  }
  return {
    approved: false,
    reason: "BLOCKED — no supporting quote found in transcript.",
  };
}
