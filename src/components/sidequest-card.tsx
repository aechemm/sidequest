import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SideQuest } from "@/lib/types";
import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

interface SideQuestCardProps {
  sideQuest: SideQuest;
  highlighted?: boolean;
  featured?: boolean;
}

export function SideQuestCard({
  sideQuest,
  highlighted,
  featured,
}: SideQuestCardProps) {
  return (
    <Card
      className={
        highlighted || featured
          ? "border-amber-500/50 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/5"
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {featured && (
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                SideQuest Discovered
              </p>
            )}
            <CardTitle className="flex items-center gap-2 text-lg">
              {!featured && <Sparkles className="size-5 text-amber-500" />}
              {sideQuest.people.join(" ↔ ")}
            </CardTitle>
            <CardDescription className="text-base text-foreground/90">
              {sideQuest.reason}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {sideQuest.approved && (
              <Badge className="gap-1">
                <CheckCircle2 className="size-3" />
                APPROVED
              </Badge>
            )}
            <Badge variant="outline">Confidence: {sideQuest.confidence}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sideQuest.evidence.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Evidence
            </p>
            <ul className="space-y-1 text-sm">
              {sideQuest.evidence.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {sideQuest.bonusPeople?.map((p) => (
            <Badge key={p} variant="outline">
              + {p}
            </Badge>
          ))}
        </div>

        <p className="rounded-md bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
          {sideQuest.pathDescription}
        </p>

        <Link
          href={`/graph?quest=${sideQuest.id}`}
          className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          Why? — view cross-conversation path
        </Link>

        <details className="group rounded-lg border border-border bg-muted/20 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Draft Introduction — click to expand
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {sideQuest.draftIntro}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Select the text above to copy, or use your browser&apos;s copy
            shortcut.
          </p>
        </details>
      </CardContent>
    </Card>
  );
}
