import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { SideQuestGraphPanel } from "@/components/sidequest-graph-panel";
import { getAppState } from "@/lib/app-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface GraphPageProps {
  searchParams: Promise<{ quest?: string }>;
}

export default async function GraphPage({ searchParams }: GraphPageProps) {
  const { quest } = await searchParams;
  const state = await getAppState();
  const active =
    state.sideQuests.find((sq) => sq.id === quest) ?? state.sideQuests[0] ?? null;
  const highlight = active?.highlightPath ?? state.graph;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/graph" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {active ? "Why this introduction?" : "Relationship graph"}
        </h2>
        {active ? (
          <p className="text-muted-foreground">
            {active.people.join(" ↔ ")} — {active.reason}
          </p>
        ) : (
          <p className="text-muted-foreground">
            People, topics, and conversations SideQuest has connected so far.
          </p>
        )}
      </div>

      {active && active.pathDescription && (
        <p className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
          {active.pathDescription}
        </p>
      )}

      {highlight.nodes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Graph is empty.{" "}
          <Link href="/plaud" className="text-amber-500 underline">
            Sync conversations
          </Link>{" "}
          to start building it.
        </div>
      ) : (
        <SideQuestGraphPanel data={highlight} />
      )}

      {state.sideQuests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {state.sideQuests.map((sq) => (
            <Link
              key={sq.id}
              href={`/graph?quest=${sq.id}`}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                sq.id === active?.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "hover:bg-muted"
              }`}
            >
              {sq.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
