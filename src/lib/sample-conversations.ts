import type { Conversation } from "./types";

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-alice",
    title: "Conversation 1 — Alice @ Crusoe booth",
    participant: "Alice",
    company: "Crusoe",
    summary: "Private VPC inference platform",
    processingStatus: "complete",
    source: "mock",
    language: "en",
    duration: 32,
    recordedAt: "2026-09-29T10:15:00Z",
    text: `Alice: We built an inference platform that can operate inside a customer's VPC. No data leaves their environment.`,
    segments: [
      {
        start: 0,
        end: 12,
        speaker: "Alice",
        text: "We built an inference platform that can operate inside a customer's VPC. No data leaves their environment.",
      },
    ],
  },
  {
    id: "conv-bob",
    title: "Conversation 2 — Bob @ healthcare panel",
    participant: "Bob",
    company: "Metro Hospital",
    summary: "PHI must stay on-prem",
    processingStatus: "complete",
    source: "mock",
    language: "en",
    duration: 28,
    recordedAt: "2026-09-29T12:40:00Z",
    text: `Bob: Our hospital can't send patient data outside our environment. We need private AI that runs entirely on-prem.`,
    segments: [
      {
        start: 0,
        end: 10,
        speaker: "Bob",
        text: "Our hospital can't send patient data outside our environment. We need private AI that runs entirely on-prem.",
      },
    ],
  },
  {
    id: "conv-charlie",
    title: "Conversation 3 — Charlie @ startup lounge",
    participant: "Charlie",
    company: "HealthTech Accelerator",
    summary: "Seeking healthcare AI startups",
    processingStatus: "complete",
    source: "mock",
    language: "en",
    duration: 24,
    recordedAt: "2026-09-29T15:05:00Z",
    text: `Charlie: I'm looking for healthcare AI companies for our accelerator program this fall.`,
    segments: [
      {
        start: 0,
        end: 8,
        speaker: "Charlie",
        text: "I'm looking for healthcare AI companies for our accelerator program this fall.",
      },
    ],
  },
];
