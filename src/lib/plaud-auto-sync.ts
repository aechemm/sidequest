import { syncPlaudAccount } from "@/lib/plaud-sync";
import { mkdir, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
let lastRunAt: string | null = null;
let lastResultSummary: string | null = null;
let running = false;

async function logLine(line: string) {
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await appendFile(
    path.join(dir, "auto-sync.log"),
    `[${new Date().toISOString()}] ${line}\n`,
    "utf-8",
  );
}

async function runOnce(reason: string) {
  if (running) {
    await logLine(`skip (${reason}) — sync already in progress`);
    return;
  }
  running = true;
  lastRunAt = new Date().toISOString();
  try {
    await logLine(`start (${reason})`);
    const result = await syncPlaudAccount();
    lastResultSummary = result.ok
      ? `ok · new=${result.processed.length} · skipped=${result.skipped.length} · quests=${result.sideQuests.length}`
      : `failed · ${result.error ?? "unknown"}`;
    await writeFile(
      path.join(process.cwd(), "data", "last-sync.json"),
      JSON.stringify(result, null, 2),
      "utf-8",
    );
    await logLine(lastResultSummary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lastResultSummary = `error · ${message}`;
    await logLine(lastResultSummary);
  } finally {
    running = false;
  }
}

export function getAutoSyncStatus() {
  const intervalMs = Number(
    process.env.PLAUD_SYNC_INTERVAL_MS ?? DEFAULT_INTERVAL_MS,
  );
  return {
    enabled: started,
    intervalMs,
    intervalMinutes: Math.round(intervalMs / 60000),
    lastRunAt,
    lastResultSummary,
    running,
  };
}

/** Start background Plaud sync. Safe to call multiple times. */
export function startPlaudAutoSync() {
  if (started) return getAutoSyncStatus();
  if (process.env.PLAUD_AUTO_SYNC === "0") {
    return getAutoSyncStatus();
  }

  const intervalMs = Number(
    process.env.PLAUD_SYNC_INTERVAL_MS ?? DEFAULT_INTERVAL_MS,
  );
  started = true;

  // Small delay so the Next server finishes boot before first sync.
  setTimeout(() => {
    void runOnce("startup");
  }, 20_000);

  timer = setInterval(() => {
    void runOnce("interval");
  }, intervalMs);

  // Don't keep the process alive only because of this timer in some runtimes.
  if (typeof timer === "object" && timer && "unref" in timer) {
    timer.unref?.();
  }

  void logLine(
    `auto-sync enabled every ${Math.round(intervalMs / 60000)} minute(s)`,
  );
  return getAutoSyncStatus();
}
