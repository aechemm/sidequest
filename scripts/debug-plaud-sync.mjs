import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
}

function plaudEnv() {
  const env = { ...process.env };
  delete env.PLAUD_CLIENT_ID;
  delete env.PLAUD_API_KEY;
  delete env.PLAUD_CLIENT_SECRET;
  env.PLAUD_CLI_CLIENT_ID =
    "client_f9e0b214-c11f-434b-8b95-c4497d1feb81";
  return env;
}

async function runPlaud(args) {
  try {
    const { stdout, stderr } = await execFileAsync("npx", ["plaud", ...args], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,
      env: plaudEnv(),
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return {
      code: error.code ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error),
    };
  }
}

function parseRecordingList(stdout) {
  const lines = stripAnsi(stdout)
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);
  const recordings = [];
  for (const line of lines) {
    if (
      /^ID\b/.test(line.trim()) ||
      /^─/.test(line.trim()) ||
      /Files on this page/i.test(line) ||
      /Today's recordings/i.test(line) ||
      /Recordings in the last/i.test(line) ||
      /^Page\s+\d+/i.test(line)
    ) {
      continue;
    }
    const match = line
      .trim()
      .match(/^([a-zA-Z0-9_-]{8,})\s{2,}(.+?)\s{2,}(\d{4}-\d{2}-\d{2}[^\s]*)?\s*(.*)$/);
    if (match) {
      recordings.push({
        id: match[1],
        name: match[2].trim(),
        createdAt: match[3],
        duration: match[4]?.trim() || undefined,
      });
      continue;
    }
    const parts = line.trim().split(/\s{2,}/);
    if (parts[0] && /^[a-zA-Z0-9_-]{8,}$/.test(parts[0]) && parts.length >= 2) {
      recordings.push({
        id: parts[0],
        name: parts[1] ?? parts[0],
        createdAt: parts[2],
        duration: parts[3],
      });
    }
  }
  return recordings;
}

const today = await runPlaud(["today"]);
console.log("today code", today.code);
console.log("parsed", parseRecordingList(today.stdout));

const list = parseRecordingList(today.stdout);
const short = list.find((r) => r.id.startsWith("of_9ea99")) || list[0];
console.log("testing transcript for", short);

const dir = await mkdtemp(path.join(tmpdir(), "plaud-tx-"));
const outPath = path.join(dir, `${short.id}.txt`);
const tx = await runPlaud(["transcript", short.id, "-o", outPath]);
console.log("transcript cmd code", tx.code);
console.log("stderr", stripAnsi(tx.stderr).slice(0, 500));
console.log("stdout", stripAnsi(tx.stdout).slice(0, 500));
try {
  const text = await readFile(outPath, "utf-8");
  console.log("file len", text.length);
  console.log(text.slice(0, 400));
} catch (e) {
  console.log("no file", e.message);
}
await rm(dir, { recursive: true, force: true });
