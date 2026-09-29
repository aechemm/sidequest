import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Conversation } from "@/lib/types";

interface TranscriptPanelProps {
  conversation: Conversation | null;
}

export function TranscriptPanel({ conversation }: TranscriptPanelProps) {
  if (!conversation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Upload audio or run the 3-conversation demo.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{conversation.title}</CardTitle>
        <Badge variant="secondary">{conversation.source}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {conversation.segments.map((segment) => (
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
