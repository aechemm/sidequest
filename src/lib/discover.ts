import type { Conversation, GraphData, SideQuest } from "./types";

type PersonTopic = { topic: string; relation: string; convId: string };

const PROVIDER_RELATIONS = new Set([
  "PROVIDES",
  "WORKS_ON",
  "BUILDS",
  "OFFERS",
]);
const NEED_RELATIONS = new Set(["HAS_PROBLEM", "NEEDS"]);
const SEEK_RELATIONS = new Set(["SEEKS", "LOOKING_FOR", "INTERESTED_IN"]);

function topicTokens(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
}

function topicsRelated(a: string, b: string): boolean {
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const ta = topicTokens(a);
  const tb = topicTokens(b);
  if (ta.some((t) => tb.includes(t))) return true;
  const bridge =
    /private|vpc|on-prem|phi|patient|inference|healthcare|hospital|medical|data|ai|ml|security|startup|accelerator/i;
  return bridge.test(a) && bridge.test(b);
}

function buildHighlightPath(
  graph: GraphData,
  people: string[],
  topics: string[],
): GraphData {
  const labels = new Set([...people, ...topics]);
  const nodes = graph.nodes.filter((n) => labels.has(n.label));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const links = graph.links.filter(
    (l) => nodeIds.has(l.source) && nodeIds.has(l.target),
  );
  return { nodes, links };
}

function evidenceFor(
  person: string,
  entry: PersonTopic,
  conversations: Conversation[],
): string {
  const conv = conversations.find((c) => c.id === entry.convId);
  if (conv?.summary) return `${person}: ${conv.summary}`;
  return `${person} discussed ${entry.topic}`;
}

export function discoverSideQuests(
  conversations: Conversation[],
  graph: GraphData,
): SideQuest[] {
  const people = graph.nodes.filter((n) => n.type === "Person");
  const links = graph.links;

  const personTopics = new Map<string, PersonTopic[]>();

  for (const link of links) {
    const sourceNode = graph.nodes.find((n) => n.id === link.source);
    const targetNode = graph.nodes.find((n) => n.id === link.target);
    if (!sourceNode || !targetNode) continue;

    if (sourceNode.type === "Person" && targetNode.type === "Topic") {
      const list = personTopics.get(sourceNode.label) ?? [];
      list.push({
        topic: targetNode.label,
        relation: link.type,
        convId: String(targetNode.properties?.conversationId ?? ""),
      });
      personTopics.set(sourceNode.label, list);
    }
  }

  const sideQuests: SideQuest[] = [];
  const seen = new Set<string>();

  const providers: Array<{ person: string; entry: PersonTopic }> = [];
  const needers: Array<{ person: string; entry: PersonTopic }> = [];
  const seekers: Array<{ person: string; entry: PersonTopic }> = [];

  for (const person of people) {
    for (const entry of personTopics.get(person.label) ?? []) {
      if (PROVIDER_RELATIONS.has(entry.relation)) {
        providers.push({ person: person.label, entry });
      }
      if (NEED_RELATIONS.has(entry.relation)) {
        needers.push({ person: person.label, entry });
      }
      if (SEEK_RELATIONS.has(entry.relation)) {
        seekers.push({ person: person.label, entry });
      }
    }
  }

  for (const provider of providers) {
    for (const needer of needers) {
      if (provider.person === needer.person) continue;
      if (!topicsRelated(provider.entry.topic, needer.entry.topic)) continue;

      const key = [provider.person, needer.person].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      const bonus = seekers
        .filter(
          (s) =>
            s.person !== provider.person &&
            s.person !== needer.person &&
            (topicsRelated(s.entry.topic, provider.entry.topic) ||
              topicsRelated(s.entry.topic, needer.entry.topic)),
        )
        .map((s) => s.person)
        .filter((name, i, arr) => arr.indexOf(name) === i)
        .slice(0, 2);

      sideQuests.push({
        id: `sq-${key.replace(/\W+/g, "-").toLowerCase()}`,
        title: `Introduce ${provider.person} to ${needer.person}`,
        people: [provider.person, needer.person],
        bonusPeople: bonus.length > 0 ? bonus : undefined,
        reason: `${provider.person}'s work on ${provider.entry.topic} may help with ${needer.person}'s need around ${needer.entry.topic}.`,
        evidence: [
          evidenceFor(provider.person, provider.entry, conversations),
          evidenceFor(needer.person, needer.entry, conversations),
        ],
        confidence: "HIGH",
        pathDescription: `${provider.person} → ${provider.entry.relation} → ${provider.entry.topic} ↔ ${needer.entry.topic} ← ${needer.entry.relation} ← ${needer.person}`,
        conversationIds: conversations.map((c) => c.id),
        approved: true,
        draftIntro: `Hi ${provider.person} and ${needer.person} — I think you two should meet.

${provider.person}, you mentioned ${provider.entry.topic}. ${needer.person}, you shared a need around ${needer.entry.topic}.

You seem to be solving each other's problem. Worth a short intro?`,
        highlightPath: buildHighlightPath(
          graph,
          [provider.person, needer.person, ...bonus],
          [provider.entry.topic, needer.entry.topic],
        ),
      });
    }
  }

  for (const seeker of seekers) {
    const related = [...providers, ...needers].filter(
      (p) =>
        p.person !== seeker.person &&
        topicsRelated(seeker.entry.topic, p.entry.topic),
    );
    const uniquePeople = related
      .map((r) => r.person)
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .slice(0, 3);
    if (uniquePeople.length === 0) continue;

    const key = `seek-${seeker.person}-${uniquePeople.join("-")}`;
    if (seen.has(key)) continue;
    seen.add(key);

    sideQuests.push({
      id: `sq-${key.replace(/\W+/g, "-").toLowerCase()}`,
      title: `Loop in ${seeker.person}`,
      people: [seeker.person],
      bonusPeople: uniquePeople,
      reason: `${seeker.person} is looking for ${seeker.entry.topic}, which overlaps with people already in your network.`,
      evidence: [
        evidenceFor(seeker.person, seeker.entry, conversations),
        ...related
          .slice(0, 2)
          .map((r) => evidenceFor(r.person, r.entry, conversations)),
      ],
      confidence: "MEDIUM",
      pathDescription: `${seeker.person} → ${seeker.entry.relation} → ${seeker.entry.topic} ↔ ${uniquePeople.join(", ")}`,
      conversationIds: conversations.map((c) => c.id),
      approved: true,
      draftIntro: `Hi ${seeker.person} — you mentioned looking for ${seeker.entry.topic}.

I recently spoke with ${uniquePeople.join(" and ")}, who seem relevant. Worth a group intro?`,
      highlightPath: buildHighlightPath(
        graph,
        [seeker.person, ...uniquePeople],
        [seeker.entry.topic, ...related.slice(0, 2).map((r) => r.entry.topic)],
      ),
    });
  }

  return sideQuests;
}
