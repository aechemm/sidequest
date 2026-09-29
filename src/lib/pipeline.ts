import {
  critiqueFactWithCrusoe,
  extractFactsWithCrusoe,
} from "./crusoe";
import { clearMeetingGraph, writeFactsToGraph } from "./neo4j";
import type {
  CriticVerdict,
  ExtractedFact,
  PipelineStatus,
  Transcript,
} from "./types";

export async function runPipeline(
  transcript: Transcript,
  meetingId: string,
): Promise<{
  facts: ExtractedFact[];
  verdicts: CriticVerdict[];
  status: PipelineStatus;
}> {
  const status: PipelineStatus = {
    stage: "extracting",
    message: "Extracting facts with Crusoe…",
    transcriptId: transcript.id,
  };

  const facts = await extractFactsWithCrusoe(transcript);
  status.factsExtracted = facts.length;
  status.stage = "critiquing";
  status.message = "Critic reviewing extracted facts…";

  const verdicts: CriticVerdict[] = [];
  for (const fact of facts) {
    const result = await critiqueFactWithCrusoe(transcript, fact);
    verdicts.push({
      factId: fact.id,
      approved: result.approved,
      reason: result.reason,
    });
  }

  status.factsApproved = verdicts.filter((v) => v.approved).length;
  status.factsBlocked = verdicts.filter((v) => !v.approved).length;
  status.stage = "building_graph";
  status.message = "Writing approved facts to Neo4j…";

  let graphWritten = false;
  try {
    await clearMeetingGraph(meetingId);
    await writeFactsToGraph(meetingId, transcript, facts, verdicts);
    graphWritten = true;
  } catch {
    graphWritten = false;
  }

  status.stage = "complete";
  status.message = graphWritten
    ? `Pipeline complete — ${status.factsApproved} approved, ${status.factsBlocked} blocked.`
    : "Facts extracted and critiqued — connect Neo4j Aura to persist the graph.";

  return { facts, verdicts, status };
}
