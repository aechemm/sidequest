import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const PLAUD_BIN = process.env.PLAUD_CLI_BIN ?? "npx";
const PLAUD_ARGS_PREFIX =
  process.env.PLAUD_CLI_BIN != null ? [] : ["plaud"];

export interface PlaudRecording {
  id: string;
  name: string;
  createdAt?: string;
  duration?: string;
}

function stripAnsi(text: string): string {
  return text.replace(
    // eslint-disable-next-line no-control-regex
    /\u001b\[[0-9;]*[a-zA-Z]/g,
    "",
  );
}

function plaudCliEnv(): NodeJS.ProcessEnv {
  // SideQuest's Embedded Transcription keys must not override Plaud CLI OAuth client.
  const env = { ...process.env };
  delete env.PLAUD_CLIENT_ID;
  delete env.PLAUD_API_KEY;
  delete env.PLAUD_CLIENT_SECRET;
  env.PLAUD_CLI_CLIENT_ID =
    env.PLAUD_CLI_CLIENT_ID ?? "client_f9e0b214-c11f-434b-8b95-c4497d1feb81";
  return env;
}

async function runPlaud(
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(
      PLAUD_BIN,
      [...PLAUD_ARGS_PREFIX, ...args],
      {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120_000,
        env: plaudCliEnv(),
      },
    );
    return { stdout, stderr, code: 0 };
  } catch (error) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
      message?: string;
    };
    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? err.message ?? "plaud failed",
      code: typeof err.code === "number" ? err.code : 1,
    };
  }
}

export async function plaudAuthStatus(): Promise<{
  ok: boolean;
  message: string;
}> {
  const result = await runPlaud(["me"]);
  if (result.code === 0) {
    return { ok: true, message: stripAnsi(result.stdout).trim() || "Logged in" };
  }
  return {
    ok: false,
    message:
      stripAnsi(result.stderr || result.stdout).trim() ||
      "Not authenticated — run: npx plaud login",
  };
}

/** Parse `plaud files` / `plaud today` / `plaud recent` table output. */
export function parseRecordingList(stdout: string): PlaudRecording[] {
  const lines = stripAnsi(stdout)
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);

  const recordings: PlaudRecording[] = [];
  for (const line of lines) {
    // Skip headers / separators
    if (/^ID\b/.test(line.trim()) || /^─/.test(line.trim()) || /Files on this page/i.test(line) || /^Page\s+\d+/i.test(line)) {
      continue;
    }
    // Lines look like: <id>  <name>  <date>  <duration>
    const match = line.trim().match(
      /^([a-zA-Z0-9_-]{8,})\s{2,}(.+?)\s{2,}(\d{4}-\d{2}-\d{2}[^\s]*)?\s*(.*)$/,
    );
    if (!match) {
      // Fallback: first token looks like an id
      const parts = line.trim().split(/\s{2,}/);
      if (parts[0] && /^[a-zA-Z0-9_-]{8,}$/.test(parts[0]) && parts.length >= 2) {
        recordings.push({
          id: parts[0],
          name: parts[1] ?? parts[0],
          createdAt: parts[2],
          duration: parts[3],
        });
      }
      continue;
    }
    recordings.push({
      id: match[1]!,
      name: match[2]!.trim(),
      createdAt: match[3],
      duration: match[4]?.trim() || undefined,
    });
  }
  return recordings;
}

export async function listTodayRecordings(): Promise<PlaudRecording[]> {
  const result = await runPlaud(["today"]);
  if (result.code === 2) {
    throw new Error("AUTH_FAILED: run `npx plaud login` in the cloud Desktop terminal");
  }
  if (result.code !== 0) {
    // today can be empty; try recent as fallback message only on hard fail
    const recent = await runPlaud(["recent", "--days", "7"]);
    if (recent.code === 2) {
      throw new Error("AUTH_FAILED: run `npx plaud login` in the cloud Desktop terminal");
    }
    if (recent.code !== 0) {
      throw new Error(
        stripAnsi(result.stderr || recent.stderr || "plaud today failed"),
      );
    }
    return parseRecordingList(recent.stdout);
  }
  const today = parseRecordingList(result.stdout);
  if (today.length > 0) return today;

  const recent = await runPlaud(["recent", "--days", "3"]);
  if (recent.code === 0) return parseRecordingList(recent.stdout);
  return today;
}

export async function getTranscriptText(fileId: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "plaud-tx-"));
  const outPath = path.join(dir, `${fileId}.txt`);
  try {
    const result = await runPlaud([
      "transcript",
      fileId,
      "-o",
      outPath,
    ]);
    if (result.code === 2) {
      throw new Error("AUTH_FAILED: run `npx plaud login`");
    }
    if (result.code !== 0) {
      throw new Error(
        stripAnsi(result.stderr || result.stdout || "transcript failed"),
      );
    }
    const text = await readFile(outPath, "utf-8");
    return text.trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function getRecordingName(fileId: string): Promise<string> {
  const result = await runPlaud(["file", fileId]);
  if (result.code !== 0) return fileId;
  const clean = stripAnsi(result.stdout);
  const match = clean.match(/name\s*:\s*(.+)/i);
  return match?.[1]?.trim() || fileId;
}
