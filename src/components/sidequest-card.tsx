"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SideQuest } from "@/lib/types";
import { CheckCircle2, Copy, Sparkles } from "lucide-react";
import { useState } from "react";

interface SideQuestCardProps {
  sideQuest: SideQuest;
  onShowWhy?: () => void;
  highlighted?: boolean;
  featured?: boolean;
}

export function SideQuestCard({
  sideQuest,
  onShowWhy,
  highlighted,
  featured,
}: SideQuestCardProps) {
  const [copied, setCopied] = useState(false);

  const copyIntro = async () => {
    await navigator.clipboard.writeText(sideQuest.draftIntro);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onShowWhy}>
            Why?
          </Button>
          <Button size="sm" onClick={() => void copyIntro()}>
            <Copy className="size-4" />
            {copied ? "Copied!" : "Draft Introduction"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
