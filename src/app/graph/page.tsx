import { SideQuestGraphPanel } from "@/components/sidequest-graph-panel";
import { discoverSideQuests } from "@/lib/discover";
import { runDemoMock } from "@/lib/pipeline";
import { DEMO_CONVERSATIONS } from "@/lib/sample-conversations";
import Link from "next/link";

interface GraphPageProps {
  searchParams: Promise<{ quest?: string }>;
}

export default async function GraphPage({ searchParams }: GraphPageProps) {
  const { quest } = await searchParams;
  const demo = await runDemoMock(DEMO_CONVERSATIONS);
  const sideQuests = discoverSideQuests(DEMO_CONVERSATIONS, demo.graph);
  const active =
    sideQuests.find((sq) => sq.id === quest) ?? sideQuests[0] ?? null;
  const highlight = active?.highlightPath ?? demo.graph;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-amber-500 hover:underline">
          ← Back to SideQuest
        </Link>
        <h1 className="text-2xl font-bold">Why this connection?</h1>
        {active && (
          <p className="text-muted-foreground">
            {active.people.join(" ↔ ")} — {active.reason}
          </p>
        )}
      </div>

      {active && (
        <div className="rounded-lg border bg-muted/20 p-4 font-mono text-sm">
          {active.pathDescription}
        </div>
      )}

      <SideQuestGraphPanel data={highlight} />

      {sideQuests.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sideQuests.map((sq) => (
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
