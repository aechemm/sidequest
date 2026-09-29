import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PipelineStatus } from "@/lib/types";

const STAGE_PROGRESS: Record<string, number> = {
  idle: 0,
  uploading: 15,
  transcribing: 30,
  extracting: 50,
  critiquing: 70,
  building_graph: 90,
  complete: 100,
  error: 100,
};

interface PipelineStatusCardProps {
  status: PipelineStatus | null;
}

export function PipelineStatusCard({ status }: PipelineStatusCardProps) {
  if (!status) return null;

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
        <CardTitle className="text-base">Pipeline</CardTitle>
        <Badge variant={variant}>{status.stage}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground">{status.message}</p>
        {(status.factsExtracted !== undefined ||
          status.factsApproved !== undefined) && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {status.factsExtracted !== undefined && (
              <span>Extracted: {status.factsExtracted}</span>
            )}
            {status.factsApproved !== undefined && (
              <span className="text-green-600">
                Approved: {status.factsApproved}
              </span>
            )}
            {status.factsBlocked !== undefined && (
              <span className="text-red-600">
                Blocked: {status.factsBlocked}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
