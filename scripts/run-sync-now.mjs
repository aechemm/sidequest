/**
 * One-shot sync for hackathon: pull today's short Plaud recordings into SideQuest data/.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const DATA = path.join(process.cwd(), "data");

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
}

function env() {
  const e = { ...process.env };
  delete e.PLAUD_CLIENT_ID;
  delete e.PLAUD_API_KEY;
  delete e.PLAUD_CLIENT_SECRET;
  e.PLAUD_CLI_CLIENT_ID = "client_f9e0b214-c11f-434b-8b95-c4497d1feb81";
  return e;
}

async function plaud(args) {
  try {
    const { stdout, stderr } = await execFileAsync("npx", ["plaud", ...args], {
      cwd: process.cwd(),
      env: env(),
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180000,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return {
      code: typeof error.code === "number" ? error.code : 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error),
    };
  }
}

function parseList(stdout) {
  const out = [];
  for (const line of stripAnsi(stdout).split("\n")) {
    const parts = line.trim().split(/\s{2,}/);
    if (parts[0]?.startsWith("of_") && parts.length >= 2) {
      out.push({
        id: parts[0],
        name: parts[1],
        date: parts[2],
        duration: parts[3] || "",
      });
    }
  }
  return out;
}

function durationSeconds(d) {
  if (!d) return 0;
  const h = d.match(/(\d+)h/);
  const m = d.match(/(\d+)m/);
  const s = d.match(/(\d+)s/);
  return (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0) + (s ? +s[1] : 0);
}

function toConversation(rec, transcript) {
  const lines = transcript.split("\n").map((l) => l.trim()).filter(Boolean);
  const segments = lines.map((line, index) => {
    const timed = line.match(/^\[([^\]]+)\]\s*(?:([^:]+):\s*)?(.+)$/);
    if (timed) {
      return {
        start: index * 5,
        end: index * 5 + 4,
        speaker: timed[2]?.trim() || "Speaker",
        text: timed[3].trim(),
      };
    }
    return {
      start: index * 5,
      end: index * 5 + 4,
      speaker: "Speaker",
      text: line,
    };
  });
  return {
    id: `plaud-${rec.id}`,
    title: rec.name,
    text: segments.map((s) => `${s.speaker}: ${s.text}`).join("\n"),
    segments,
    source: "plaud",
    recordedAt: rec.date,
    processingStatus: "complete",
    summary: transcript.slice(0, 120),
    participant: segments[0]?.speaker,
  };
}

await mkdir(DATA, { recursive: true });
let processed = [];
try {
  processed = JSON.parse(await readFile(path.join(DATA, "plaud-processed.json"), "utf8")).ids || [];
} catch {}
const processedSet = new Set(processed);

const today = await plaud(["today"]);
const all = parseList(today.stdout);
const fresh = all
  .filter((r) => !processedSet.has(r.id))
  .filter((r) => durationSeconds(r.duration) <= 20 * 60)
  .slice(0, 5);

console.log("Found", all.length, "today;", "syncing", fresh.length);

let conversations = [];
try {
  conversations = JSON.parse(await readFile(path.join(DATA, "conversations.json"), "utf8"));
} catch {}

const events = [];
for (const rec of fresh) {
  console.log("→", rec.id, rec.name, rec.duration);
  events.push({ stage: "detected", message: `New Plaud recording detected: ${rec.name}` });
  const dir = await mkdtemp(path.join(tmpdir(), "plaud-tx-"));
  const out = path.join(dir, `${rec.id}.txt`);
  const tx = await plaud(["transcript", rec.id, "-o", out]);
  if (tx.code !== 0) {
    console.log("  transcript failed", stripAnsi(tx.stderr || tx.stdout).slice(0, 200));
    await rm(dir, { recursive: true, force: true });
    continue;
  }
  const text = (await readFile(out, "utf8")).trim();
  await rm(dir, { recursive: true, force: true });
  if (!text) {
    console.log("  empty transcript");
    continue;
  }
  console.log("  transcript:", text.slice(0, 100));
  const conv = toConversation(rec, text);
  conversations = [conv, ...conversations.filter((c) => c.id !== conv.id)];
  processedSet.add(rec.id);
  events.push({ stage: "transcript", message: `Transcript retrieved for ${rec.name}` });
}

await writeFile(path.join(DATA, "conversations.json"), JSON.stringify(conversations, null, 2));
await writeFile(
  path.join(DATA, "plaud-processed.json"),
  JSON.stringify({ ids: [...processedSet], updatedAt: new Date().toISOString() }, null, 2),
);

const result = {
  ok: true,
  authenticated: true,
  authMessage: "synced via run-sync-now",
  events: [
    ...events,
    {
      stage: "complete",
      message: `Processed ${fresh.length} recording(s). Open Conversations / Dashboard.`,
    },
  ],
  newRecordings: fresh,
  processed: fresh.map((r) => ({
    id: r.id,
    name: r.name,
    conversationId: `plaud-${r.id}`,
  })),
  skipped: all.filter((r) => durationSeconds(r.duration) > 20 * 60).map((r) => r.id),
  sideQuests: [],
};
await writeFile(path.join(DATA, "last-sync.json"), JSON.stringify(result, null, 2));
console.log("Done. Conversations stored:", conversations.length);
console.log(conversations.map((c) => c.title + " :: " + c.summary));
