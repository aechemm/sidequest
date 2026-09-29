import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SideQuest } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
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
                Suggested introduction
              </p>
            )}
            <CardTitle className="text-lg">
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
                Verified
              </Badge>
            )}
            <Badge variant="outline">{sideQuest.confidence} confidence</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sideQuest.evidence.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              From your conversations
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

        {sideQuest.bonusPeople && sideQuest.bonusPeople.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sideQuest.bonusPeople.map((p) => (
              <Badge key={p} variant="outline">
                Also: {p}
              </Badge>
            ))}
          </div>
        )}

        <Link
          href={`/graph?quest=${sideQuest.id}`}
          className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          Why this match?
        </Link>

        <details className="group rounded-lg border border-border bg-muted/20 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Draft introduction
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {sideQuest.draftIntro}
          </p>
        </details>
      </CardContent>
    </Card>
  );
}
