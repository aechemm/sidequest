import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { SideQuestCard } from "@/components/sidequest-card";
import type { SyncEvent, SyncResult } from "@/lib/plaud-sync";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SyncPageProps {
  searchParams: Promise<{
    data?: string;
    ok?: string;
    processed?: string;
    quests?: string;
    error?: string;
    auth?: string;
    from?: string;
  }>;
}

const STAGE_LABEL: Record<string, string> = {
  auth: "Checking account",
  listing: "Looking for recordings",
  detected: "New conversation found",
  transcript: "Transcript ready",
  extracting: "Extracting people & topics",
  graph: "Updating graph",
  discovering: "Finding introductions",
  complete: "Done",
  error: "Needs attention",
  idle: "…",
};

async function loadLastSync(): Promise<SyncResult | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "data", "last-sync.json"),
      "utf-8",
    );
    return JSON.parse(raw) as SyncResult;
  } catch {
    return null;
  }
}

function decodeResult(data?: string): SyncResult | null {
  if (!data) return null;
  try {
    return JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8"),
    ) as SyncResult;
  } catch {
    return null;
  }
}

export default async function PlaudSyncResultPage({
  searchParams,
}: SyncPageProps) {
  const params = await searchParams;
  const result =
    decodeResult(params.data) ??
    (params.from === "file" || params.ok ? await loadLastSync() : null);

  const events: SyncEvent[] = result?.events ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/plaud" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Sync complete</h2>
        <p className="text-sm text-muted-foreground">
          Here’s what SideQuest pulled from your Plaud account.
        </p>
      </div>

      {!result && (
        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
          No sync result to show yet.{" "}
          <Link href="/plaud" className="text-amber-500 underline">
            Sync from Plaud
          </Link>
          .
        </div>
      )}

      {result && (
        <>
          <div className="rounded-xl border border-border p-4 text-sm">
            <p>
              <span className="text-amber-500">
                {result.processed.length} new conversation
                {result.processed.length === 1 ? "" : "s"}
              </span>
              {result.sideQuests.length > 0
                ? ` · ${result.sideQuests.length} introduction${result.sideQuests.length === 1 ? "" : "s"} found`
                : ""}
            </p>
            {result.processed.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                {result.processed.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            )}
            {result.processed.length === 0 && (
              <p className="mt-2 text-muted-foreground">
                Nothing new to import. Record in Plaud, wait for the transcript,
                then sync again.
              </p>
            )}
          </div>

          <ol className="space-y-2">
            {events
              .filter((e) => e.stage !== "error" || result.processed.length === 0)
              .slice(-8)
              .map((event, i) => (
                <li
                  key={`${event.stage}-${i}`}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {STAGE_LABEL[event.stage] ?? event.stage}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {event.message}
                  </span>
                </li>
              ))}
          </ol>

          {result.sideQuests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Introductions found</h3>
              {result.sideQuests.map((sq) => (
                <SideQuestCard key={sq.id} sideQuest={sq} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/conversations"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
        >
          View conversations
        </Link>
        <Link
          href="/sidequests"
          className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
        >
          View SideQuests
        </Link>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
