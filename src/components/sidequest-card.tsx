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
}

export function SideQuestCard({
  sideQuest,
  onShowWhy,
  highlighted,
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
        highlighted
          ? "border-primary ring-2 ring-primary/30 shadow-lg"
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-amber-500" />
              SideQuest Discovered
            </CardTitle>
            <CardDescription className="text-base font-medium text-foreground">
              {sideQuest.title}
            </CardDescription>
          </div>
          {sideQuest.approved && (
            <Badge className="shrink-0 gap-1">
              <CheckCircle2 className="size-3" />
              APPROVED
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{sideQuest.reason}</p>

        <div className="flex flex-wrap gap-2">
          {sideQuest.people.map((p) => (
            <Badge key={p} variant="secondary">
              {p}
            </Badge>
          ))}
          {sideQuest.bonusPeople?.map((p) => (
            <Badge key={p} variant="outline">
              + {p}
            </Badge>
          ))}
        </div>

        <p className="rounded-md bg-muted/50 p-2 font-mono text-xs text-muted-foreground">
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

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Preview intro
          </summary>
          <p className="mt-2 whitespace-pre-wrap rounded-md border p-3 text-sm">
            {sideQuest.draftIntro}
          </p>
        </details>
      </CardContent>
    </Card>
  );
}
