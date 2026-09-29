export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export type ProcessingStatus = "pending" | "processing" | "complete" | "error";

/** @deprecated use Conversation */
export type Transcript = Conversation;

export interface Conversation {
  id: string;
  title: string;
  text: string;
  language?: string;
  duration?: number;
  segments: TranscriptSegment[];
  source: "plaud" | "mock" | "upload" | "manual";
  recordedAt?: string;
  participant?: string;
  company?: string;
  summary?: string;
  processingStatus?: ProcessingStatus;
}

export type EntityRelation =
  | "WORKS_AT"
  | "WORKS_ON"
  | "HAS_PROBLEM"
  | "SEEKS"
  | "PROVIDES"
  | "NEEDS"
  | "BUILDS"
  | "OFFERS"
  | "INTERESTED_IN";

export interface ExtractedEntity {
  id: string;
  person: string;
  company?: string;
  relation: EntityRelation;
  topic: string;
  quote: string;
  conversationId: string;
  timestampStart?: number;
  timestampEnd?: number;
  confidence: number;
}

export interface CriticVerdict {
  entityId: string;
  approved: boolean;
  reason: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type:
    | "Person"
    | "Company"
    | "Topic"
    | "Problem"
    | "Capability"
    | "Conversation"
    | "SideQuest";
  properties?: Record<string, string | number | boolean>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface SideQuest {
  id: string;
  title: string;
  people: string[];
  bonusPeople?: string[];
  reason: string;
  evidence: string[];
  pathDescription: string;
  conversationIds: string[];
  approved: boolean;
  criticReason?: string;
  confidence: ConfidenceLevel;
  draftIntro: string;
  highlightPath?: GraphData;
}

export type AgentName =
  | "ExtractorAgent"
  | "GraphAgent"
  | "ScoutAgent"
  | "ConnectorAgent"
  | "CriticAgent";

export interface AgentActivityEvent {
  id: string;
  agent: AgentName;
  message: string;
  timestamp: string;
  status: "info" | "success" | "blocked" | "error";
}

export type PipelineStage =
  | "idle"
  | "uploading"
  | "transcribing"
  | "extracting"
  | "building_graph"
  | "discovering"
  | "critiquing"
  | "complete"
  | "error";

export interface PipelineStatus {
  stage: PipelineStage;
  message: string;
  conversationId?: string;
  entitiesExtracted?: number;
  entitiesApproved?: number;
  sideQuestsFound?: number;
  error?: string;
}

export interface NetworkStats {
  people: number;
  companies: number;
  conversations: number;
  connectionsDiscovered: number;
}
