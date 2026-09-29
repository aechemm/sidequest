export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Transcript {
  id: string;
  text: string;
  language?: string;
  duration?: number;
  segments: TranscriptSegment[];
  source: "plaud" | "mock" | "upload";
}

export interface ExtractedFact {
  id: string;
  type: "decision" | "commitment" | "blocker" | "question";
  text: string;
  speaker?: string;
  quote: string;
  timestampStart?: number;
  timestampEnd?: number;
  confidence: number;
}

export interface CriticVerdict {
  factId: string;
  approved: boolean;
  reason: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "Person" | "Decision" | "Task" | "Question" | "Meeting" | "Blocker";
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

export type PipelineStage =
  | "idle"
  | "uploading"
  | "transcribing"
  | "extracting"
  | "building_graph"
  | "critiquing"
  | "complete"
  | "error";

export interface PipelineStatus {
  stage: PipelineStage;
  message: string;
  transcriptId?: string;
  factsExtracted?: number;
  factsApproved?: number;
  factsBlocked?: number;
  error?: string;
}
