import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NetworkStats } from "@/lib/types";

interface StatsGridProps {
  stats: NetworkStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: "People", value: stats.people },
    { label: "Companies", value: stats.companies },
    { label: "Conversations", value: stats.conversations },
    { label: "Introductions", value: stats.connectionsDiscovered },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
