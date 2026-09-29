"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GraphData, GraphNode } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const NODE_COLORS: Record<string, string> = {
  Person: "#60a5fa",
  Company: "#34d399",
  Topic: "#c084fc",
  Problem: "#f87171",
  Capability: "#fbbf24",
  Conversation: "#64748b",
  SideQuest: "#f59e0b",
};

interface GraphViewProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
}

export function GraphView({ data, onNodeClick }: GraphViewProps) {
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n, name: n.label })),
      links: data.links.map((l) => ({ ...l, name: l.type })),
    }),
    [data],
  );

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Graph is empty — sync or add conversations to build it.
      </div>
    );
  }

  return (
    <div className="h-[480px] overflow-hidden rounded-xl border border-border bg-[#020617]">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node) => `${(node as { name?: string }).name ?? ""}`}
        nodeColor={(node) =>
          NODE_COLORS[(node as { type?: string }).type ?? "Topic"] ?? "#94a3b8"
        }
        linkLabel={(link) => (link as { name?: string }).name ?? ""}
        linkColor={() => "#475569"}
        backgroundColor="#020617"
        nodeRelSize={7}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={80}
        onNodeClick={(node) => {
          if (onNodeClick) {
            onNodeClick(node as unknown as GraphNode);
          }
        }}
      />
    </div>
  );
}
