import neo4j, { type Driver } from "neo4j-driver";
import type {
  CriticVerdict,
  ExtractedEntity,
  GraphData,
  GraphLink,
  GraphNode,
} from "./types";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver | null {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME ?? "neo4j";
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !password) return null;

  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }
  return driver;
}

export async function verifyNeo4jConnection(): Promise<boolean> {
  const d = getNeo4jDriver();
  if (!d) return false;
  const session = d.session();
  try {
    await session.run("RETURN 1 AS ok");
    return true;
  } finally {
    await session.close();
  }
}

export async function writeEntitiesToGraph(
  conversationId: string,
  conversationTitle: string,
  entities: ExtractedEntity[],
  verdicts: CriticVerdict[],
): Promise<void> {
  const d = getNeo4jDriver();
  if (!d) throw new Error("Neo4j not configured");

  const approved = new Set(
    verdicts.filter((v) => v.approved).map((v) => v.entityId),
  );

  const session = d.session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (c:Conversation {id: $conversationId})
         SET c.title = $title, c.updatedAt = datetime()`,
        { conversationId, title: conversationTitle },
      );

      for (const entity of entities) {
        if (!approved.has(entity.id)) continue;

        const topicId = `${conversationId}-${entity.topic.replace(/\s+/g, "-").toLowerCase()}`;

        await tx.run(
          `MERGE (p:Person {name: $person})
           MERGE (t:Topic {id: $topicId})
           SET t.label = $topic, t.conversationId = $conversationId
           MERGE (p)-[r:REL {type: $relation, quote: $quote, entityId: $entityId}]->(t)
           MERGE (c:Conversation {id: $conversationId})-[:CAPTURED]->(t)`,
          {
            person: entity.person,
            topicId,
            topic: entity.topic,
            conversationId,
            relation: entity.relation,
            quote: entity.quote,
            entityId: entity.id,
          },
        );
      }
    });
  } finally {
    await session.close();
  }
}

export async function fetchGraph(): Promise<GraphData> {
  const d = getNeo4jDriver();
  if (!d) return getMockGraph();

  const session = d.session();
  try {
    const nodeResult = await session.run(
      `MATCH (n) WHERE n:Person OR n:Topic OR n:Conversation
       RETURN DISTINCT n, labels(n) AS labels LIMIT 150`,
    );

    const linkResult = await session.run(
      `MATCH (a)-[r]->(b)
       WHERE (a:Person OR a:Topic OR a:Conversation)
         AND (b:Person OR b:Topic OR b:Conversation)
       RETURN DISTINCT a, b, type(r) AS relType, r.type AS relLabel LIMIT 200`,
    );

    const nodes = mapNodes(nodeResult.records);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = mapLinks(linkResult.records, nodeIds);

    return { nodes, links };
  } finally {
    await session.close();
  }
}

function mapNodes(
  records: Array<{ get: (key: string) => unknown }>,
): GraphNode[] {
  return records.map((record) => {
    const node = record.get("n") as {
      properties: Record<string, unknown>;
      identity: { toString: () => string };
    };
    const labels = record.get("labels") as string[];
    const type = (labels[0] ?? "Topic") as GraphNode["type"];
    const props = node.properties;
    const id = String(props.id ?? props.name ?? props.label ?? node.identity.toString());
    const label = String(props.label ?? props.name ?? props.title ?? id).slice(0, 60);
    return { id, label, type, properties: props as GraphNode["properties"] };
  });
}

function mapLinks(
  records: Array<{ get: (key: string) => unknown }>,
  nodeIds: Set<string>,
): GraphLink[] {
  const links: GraphLink[] = [];
  for (const record of records) {
    const a = record.get("a") as { properties: Record<string, unknown>; identity: { toString: () => string } };
    const b = record.get("b") as { properties: Record<string, unknown>; identity: { toString: () => string } };
    const relType = (record.get("relLabel") ?? record.get("relType")) as string;
    const aProps = a.properties;
    const bProps = b.properties;
    const source = String(aProps.id ?? aProps.name ?? aProps.label ?? a.identity.toString());
    const target = String(bProps.id ?? bProps.name ?? bProps.label ?? b.identity.toString());
    if (nodeIds.has(source) && nodeIds.has(target)) {
      links.push({ source, target, type: relType });
    }
  }
  return links;
}

export function getMockGraph(): GraphData {
  return {
    nodes: [
      { id: "conv-alice", label: "Alice @ Crusoe booth", type: "Conversation" },
      { id: "conv-bob", label: "Bob @ healthcare panel", type: "Conversation" },
      { id: "conv-charlie", label: "Charlie @ lounge", type: "Conversation" },
      { id: "Alice", label: "Alice", type: "Person" },
      { id: "Bob", label: "Bob", type: "Person" },
      { id: "Charlie", label: "Charlie", type: "Person" },
      { id: "topic-inference", label: "Private VPC Inference", type: "Topic" },
      { id: "topic-phi", label: "Private PHI Processing", type: "Topic" },
      { id: "topic-healthcare", label: "Healthcare AI Companies", type: "Topic" },
    ],
    links: [
      { source: "Alice", target: "topic-inference", type: "PROVIDES" },
      { source: "Bob", target: "topic-phi", type: "HAS_PROBLEM" },
      { source: "Charlie", target: "topic-healthcare", type: "SEEKS" },
      { source: "conv-alice", target: "topic-inference", type: "CAPTURED" },
      { source: "conv-bob", target: "topic-phi", type: "CAPTURED" },
      { source: "conv-charlie", target: "topic-healthcare", type: "CAPTURED" },
    ],
  };
}
