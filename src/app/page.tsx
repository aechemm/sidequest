import { AgentActivityPanel } from "@/components/agent-activity-panel";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { PipelineStatusCard } from "@/components/pipeline-status";
import { SideQuestCard } from "@/components/sidequest-card";
import { StatsGrid } from "@/components/stats-grid";
import { getAppState } from "@/lib/demo-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const state = await getAppState();
  const featured = state.sideQuests[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/" />

      <div className="space-y-6">
        {featured ? (
          <SideQuestCard sideQuest={featured} featured highlighted />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No SideQuest yet —{" "}
              <Link href="/conversations/add" className="text-amber-500 underline">
                add conversations
              </Link>
              .
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
              {state.conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/conversations#${c.id}`}
                  className="block w-full rounded-lg border p-3 text-left text-sm hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.participant ?? c.title}</span>
                    <span className="rounded border px-1.5 py-0.5 text-xs">
                      {c.processingStatus ?? "pending"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.company ?? c.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs">
                    {c.summary ?? c.text}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>
          <AgentActivityPanel events={state.activities} />
        </div>
      </div>
    </div>
  );
}
