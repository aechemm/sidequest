"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GraphData } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const NODE_COLORS: Record<string, string> = {
  Person: "#3b82f6",
  Decision: "#8b5cf6",
  Task: "#22c55e",
  Question: "#f59e0b",
  Blocker: "#ef4444",
  Meeting: "#64748b",
};

interface GraphViewProps {
  data: GraphData;
}

export function GraphView({ data }: GraphViewProps) {
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n, name: n.label })),
      links: data.links.map((l) => ({ ...l, name: l.type })),
    }),
    [data],
  );

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
        No graph data yet — run the pipeline to populate Neo4j.
      </div>
    );
  }

  return (
    <div className="h-[420px] overflow-hidden rounded-xl border bg-slate-950">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node) => `${(node as { name?: string }).name ?? ""}`}
        nodeColor={(node) =>
          NODE_COLORS[(node as { type?: string }).type ?? "Meeting"] ??
          "#94a3b8"
        }
        linkLabel={(link) => (link as { name?: string }).name ?? ""}
        linkColor={() => "#475569"}
        backgroundColor="#020617"
        nodeRelSize={6}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={80}
      />
    </div>
  );
}
