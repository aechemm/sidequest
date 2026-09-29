import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentActivityEvent } from "@/lib/types";
import { Bot } from "lucide-react";

const STATUS_VARIANT: Record<
  AgentActivityEvent["status"],
  "default" | "secondary" | "destructive"
> = {
  info: "secondary",
  success: "default",
  blocked: "destructive",
  error: "destructive",
};

interface AgentActivityPanelProps {
  events: AgentActivityEvent[];
}

export function AgentActivityPanel({ events }: AgentActivityPanelProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4" />
            Agent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Process a conversation or run the demo to see BAND agent handoffs.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="size-4" />
          Agent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...events].reverse().slice(0, 8).map((evt) => (
          <div
            key={evt.id}
            className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm"
          >
            <Badge variant={STATUS_VARIANT[evt.status]} className="shrink-0">
              {evt.agent.replace("Agent", "")}
            </Badge>
            <div>
              <p>{evt.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
