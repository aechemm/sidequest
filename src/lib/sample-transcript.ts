import type { Transcript } from "./types";

export const SAMPLE_TRANSCRIPT: Transcript = {
  id: "mock-hackday-sync",
  text: `Sarah: We need to demo TalkTrace by 3pm. The Crusoe API key is blocking us until we hit their booth.
Mike: I'll handle the Neo4j Aura setup — should take ten minutes.
Sarah: Decision: we ship with Band agents running live, not a fake orchestrator.
Mike: I'm blocked on Plaud credentials. Can someone grab those at the sponsor table?
Sarah: Mike commits to having the graph visualization ready before judging.
Mike: Open question — do we deploy on DuploCloud or run locally for the demo?`,
  language: "en",
  duration: 84,
  source: "mock",
  segments: [
    {
      start: 0,
      end: 8.2,
      text: "We need to demo TalkTrace by 3pm. The Crusoe API key is blocking us until we hit their booth.",
      speaker: "Sarah",
    },
    {
      start: 8.5,
      end: 14.1,
      text: "I'll handle the Neo4j Aura setup — should take ten minutes.",
      speaker: "Mike",
    },
    {
      start: 14.4,
      end: 20.8,
      text: "Decision: we ship with Band agents running live, not a fake orchestrator.",
      speaker: "Sarah",
    },
    {
      start: 21.0,
      end: 27.5,
      text: "I'm blocked on Plaud credentials. Can someone grab those at the sponsor table?",
      speaker: "Mike",
    },
    {
      start: 28.0,
      end: 34.2,
      text: "Mike commits to having the graph visualization ready before judging.",
      speaker: "Sarah",
    },
    {
      start: 34.5,
      end: 42.0,
      text: "Open question — do we deploy on DuploCloud or run locally for the demo?",
      speaker: "Mike",
    },
  ],
};
