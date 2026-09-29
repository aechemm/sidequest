import type { AgentActivityEvent, AgentName } from "./types";

let counter = 0;

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

export function extractionEvents(count: number, relationships: number): AgentActivityEvent[] {
  return [
    agentEvent(
      "ExtractorAgent",
      `${count} entities and ${relationships} relationships extracted`,
      "success",
    ),
  ];
}

export function graphEvents(): AgentActivityEvent[] {
  return [
    agentEvent("GraphAgent", "Knowledge graph updated", "success"),
  ];
}

export function scoutEvents(): AgentActivityEvent[] {
  return [
    agentEvent("ScoutAgent", "Potential connection discovered across conversations", "success"),
  ];
}

export function connectorEvents(title: string): AgentActivityEvent[] {
  return [
    agentEvent("ConnectorAgent", `Connection rationale generated: ${title}`, "success"),
  ];
}

export function criticEvents(approved: boolean, reason: string): AgentActivityEvent[] {
  return [
    agentEvent(
      "CriticAgent",
      approved ? `APPROVED — ${reason}` : `BLOCKED — ${reason}`,
      approved ? "success" : "blocked",
    ),
  ];
}
