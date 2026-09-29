import type { GraphData } from "@/lib/types";

const NODE_COLORS: Record<string, string> = {
  Person: "text-blue-400",
  Topic: "text-purple-400",
  Conversation: "text-slate-400",
};

interface SideQuestGraphPanelProps {
  data: GraphData;
}

export function SideQuestGraphPanel({ data }: SideQuestGraphPanelProps) {
  const people = data.nodes.filter((n) => n.type === "Person");
  const topics = data.nodes.filter((n) => n.type === "Topic");

  return (
    <div className="space-y-4 rounded-xl border border-border bg-[#020617] p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        How they connect
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-400">People</p>
          <ul className="space-y-1 text-sm">
            {people.map((n) => (
              <li key={n.id} className={NODE_COLORS.Person}>
                ● {n.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-purple-400">Topics</p>
          <ul className="space-y-1 text-sm">
            {topics.map((n) => (
              <li key={n.id} className={NODE_COLORS.Topic}>
                ◆ {n.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-400">Relationships</p>
        <ul className="space-y-2 font-mono text-xs">
          {data.links.map((link, i) => {
            const source = data.nodes.find((n) => n.id === link.source);
            const target = data.nodes.find((n) => n.id === link.target);
            return (
              <li key={`${link.source}-${link.target}-${i}`} className="text-slate-300">
                {source?.label ?? link.source}{" "}
                <span className="text-amber-500">—{link.type}→</span>{" "}
                {target?.label ?? link.target}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        The match comes from patterns across conversations — not from any one chat
        alone.
      </p>
    </div>
  );
}
