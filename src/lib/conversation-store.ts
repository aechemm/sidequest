import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Conversation } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONVERSATIONS_PATH = path.join(DATA_DIR, "conversations.json");
const PROCESSED_PATH = path.join(DATA_DIR, "plaud-processed.json");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function loadStoredConversations(): Promise<Conversation[]> {
  try {
    const raw = await readFile(CONVERSATIONS_PATH, "utf-8");
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  await ensureDataDir();
  const existing = await loadStoredConversations();
  const next = [
    conversation,
    ...existing.filter((c) => c.id !== conversation.id),
  ];
  await writeFile(CONVERSATIONS_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export async function loadProcessedPlaudIds(): Promise<Set<string>> {
  try {
    const raw = await readFile(PROCESSED_PATH, "utf-8");
    const data = JSON.parse(raw) as { ids?: string[] };
    return new Set(data.ids ?? []);
  } catch {
    return new Set();
  }
}

export async function markPlaudProcessed(id: string): Promise<void> {
  await ensureDataDir();
  const ids = await loadProcessedPlaudIds();
  ids.add(id);
  await writeFile(
    PROCESSED_PATH,
    JSON.stringify({ ids: [...ids], updatedAt: new Date().toISOString() }, null, 2),
    "utf-8",
  );
}
