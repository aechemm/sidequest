import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Conversation,
  GraphData,
  SideQuest,
} from "@/lib/types";

export interface PersonAlias {
  name: string;
  company?: string;
}

export type PersonAliasMap = Record<string, PersonAlias>;

const DATA_DIR = path.join(process.cwd(), "data");
const ALIASES_PATH = path.join(DATA_DIR, "person-aliases.json");

export async function loadPersonAliases(): Promise<PersonAliasMap> {
  try {
    const raw = await readFile(ALIASES_PATH, "utf-8");
    return JSON.parse(raw) as PersonAliasMap;
  } catch {
    return {};
  }
}

export async function savePersonAliases(aliases: PersonAliasMap): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ALIASES_PATH, JSON.stringify(aliases, null, 2), "utf-8");
}

export function resolvePersonName(
  original: string,
  aliases: PersonAliasMap,
): string {
  const alias = aliases[original]?.name?.trim();
  return alias || original;
}

function replaceNames(text: string, aliases: PersonAliasMap): string {
  let next = text;
  // Longer keys first so "Speaker 1" wins over "Speaker"
  const keys = Object.keys(aliases).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const name = aliases[key]?.name?.trim();
    if (!name || name === key) continue;
    next = next.split(key).join(name);
  }
  return next;
}

export function collectPeople(
  conversations: Conversation[],
  sideQuests: SideQuest[],
  graph: GraphData,
): string[] {
  const people = new Set<string>();
  for (const c of conversations) {
    if (c.participant?.trim()) people.add(c.participant.trim());
    for (const s of c.segments) {
      if (s.speaker?.trim()) people.add(s.speaker.trim());
    }
  }
  for (const q of sideQuests) {
    for (const p of q.people) people.add(p);
    for (const p of q.bonusPeople ?? []) people.add(p);
  }
  for (const n of graph.nodes) {
    if (n.type === "Person" && n.label.trim()) people.add(n.label.trim());
  }
  return [...people].sort((a, b) => a.localeCompare(b));
}

export function applyAliasesToConversation(
  conversation: Conversation,
  aliases: PersonAliasMap,
): Conversation {
  const participant = conversation.participant
    ? resolvePersonName(conversation.participant, aliases)
    : conversation.participant;
  const companyFromAlias = conversation.participant
    ? aliases[conversation.participant]?.company?.trim()
    : undefined;
  return {
    ...conversation,
    participant,
    company: companyFromAlias || conversation.company,
    text: replaceNames(conversation.text, aliases),
    summary: conversation.summary
      ? replaceNames(conversation.summary, aliases)
      : conversation.summary,
    segments: conversation.segments.map((s) => ({
      ...s,
      speaker: s.speaker ? resolvePersonName(s.speaker, aliases) : s.speaker,
      text: replaceNames(s.text, aliases),
    })),
  };
}

export function applyAliasesToSideQuest(
  sideQuest: SideQuest,
  aliases: PersonAliasMap,
): SideQuest {
  return {
    ...sideQuest,
    title: replaceNames(sideQuest.title, aliases),
    people: sideQuest.people.map((p) => resolvePersonName(p, aliases)),
    bonusPeople: sideQuest.bonusPeople?.map((p) =>
      resolvePersonName(p, aliases),
    ),
    reason: replaceNames(sideQuest.reason, aliases),
    evidence: sideQuest.evidence.map((e) => replaceNames(e, aliases)),
    pathDescription: replaceNames(sideQuest.pathDescription, aliases),
    draftIntro: replaceNames(sideQuest.draftIntro, aliases),
    criticReason: sideQuest.criticReason
      ? replaceNames(sideQuest.criticReason, aliases)
      : sideQuest.criticReason,
    highlightPath: sideQuest.highlightPath
      ? applyAliasesToGraph(sideQuest.highlightPath, aliases)
      : sideQuest.highlightPath,
  };
}

export function applyAliasesToGraph(
  graph: GraphData,
  aliases: PersonAliasMap,
): GraphData {
  return {
    nodes: graph.nodes.map((n) => {
      if (n.type !== "Person") return n;
      const name = resolvePersonName(n.label, aliases);
      const company = aliases[n.label]?.company?.trim();
      return {
        ...n,
        label: name,
        properties: {
          ...n.properties,
          name,
          ...(company ? { company } : {}),
        },
      };
    }),
    links: graph.links,
  };
}
