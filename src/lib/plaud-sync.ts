import {
  getRecordingName,
  getTranscriptText,
  listTodayRecordings,
  plaudAuthStatus,
  type PlaudRecording,
} from "@/lib/plaud-cli";
import {
  loadProcessedPlaudIds,
  markPlaudProcessed,
  saveConversation,
} from "@/lib/conversation-store";
import { ingestConversation, runDiscovery } from "@/lib/pipeline";
import type { Conversation, SideQuest } from "@/lib/types";

export type SyncStage =
  | "auth"
  | "listing"
  | "detected"
  | "transcript"
  | "extracting"
  | "graph"
  | "discovering"
  | "complete"
  | "error"
  | "idle";

export interface SyncEvent {
  stage: SyncStage;
  message: string;
  recordingId?: string;
  recordingName?: string;
}

export interface SyncResult {
  ok: boolean;
  authenticated: boolean;
  authMessage: string;
  events: SyncEvent[];
  newRecordings: PlaudRecording[];
  processed: Array<{
    id: string;
    name: string;
    conversationId: string;
  }>;
  skipped: string[];
  sideQuests: SideQuest[];
  error?: string;
}

function transcriptToConversation(
  recording: PlaudRecording,
  transcript: string,
  title: string,
): Conversation {
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const segments = lines.map((line, index) => {
    // [00:00 - 00:04] Speaker: text   OR   Speaker: text
    const timed = line.match(
      /^\[([^\]]+)\]\s*(?:([^:]+):\s*)?(.+)$/,
    );
    if (timed) {
      return {
        start: index * 5,
        end: index * 5 + 4,
        speaker: timed[2]?.trim() || "Speaker",
        text: timed[3]!.trim(),
      };
    }
    const spoken = line.match(/^([^:]+):\s*(.+)$/);
    if (spoken) {
      return {
        start: index * 5,
        end: index * 5 + 4,
        speaker: spoken[1]!.trim(),
        text: spoken[2]!.trim(),
      };
    }
    return {
      start: index * 5,
      end: index * 5 + 4,
      speaker: "Speaker",
      text: line,
    };
  });

  const text =
    segments.length > 0
      ? segments.map((s) => `${s.speaker}: ${s.text}`).join("\n")
      : transcript;

  return {
    id: `plaud-${recording.id}`,
    title,
    text,
    segments:
      segments.length > 0
        ? segments
        : [{ start: 0, end: 1, speaker: "Speaker", text: transcript }],
    source: "plaud",
    recordedAt: recording.createdAt,
    processingStatus: "complete",
    summary: transcript.slice(0, 120),
  };
}

export async function syncPlaudAccount(): Promise<SyncResult> {
  const events: SyncEvent[] = [];
  const processed: SyncResult["processed"] = [];
  const skipped: string[] = [];

  events.push({ stage: "auth", message: "Checking Plaud CLI authentication…" });
  const auth = await plaudAuthStatus();
  if (!auth.ok) {
    return {
      ok: false,
      authenticated: false,
      authMessage: auth.message,
      events: [
        ...events,
        {
          stage: "error",
          message:
            "Not signed in. In the cloud Desktop terminal run: npx plaud login",
        },
      ],
      newRecordings: [],
      processed: [],
      skipped: [],
      sideQuests: [],
      error: "AUTH_FAILED",
    };
  }

  events.push({
    stage: "listing",
    message: "Listing today’s / recent Plaud recordings…",
  });

  let recordings: PlaudRecording[];
  try {
    recordings = await listTodayRecordings();
  } catch (error) {
    const message = error instanceof Error ? error.message : "list failed";
    return {
      ok: false,
      authenticated: !message.includes("AUTH_FAILED"),
      authMessage: auth.message,
      events: [...events, { stage: "error", message }],
      newRecordings: [],
      processed: [],
      skipped: [],
      sideQuests: [],
      error: message,
    };
  }

  const already = await loadProcessedPlaudIds();
  const fresh = recordings.filter((r) => !already.has(r.id));

  if (fresh.length === 0) {
    events.push({
      stage: "complete",
      message:
        recordings.length === 0
          ? "No Plaud recordings found for today/recent. Record on the device, sync in the Plaud App, then Sync again."
          : `Found ${recordings.length} recording(s) — all already processed.`,
    });
    return {
      ok: true,
      authenticated: true,
      authMessage: auth.message,
      events,
      newRecordings: [],
      processed: [],
      skipped: recordings.map((r) => r.id),
      sideQuests: [],
    };
  }

  const conversations: Conversation[] = [];

  for (const recording of fresh) {
    events.push({
      stage: "detected",
      message: `New Plaud recording detected: ${recording.name}`,
      recordingId: recording.id,
      recordingName: recording.name,
    });

    try {
      events.push({
        stage: "transcript",
        message: "Retrieving transcript…",
        recordingId: recording.id,
      });
      const transcript = await getTranscriptText(recording.id);
      if (!transcript) {
        skipped.push(recording.id);
        events.push({
          stage: "error",
          message: `No transcript yet for ${recording.name} — wait for Plaud App to finish processing, then sync again.`,
          recordingId: recording.id,
        });
        continue;
      }

      const name =
        recording.name || (await getRecordingName(recording.id));
      const conversation = transcriptToConversation(
        recording,
        transcript,
        name,
      );

      events.push({
        stage: "extracting",
        message: "Extracting knowledge (Crusoe)…",
        recordingId: recording.id,
      });
      await ingestConversation(conversation);

      events.push({
        stage: "graph",
        message: "Updating Neo4j graph…",
        recordingId: recording.id,
      });

      await saveConversation(conversation);
      await markPlaudProcessed(recording.id);
      conversations.push(conversation);
      processed.push({
        id: recording.id,
        name,
        conversationId: conversation.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "process failed";
      skipped.push(recording.id);
      events.push({
        stage: "error",
        message: `${recording.name}: ${message}`,
        recordingId: recording.id,
      });
    }
  }

  events.push({
    stage: "discovering",
    message: "Searching for cross-conversation SideQuests…",
  });

  const stored = await import("@/lib/conversation-store").then((m) =>
    m.loadStoredConversations(),
  );
  const discovery = await runDiscovery(stored.length > 0 ? stored : conversations);

  events.push({
    stage: "complete",
    message:
      discovery.sideQuests.length > 0
        ? `SideQuest discovered — ${discovery.sideQuests.length} connection(s) from ${processed.length} new recording(s).`
        : `Processed ${processed.length} recording(s). Add more conversations to discover connections.`,
  });

  return {
    ok: true,
    authenticated: true,
    authMessage: auth.message,
    events,
    newRecordings: fresh,
    processed,
    skipped,
    sideQuests: discovery.sideQuests,
  };
}
