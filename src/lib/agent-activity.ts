import type { AgentActivityEvent, AgentName } from "./types";

let counter = 0;

/** Friendly labels shown in the Activity UI */
export const AGENT_LABELS: Record<AgentName, string> = {
  ExtractorAgent: "Extract",
  GraphAgent: "Graph",
  ScoutAgent: "Discover",
  ConnectorAgent: "Connect",
  CriticAgent: "Verify",
};

export function agentEvent(
  agent: AgentName,
  message: string,
  status: AgentActivityEvent["status"] = "info",
): AgentActivityEvent {
  counter += 1;
  return {
    id: `evt-${counter}-${Date.now()}`,
    agent,
    message,
    timestamp: new Date().toISOString(),
    status,
  };
}

export function extractionEvents(
  count: number,
  relationships: number,
): AgentActivityEvent[] {
  return [
    agentEvent(
      "ExtractorAgent",
      `Found ${count} details and ${relationships} relationships`,
      "success",
    ),
  ];
}

export function graphEvents(): AgentActivityEvent[] {
  return [
    agentEvent("GraphAgent", "Updated relationship graph", "success"),
  ];
}

export function scoutEvents(): AgentActivityEvent[] {
  return [
    agentEvent(
      "ScoutAgent",
      "Looking across conversations for introductions",
      "success",
    ),
  ];
}

export function connectorEvents(title: string): AgentActivityEvent[] {
  return [
    agentEvent("ConnectorAgent", `Drafted rationale: ${title}`, "success"),
  ];
}

export function criticEvents(
  approved: boolean,
  reason: string,
): AgentActivityEvent[] {
  return [
    agentEvent(
      "CriticAgent",
      approved ? `Verified — ${reason}` : `Held back — ${reason}`,
      approved ? "success" : "blocked",
    ),
  ];
}
