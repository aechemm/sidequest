import type { Conversation, GraphData, SideQuest } from "./types";

/** Topic clusters that bridge across demo conversations */
const TOPIC_BRIDGES: Array<{
  topics: string[];
  match: (t: string) => boolean;
}> = [
  {
    topics: ["Private VPC Inference", "Private PHI Processing"],
    match: (t) =>
      /private|vpc|on-prem|phi|patient|inference/i.test(t),
  },
  {
    topics: ["Healthcare AI Companies", "Private PHI Processing"],
    match: (t) => /healthcare|phi|hospital|medical/i.test(t),
  },
];

export function discoverSideQuests(
  conversations: Conversation[],
  graph: GraphData,
): SideQuest[] {
  const people = graph.nodes.filter((n) => n.type === "Person");
  const topics = graph.nodes.filter((n) => n.type === "Topic");
  const links = graph.links;

  const personTopics = new Map<
    string,
    Array<{ topic: string; relation: string; convId: string }>
  >();

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

  // Alice ↔ Bob: provider meets problem (private inference / PHI)
  const alice = people.find((p) => p.label === "Alice");
  const bob = people.find((p) => p.label === "Bob");
  const charlie = people.find((p) => p.label === "Charlie");

  if (alice && bob) {
    const aliceTopics = personTopics.get("Alice") ?? [];
    const bobTopics = personTopics.get("Bob") ?? [];
    const providesPrivate = aliceTopics.some(
      (t) => t.relation === "PROVIDES" || t.relation === "WORKS_ON",
    );
    const needsPrivate = bobTopics.some(
      (t) => t.relation === "HAS_PROBLEM" || t.relation === "NEEDS",
    );

    if (providesPrivate && needsPrivate) {
      sideQuests.push({
        id: "sq-alice-bob",
        title: "Introduce Alice to Bob",
        people: ["Alice", "Bob"],
        bonusPeople: charlie ? ["Charlie"] : undefined,
        reason:
          "Alice's private-inference technology potentially addresses Bob's patient-data constraint.",
        pathDescription:
          "Alice → PROVIDES → Private VPC Inference ↔ Private PHI Processing ← HAS_PROBLEM ← Bob",
        conversationIds: conversations.map((c) => c.id),
        approved: true,
        draftIntro: `Hi Alice and Bob — I think you two should meet.

Alice, you mentioned building inference that runs inside a customer's VPC with no data leaving their environment. Bob, you shared that your hospital can't send patient data off-prem and needs private AI.

You seem to be solving each other's problem. Worth a 10-minute chat at Hack Day?`,
        highlightPath: buildHighlightPath(graph, ["Alice", "Bob"], [
          "Private VPC Inference",
          "Private PHI Processing",
        ]),
      });
    }
  }

  if (charlie && (alice || bob)) {
    const charlieTopics = personTopics.get("Charlie") ?? [];
    const seeksHealthcare = charlieTopics.some((t) => t.relation === "SEEKS");
    if (seeksHealthcare) {
      sideQuests.push({
        id: "sq-charlie-bonus",
        title: "Loop in Charlie for healthcare AI",
        people: charlie ? ["Charlie"] : [],
        bonusPeople: ["Alice", "Bob"],
        reason:
          "Charlie is actively seeking healthcare AI companies — Alice and Bob's conversation thread is healthcare-relevant.",
        pathDescription:
          "Charlie → SEEKS → Healthcare AI ↔ Private PHI Processing ← Bob; Alice → PROVIDES → Private Inference",
        conversationIds: conversations.map((c) => c.id),
        approved: true,
        draftIntro: `Hi Charlie — you mentioned looking for healthcare AI companies for your accelerator.

I just connected Alice (private VPC inference) and Bob (hospital PHI constraints) — both are building in healthcare AI infrastructure. Might be worth a group intro?`,
        highlightPath: buildHighlightPath(
          graph,
          ["Charlie", "Bob", "Alice"],
          ["Healthcare AI Companies", "Private PHI Processing", "Private VPC Inference"],
        ),
      });
    }
  }

  return sideQuests;
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
