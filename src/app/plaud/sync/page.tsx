import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { SideQuestCard } from "@/components/sidequest-card";
import { getAppState } from "@/lib/demo-state";
import type { SyncEvent, SyncResult } from "@/lib/plaud-sync";
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
  }>;
}

const STAGE_LABEL: Record<string, string> = {
  auth: "🔐 Auth",
  listing: "📂 Listing recordings",
  detected: "🎙 New Plaud recording detected",
  transcript: "📝 Transcript retrieved",
  extracting: "🧠 Extracting knowledge",
  graph: "🕸 Updating graph",
  discovering: "🔎 Searching for connections",
  complete: "✨ Complete",
  error: "⚠ Issue",
  idle: "…",
};

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
  const state = await getAppState();
  const params = await searchParams;
  const result = decodeResult(params.data);

  const events: SyncEvent[] = result?.events ?? [];
  const sideQuests = result?.sideQuests ?? state.sideQuests;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/plaud" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Plaud sync result</h2>
        <p className="text-sm text-muted-foreground">
          Device → Plaud App/account → SideQuest ingest (via Plaud CLI).
        </p>
      </div>

      {!result && (
        <div className="rounded-xl border p-4 text-sm">
          <p>
            Auth: {params.auth === "1" ? "ok" : "needed"} · Processed:{" "}
            {params.processed ?? "0"} · SideQuests: {params.quests ?? "0"}
          </p>
          {params.error && (
            <p className="mt-2 text-red-400">{decodeURIComponent(params.error)}</p>
          )}
          {params.auth === "0" && (
            <p className="mt-2 text-amber-500">
              Run in Desktop terminal:{" "}
              <code className="font-mono">npx plaud login</code>
            </p>
          )}
        </div>
      )}

      {result && (
        <>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm">
              {result.authenticated ? (
                <span className="text-amber-500">Plaud account connected</span>
              ) : (
                <span className="text-red-400">Not signed in</span>
              )}
              {" · "}
              New: {result.processed.length} · Skipped: {result.skipped.length} ·
              SideQuests: {result.sideQuests.length}
            </p>
          </div>

          <ol className="space-y-2">
            {events.map((event, i) => (
              <li
                key={`${event.stage}-${i}`}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {STAGE_LABEL[event.stage] ?? event.stage}
                </span>
                <span className="text-muted-foreground"> — {event.message}</span>
              </li>
            ))}
          </ol>

          {result.sideQuests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">SideQuests from sync</h3>
              {result.sideQuests.map((sq) => (
                <SideQuestCard key={sq.id} sideQuest={sq} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/plaud"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
        >
          Sync again
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
