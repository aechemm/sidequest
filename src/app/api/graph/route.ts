import { fetchGraph } from "@/lib/neo4j";

export async function GET() {
  try {
    const graph = await fetchGraph();
    return Response.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Graph fetch failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
