import { AgentActivityPanel } from "@/components/agent-activity-panel";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppState } from "@/lib/demo-state";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const state = await getAppState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/agents" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">BAND coordination chain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="font-mono">
            ExtractorAgent → GraphAgent → ScoutAgent → ConnectorAgent → CriticAgent
          </p>
          <p>
            Critic can BLOCK — blocked SideQuests never appear in the UI.
          </p>
          {state.bandRoomUrl ? (
            <a
              href={state.bandRoomUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-lg border px-4 text-sm text-foreground hover:bg-muted"
            >
              Open live Band room
            </a>
          ) : (
            <p>Band room URL not configured.</p>
          )}
          <p className="text-xs">
            In Band chat, @mention{" "}
            <span className="font-semibold text-foreground">@hmorder/extractor</span>{" "}
            with a transcript — agents hand off automatically.
          </p>
        </CardContent>
      </Card>

      <AgentActivityPanel events={state.activities} />
    </div>
  );
}
