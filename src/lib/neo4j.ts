import neo4j, { type Driver } from "neo4j-driver";
import type {
  CriticVerdict,
  ExtractedFact,
  GraphData,
  GraphLink,
  GraphNode,
  Transcript,
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

export async function clearMeetingGraph(meetingId: string): Promise<void> {
  const d = getNeo4jDriver();
  if (!d) return;
  const session = d.session();
  try {
    await session.run(
      `MATCH (m:Meeting {id: $meetingId})-[*0..2]-(n) DETACH DELETE m, n`,
      { meetingId },
    );
  } finally {
    await session.close();
  }
}

export async function writeFactsToGraph(
  meetingId: string,
  transcript: Transcript,
  facts: ExtractedFact[],
  verdicts: CriticVerdict[],
): Promise<void> {
  const d = getNeo4jDriver();
  if (!d) throw new Error("Neo4j not configured");

  const approved = new Set(
    verdicts.filter((v) => v.approved).map((v) => v.factId),
  );

  const session = d.session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (m:Meeting {id: $meetingId})
         SET m.title = $title, m.source = $source, m.updatedAt = datetime()`,
        {
          meetingId,
          title: `Meeting ${meetingId}`,
          source: transcript.source,
        },
      );

      for (const fact of facts) {
        if (!approved.has(fact.id)) continue;

        const speaker = fact.speaker ?? "Unknown";
        await tx.run(
          `MERGE (p:Person {name: $speaker})
           WITH p
           MATCH (m:Meeting {id: $meetingId})
           MERGE (m)-[:HAS_SPEAKER]->(p)`,
          { speaker, meetingId },
        );

        if (fact.type === "decision") {
          await tx.run(
            `MERGE (d:Decision {id: $factId})
             SET d.text = $text, d.quote = $quote,
                 d.timestampStart = $timestampStart, d.status = 'approved'
             WITH d
             MATCH (m:Meeting {id: $meetingId})
             MERGE (m)-[:HAS_DECISION]->(d)
             WITH d
             MATCH (p:Person {name: $speaker})
             MERGE (p)-[:DECIDED]->(d)`,
            {
              factId: fact.id,
              text: fact.text,
              quote: fact.quote,
              timestampStart: fact.timestampStart ?? null,
              meetingId,
              speaker,
            },
          );
        }

        if (fact.type === "commitment") {
          await tx.run(
            `MERGE (t:Task {id: $factId})
             SET t.text = $text, t.quote = $quote,
                 t.timestampStart = $timestampStart, t.status = 'committed'
             WITH t
             MATCH (m:Meeting {id: $meetingId})
             MERGE (m)-[:HAS_TASK]->(t)
             WITH t
             MATCH (p:Person {name: $speaker})
             MERGE (p)-[:COMMITTED_TO]->(t)`,
            {
              factId: fact.id,
              text: fact.text,
              quote: fact.quote,
              timestampStart: fact.timestampStart ?? null,
              meetingId,
              speaker,
            },
          );
        }

        if (fact.type === "blocker") {
          await tx.run(
            `MERGE (b:Blocker {id: $factId})
             SET b.text = $text, b.quote = $quote, b.timestampStart = $timestampStart
             WITH b
             MATCH (m:Meeting {id: $meetingId})
             MERGE (m)-[:HAS_BLOCKER]->(b)
             WITH b
             MATCH (p:Person {name: $speaker})
             MERGE (p)-[:BLOCKED_BY]->(b)`,
            {
              factId: fact.id,
              text: fact.text,
              quote: fact.quote,
              timestampStart: fact.timestampStart ?? null,
              meetingId,
              speaker,
            },
          );
        }

        if (fact.type === "question") {
          await tx.run(
            `MERGE (q:Question {id: $factId})
             SET q.text = $text, q.quote = $quote, q.timestampStart = $timestampStart
             WITH q
             MATCH (m:Meeting {id: $meetingId})
             MERGE (m)-[:HAS_QUESTION]->(q)
             WITH q
             MATCH (p:Person {name: $speaker})
             MERGE (p)-[:RAISED]->(q)`,
            {
              factId: fact.id,
              text: fact.text,
              quote: fact.quote,
              timestampStart: fact.timestampStart ?? null,
              meetingId,
              speaker,
            },
          );
        }
      }
    });
  } finally {
    await session.close();
  }
}

export async function fetchGraph(meetingId?: string): Promise<GraphData> {
  const d = getNeo4jDriver();
  if (!d) return getMockGraph();

  const session = d.session();
  try {
    const nodeResult = await session.run(
      meetingId
        ? `MATCH (m:Meeting {id: $meetingId})-[*0..2]-(n)
           WHERE n:Person OR n:Decision OR n:Task OR n:Question OR n:Blocker OR n:Meeting
           RETURN DISTINCT n, labels(n) AS labels`
        : `MATCH (n)
           WHERE n:Person OR n:Decision OR n:Task OR n:Question OR n:Blocker OR n:Meeting
           RETURN DISTINCT n, labels(n) AS labels
           LIMIT 100`,
      meetingId ? { meetingId } : {},
    );

    const linkResult = await session.run(
      meetingId
        ? `MATCH (m:Meeting {id: $meetingId})-[*0..2]-(a)-[r]->(b)
           WHERE (a:Person OR a:Decision OR a:Task OR a:Question OR a:Blocker OR a:Meeting)
             AND (b:Person OR b:Decision OR b:Task OR b:Question OR b:Blocker OR b:Meeting)
           RETURN DISTINCT a, b, type(r) AS relType`
        : `MATCH (a)-[r]->(b)
           WHERE (a:Person OR a:Decision OR a:Task OR a:Question OR a:Blocker OR a:Meeting)
             AND (b:Person OR b:Decision OR b:Task OR b:Question OR b:Blocker OR b:Meeting)
           RETURN DISTINCT a, b, type(r) AS relType
           LIMIT 200`,
      meetingId ? { meetingId } : {},
    );

    const nodes: GraphNode[] = nodeResult.records.map((record) => {
      const node = record.get("n");
      const labels = record.get("labels") as string[];
      const type = (labels[0] ?? "Meeting") as GraphNode["type"];
      const props = node.properties as Record<string, unknown>;
      const id = String(props.id ?? props.name ?? node.identity.toString());
      const label =
        String(props.text ?? props.name ?? props.title ?? id).slice(0, 60);
      return { id, label, type, properties: props as GraphNode["properties"] };
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = [];

    for (const record of linkResult.records) {
      const a = record.get("a");
      const b = record.get("b");
      const relType = record.get("relType") as string;
      const aProps = a.properties as Record<string, unknown>;
      const bProps = b.properties as Record<string, unknown>;
      const source = String(aProps.id ?? aProps.name ?? a.identity.toString());
      const target = String(bProps.id ?? bProps.name ?? b.identity.toString());
      if (nodeIds.has(source) && nodeIds.has(target)) {
        links.push({ source, target, type: relType });
      }
    }

    return { nodes, links };
  } finally {
    await session.close();
  }
}

function getMockGraph(): GraphData {
  return {
    nodes: [
      { id: "meeting-1", label: "Hack Day Sync", type: "Meeting" },
      { id: "Sarah", label: "Sarah", type: "Person" },
      { id: "Mike", label: "Mike", type: "Person" },
      {
        id: "decision-1",
        label: "Ship with Band agents live",
        type: "Decision",
      },
      {
        id: "task-1",
        label: "Graph viz ready before judging",
        type: "Task",
      },
      {
        id: "blocker-1",
        label: "Plaud credentials",
        type: "Blocker",
      },
    ],
    links: [
      { source: "Sarah", target: "decision-1", type: "DECIDED" },
      { source: "Sarah", target: "task-1", type: "COMMITTED_TO" },
      { source: "Mike", target: "blocker-1", type: "BLOCKED_BY" },
      { source: "meeting-1", target: "Sarah", type: "HAS_SPEAKER" },
      { source: "meeting-1", target: "Mike", type: "HAS_SPEAKER" },
    ],
  };
}
