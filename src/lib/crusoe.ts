import OpenAI from "openai";
import type { Conversation, ExtractedEntity, SideQuest } from "./types";

const CRUSOE_BASE_URL =
  process.env.CRUSOE_BASE_URL ?? "https://api.inference.crusoecloud.com/v1/";
const CRUSOE_MODEL =
  process.env.CRUSOE_MODEL ?? "meta-llama/Llama-3.3-70B-Instruct";

export function getCrusoeClient(): OpenAI | null {
  const apiKey = process.env.CRUSOE_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: CRUSOE_BASE_URL });
}

const EXTRACTION_SYSTEM = `You extract people, skills, problems, products, needs, and offers from real-world conversations.
Return ONLY valid JSON: {"entities": [{"person":"Name","relation":"WORKS_ON|HAS_PROBLEM|SEEKS|PROVIDES|NEEDS|BUILDS|OFFERS","topic":"short label","quote":"verbatim quote","timestampStart":number|null,"timestampEnd":number|null,"confidence":0-1}]}
Rules:
- person = who said it or who it refers to
- topic = concise noun phrase (e.g. "Private VPC Inference", "Healthcare AI")
- Every entity MUST have a verbatim quote from the conversation
- Do not invent entities not present in the text`;

export async function extractEntities(
  conversation: Conversation,
): Promise<ExtractedEntity[]> {
  const client = getCrusoeClient();
  if (!client) return extractEntitiesMock(conversation);

  try {
    return await extractEntitiesLive(conversation, client);
  } catch {
    return extractEntitiesMock(conversation);
  }
}

async function extractEntitiesLive(
  conversation: Conversation,
  client: OpenAI,
): Promise<ExtractedEntity[]> {
  const segmentHints = conversation.segments
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
        content: `Conversation: ${conversation.title}\n\nSegments:\n${segmentHints}\n\nFull:\n${conversation.text}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{"entities":[]}';
  const parsed = JSON.parse(raw) as {
    entities?: Omit<ExtractedEntity, "id">[];
  };
  const entities = parsed.entities ?? [];

  return entities.map((e, i) => ({
    ...e,
    id: `ent-${conversation.id}-${i}`,
    conversationId: conversation.id,
    confidence: e.confidence ?? 0.8,
  }));
}

function extractEntitiesMock(conversation: Conversation): ExtractedEntity[] {
  const rules: Array<{
    match: RegExp;
    person: string;
    relation: ExtractedEntity["relation"];
    topic: string;
  }> = [
    {
      match: /inference platform.*vpc|vpc/i,
      person: "Alice",
      relation: "PROVIDES",
      topic: "Private VPC Inference",
    },
    {
      match: /patient data|on-prem|private ai/i,
      person: "Bob",
      relation: "HAS_PROBLEM",
      topic: "Private PHI Processing",
    },
    {
      match: /healthcare ai/i,
      person: "Charlie",
      relation: "SEEKS",
      topic: "Healthcare AI Companies",
    },
  ];

  const entities: ExtractedEntity[] = [];
  conversation.segments.forEach((segment, index) => {
    for (const rule of rules) {
      if (!rule.match.test(segment.text)) continue;
      const speaker = segment.speaker ?? rule.person;
      entities.push({
        id: `ent-${conversation.id}-${index}-${rule.relation}`,
        person: speaker,
        relation: rule.relation,
        topic: rule.topic,
        quote: segment.text,
        conversationId: conversation.id,
        timestampStart: segment.start,
        timestampEnd: segment.end,
        confidence: 0.9,
      });
    }
  });
  return entities;
}

export async function critiqueSideQuest(
  sideQuest: SideQuest,
  conversations: Conversation[],
): Promise<{ approved: boolean; reason: string }> {
  const client = getCrusoeClient();
  if (!client) return critiqueSideQuestMock(sideQuest, conversations);

  try {
    return await critiqueSideQuestLive(sideQuest, conversations, client);
  } catch {
    return critiqueSideQuestMock(sideQuest, conversations);
  }
}

async function critiqueSideQuestLive(
  sideQuest: SideQuest,
  conversations: Conversation[],
  client: OpenAI,
): Promise<{ approved: boolean; reason: string }> {
  const response = await client.chat.completions.create({
    model: CRUSOE_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'Verify a SideQuest introduction is supported by recorded conversations. Return {"approved":bool,"reason":str}. Use BLOCKED in reason when rejecting.',
      },
      {
        role: "user",
        content: JSON.stringify({ sideQuest, conversations }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as { approved: boolean; reason: string };
}

function critiqueSideQuestMock(
  sideQuest: SideQuest,
  conversations: Conversation[],
): { approved: boolean; reason: string } {
  const allText = conversations.map((c) => c.text).join(" ");
  const peopleMentioned = sideQuest.people.every((p) =>
    allText.toLowerCase().includes(p.toLowerCase()),
  );
  if (peopleMentioned && sideQuest.people.length >= 2) {
    return {
      approved: true,
      reason: "All people and claims supported by recorded conversations.",
    };
  }
  return {
    approved: false,
    reason: "BLOCKED — connection not supported by recorded conversations.",
  };
}

export async function draftIntroduction(
  sideQuest: SideQuest,
): Promise<string> {
  const client = getCrusoeClient();
  if (!client) {
    return sideQuest.draftIntro;
  }

  const response = await client.chat.completions.create({
    model: CRUSOE_MODEL,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "Write a warm, concise 3-sentence intro email connecting these people based on the SideQuest. No fluff.",
      },
      { role: "user", content: JSON.stringify(sideQuest) },
    ],
  });

  return (
    response.choices[0]?.message?.content?.trim() ?? sideQuest.draftIntro
  );
}
