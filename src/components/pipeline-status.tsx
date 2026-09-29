import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PipelineStatus } from "@/lib/types";

const STAGE_PROGRESS: Record<string, number> = {
  idle: 0,
  uploading: 10,
  transcribing: 25,
  extracting: 40,
  building_graph: 55,
  discovering: 75,
  critiquing: 90,
  complete: 100,
  error: 100,
};

interface PipelineStatusCardProps {
  status: PipelineStatus | null;
}

export function PipelineStatusCard({ status }: PipelineStatusCardProps) {
  if (!status) return null;
  // Don't show a finished "nothing found" bar on an otherwise empty dashboard.
  if (
    status.stage === "complete" &&
    (status.sideQuestsFound ?? 0) === 0 &&
    !status.entitiesExtracted
  ) {
    return null;
  }

  const progress = STAGE_PROGRESS[status.stage] ?? 0;
  const variant =
    status.stage === "error"
      ? "destructive"
      : status.stage === "complete"
        ? "default"
        : "secondary";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Progress</CardTitle>
        <Badge variant={variant}>{status.stage.replace(/_/g, " ")}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground">{status.message}</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          {status.entitiesExtracted !== undefined && (
            <span>Details found: {status.entitiesExtracted}</span>
          )}
          {status.sideQuestsFound !== undefined && (
            <span className="font-medium text-amber-600">
              Introductions: {status.sideQuestsFound}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
