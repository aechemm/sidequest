import { AGENT_LABELS } from "@/lib/agent-activity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentActivityEvent } from "@/lib/types";

const STATUS_VARIANT: Record<
  AgentActivityEvent["status"],
  "default" | "secondary" | "destructive"
> = {
  info: "secondary",
  success: "default",
  blocked: "destructive",
  error: "destructive",
};

const STATUS_LABEL: Record<AgentActivityEvent["status"], string> = {
  info: "info",
  success: "done",
  blocked: "held",
  error: "error",
};

interface AgentActivityPanelProps {
  events: AgentActivityEvent[];
}

export function AgentActivityPanel({ events }: AgentActivityPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Processing log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Status notes from extract / graph / verify — not the introductions
          themselves. Open SideQuests to browse matches.
        </p>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Activity shows up after you sync or add a conversation.
          </p>
        ) : (
          events
            .slice()
            .reverse()
            .slice(0, 12)
            .map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {AGENT_LABELS[event.agent] ?? event.agent}
                  </p>
                  <p className="text-xs text-muted-foreground">{event.message}</p>
                </div>
                <Badge variant={STATUS_VARIANT[event.status]} className="shrink-0">
                  {STATUS_LABEL[event.status]}
                </Badge>
              </div>
            ))
        )}
      </CardContent>
    </Card>
  );
}
