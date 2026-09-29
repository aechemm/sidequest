import { AgentActivityPanel } from "@/components/agent-activity-panel";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppState } from "@/lib/app-state";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const state = await getAppState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/agents" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Activity</h2>
        <p className="text-sm text-muted-foreground">
          What SideQuest did with your conversations — extract details, update
          the graph, find introductions, and verify them.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Every conversation is checked for people, companies, problems, and
            offers. SideQuest then looks across your whole network for matches —
            and only surfaces introductions it can support with evidence.
          </p>
          {state.bandRoomUrl && (
            <a
              href={state.bandRoomUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-lg border px-4 text-sm text-foreground hover:bg-muted"
            >
              Open live workspace
            </a>
          )}
        </CardContent>
      </Card>

      <AgentActivityPanel events={state.activities} />
    </div>
  );
}
