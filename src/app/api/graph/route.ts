import { fetchGraph } from "@/lib/neo4j";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("meetingId") ?? undefined;

  try {
    const graph = await fetchGraph(meetingId);
    return Response.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Graph fetch failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
