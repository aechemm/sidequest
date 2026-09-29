import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AgentActivityEvent,
  Conversation,
  NetworkStats,
  PipelineStatus,
  SideQuest,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_PATH = path.join(DATA_DIR, "discovery-cache.json");

export interface DiscoveryCache {
  conversationIds: string[];
  sideQuests: SideQuest[];
  activities: AgentActivityEvent[];
  stats: NetworkStats;
  status: PipelineStatus | null;
  updatedAt: string;
}

export function conversationFingerprint(conversations: Conversation[]): string[] {
  return conversations.map((c) => c.id).sort();
}

export async function loadDiscoveryCache(
  conversations: Conversation[],
): Promise<DiscoveryCache | null> {
  try {
    const raw = await readFile(CACHE_PATH, "utf-8");
    const cache = JSON.parse(raw) as DiscoveryCache;
    const expected = conversationFingerprint(conversations);
    const cached = [...(cache.conversationIds ?? [])].sort();
    if (
      expected.length === 0 ||
      expected.length !== cached.length ||
      expected.some((id, i) => id !== cached[i])
    ) {
      return null;
    }
    return cache;
  } catch {
    return null;
  }
}

export async function saveDiscoveryCache(input: {
  conversations: Conversation[];
  sideQuests: SideQuest[];
  activities: AgentActivityEvent[];
  stats: NetworkStats;
  status: PipelineStatus | null;
}): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: DiscoveryCache = {
    conversationIds: conversationFingerprint(input.conversations),
    sideQuests: input.sideQuests,
    activities: input.activities,
    stats: input.stats,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(CACHE_PATH, JSON.stringify(payload, null, 2), "utf-8");
}
