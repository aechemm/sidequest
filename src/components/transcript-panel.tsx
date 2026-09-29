import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transcript } from "@/lib/types";

interface TranscriptPanelProps {
  transcript: Transcript | null;
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  if (!transcript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Upload audio or load the sample transcript to begin.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Transcript</CardTitle>
        <Badge variant="secondary">{transcript.source}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {transcript.segments.map((segment) => (
          <div
            key={`${segment.start}-${segment.end}`}
            className="rounded-lg border bg-muted/20 p-3 text-sm"
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {segment.speaker ?? "Speaker"}
              </span>
              <span>
                {segment.start.toFixed(1)}s – {segment.end.toFixed(1)}s
              </span>
            </div>
            <p>{segment.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
