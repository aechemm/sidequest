export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Conversation {
  id: string;
  title: string;
  text: string;
  language?: string;
  duration?: number;
  segments: TranscriptSegment[];
  source: "plaud" | "mock" | "upload";
  recordedAt?: string;
}

/** @deprecated use Conversation */
export type Transcript = Conversation;

export type EntityRelation =
  | "WORKS_ON"
  | "HAS_PROBLEM"
  | "SEEKS"
  | "PROVIDES"
  | "NEEDS"
  | "BUILDS"
  | "OFFERS";

export interface ExtractedEntity {
  id: string;
  person: string;
  relation: EntityRelation;
  topic: string;
  quote: string;
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
    | "Topic"
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

export interface SideQuest {
  id: string;
  title: string;
  people: string[];
  bonusPeople?: string[];
  reason: string;
  pathDescription: string;
  conversationIds: string[];
  approved: boolean;
  criticReason?: string;
  draftIntro: string;
  highlightPath?: GraphData;
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
