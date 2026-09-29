import { AgentActivityPanel } from "@/components/agent-activity-panel";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { PipelineStatusCard } from "@/components/pipeline-status";
import { SideQuestCard } from "@/components/sidequest-card";
import { StatsGrid } from "@/components/stats-grid";
import { getAppState } from "@/lib/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const state = await getAppState();
  const featured = state.sideQuests[0] ?? null;
  const moreQuests = state.sideQuests.slice(1);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/" />

      <div className="space-y-6">
        {featured ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  Introductions ({state.sideQuests.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Suggested people to connect from your recent conversations.
                </p>
              </div>
              <Link
                href="/sidequests"
                className="text-sm text-amber-500 underline"
              >
                Open SideQuests
              </Link>
            </div>
            <SideQuestCard sideQuest={featured} featured highlighted />
            {moreQuests.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {moreQuests.length} more
                </p>
                {moreQuests.map((sq) => (
                  <SideQuestCard key={sq.id} sideQuest={sq} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <p className="text-lg font-medium">No introductions yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Sync conversations from Plaud or add a few chats. SideQuest looks
                across them for people who should meet.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/plaud"
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Connect Plaud
                </Link>
                <Link
                  href="/conversations/add"
                  className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
                >
                  Add a conversation
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <StatsGrid stats={state.stats} />
        <PipelineStatusCard status={state.status} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {state.conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing synced yet.{" "}
                  <Link href="/plaud" className="text-amber-500 underline">
                    Pull from Plaud
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/conversations/add"
                    className="text-amber-500 underline"
                  >
                    add one manually
                  </Link>
                  .
                </p>
              ) : (
                state.conversations.map((c) => (
                  <Link
                    key={c.id}
                    href={`/conversations#${c.id}`}
                    className="block w-full rounded-lg border p-3 text-left text-sm hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {c.participant ?? c.title}
                      </span>
                      <span className="rounded border px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                        {(c.processingStatus ?? "ready").replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.company ?? c.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs">
                      {c.summary ?? c.text}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
          <AgentActivityPanel events={state.activities} />
        </div>
      </div>
    </div>
  );
}
