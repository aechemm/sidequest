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

/** Parse CLI duration strings like "7s", "12s", "4m13s", "1h21m" → seconds */
export function durationToSeconds(duration?: string): number {
  if (!duration) return 0;
  const h = duration.match(/(\d+)\s*h/i);
  const m = duration.match(/(\d+)\s*m/i);
  const s = duration.match(/(\d+)\s*s/i);
  return (
    (h ? Number(h[1]) * 3600 : 0) +
    (m ? Number(m[1]) * 60 : 0) +
    (s ? Number(s[1]) : 0)
  );
}

const MAX_DURATION_SECONDS = 20 * 60; // skip long sample files (e.g. 1h21m)
const MAX_PER_SYNC = 5;

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

  events.push({ stage: "auth", message: "Checking Plaud account…" });
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
            "Plaud account not connected. Finish sign-in on the Plaud page first.",
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
    message: "Looking for recent recordings…",
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
  const unprocessed = recordings.filter((r) => !already.has(r.id));

  // Newest first; skip very long recordings that time out during sync.
  const eligible = unprocessed.filter((r) => {
    const seconds = durationToSeconds(r.duration);
    if (seconds > MAX_DURATION_SECONDS) {
      skipped.push(r.id);
      events.push({
        stage: "listing",
        message: `Skipping long recording (${r.duration}): ${r.name}`,
        recordingId: r.id,
        recordingName: r.name,
      });
      return false;
    }
    return true;
  });

  const fresh = eligible.slice(0, MAX_PER_SYNC);
  for (const r of eligible.slice(MAX_PER_SYNC)) {
    skipped.push(r.id);
  }
  if (eligible.length > MAX_PER_SYNC) {
    events.push({
      stage: "listing",
      message: `Syncing ${MAX_PER_SYNC} newest recordings now (${eligible.length - MAX_PER_SYNC} left for next sync).`,
    });
  }

  if (fresh.length === 0) {
    events.push({
      stage: "complete",
      message:
        recordings.length === 0
          ? "No recent recordings found. Record on your Plaud, wait for the transcript in the Plaud app, then sync again."
          : unprocessed.length === 0
            ? `Found ${recordings.length} recording${recordings.length === 1 ? "" : "s"} — all already imported.`
            : `Found ${recordings.length} recording${recordings.length === 1 ? "" : "s"}, but none were short enough to sync automatically.`,
    });
    return {
      ok: true,
      authenticated: true,
      authMessage: auth.message,
      events,
      newRecordings: [],
      processed: [],
      skipped:
        skipped.length > 0 ? skipped : recordings.map((r) => r.id),
      sideQuests: [],
    };
  }

  events.push({
    stage: "listing",
    message: `Found ${recordings.length} recent · syncing ${fresh.length} new recording${fresh.length === 1 ? "" : "s"}…`,
  });

  const conversations: Conversation[] = [];

  for (const recording of fresh) {
    events.push({
      stage: "detected",
      message: `New recording: ${recording.name}`,
      recordingId: recording.id,
      recordingName: recording.name,
    });

    try {
      events.push({
        stage: "transcript",
        message: "Pulling transcript…",
        recordingId: recording.id,
      });
      const transcript = await getTranscriptText(recording.id);
      if (!transcript) {
        skipped.push(recording.id);
        events.push({
          stage: "error",
          message: `No transcript yet for ${recording.name} — wait for the Plaud app to finish, then sync again.`,
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
        message: "Extracting people and topics…",
        recordingId: recording.id,
      });
      await ingestConversation(conversation);

      events.push({
        stage: "graph",
        message: "Updating relationship graph…",
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
    message: "Looking for introductions across conversations…",
  });

  const stored = await import("@/lib/conversation-store").then((m) =>
    m.loadStoredConversations(),
  );
  const discovery = await runDiscovery(stored.length > 0 ? stored : conversations);

  events.push({
    stage: "complete",
    message:
      discovery.sideQuests.length > 0
        ? `Found ${discovery.sideQuests.length} introduction${discovery.sideQuests.length === 1 ? "" : "s"} from ${processed.length} new recording${processed.length === 1 ? "" : "s"}.`
        : `Imported ${processed.length} recording${processed.length === 1 ? "" : "s"}. Add a few more chats to surface introductions.`,
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
