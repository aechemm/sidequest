import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NetworkStats } from "@/lib/types";
import Link from "next/link";

interface StatsGridProps {
  stats: NetworkStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: "People", value: stats.people },
    { label: "Companies", value: stats.companies },
    {
      label: "Conversations",
      value: stats.conversations,
      href: "/conversations" as const,
    },
    {
      label: "Introductions",
      value: stats.connectionsDiscovered,
      href: "/sidequests" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const body = (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
            </CardContent>
          </>
        );
        return item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-xl transition hover:ring-1 hover:ring-amber-500/40"
          >
            <Card className="h-full">{body}</Card>
          </Link>
        ) : (
          <Card key={item.label}>{body}</Card>
        );
      })}
    </div>
  );
}
