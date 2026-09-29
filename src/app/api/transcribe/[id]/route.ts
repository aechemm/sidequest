import { pollPlaudTranscription } from "@/lib/plaud";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const result = await pollPlaudTranscription(id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
