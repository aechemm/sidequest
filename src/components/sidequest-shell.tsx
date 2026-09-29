"use client";

import { AgentActivityPanel } from "@/components/agent-activity-panel";
import { ConversationForm } from "@/components/conversation-form";
import { GraphView } from "@/components/graph-view";
import { PipelineStatusCard } from "@/components/pipeline-status";
import { SideQuestCard } from "@/components/sidequest-card";
import { StatsGrid } from "@/components/stats-grid";
import { TranscriptPanel } from "@/components/transcript-panel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AgentActivityEvent,
  Conversation,
  GraphData,
  GraphNode,
  NetworkStats,
  PipelineStatus,
  SideQuest,
} from "@/lib/types";
import {
  ExternalLink,
  LayoutDashboard,
  MessageSquare,
  Network,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const EMPTY_STATS: NetworkStats = {
  people: 0,
  companies: 0,
  conversations: 0,
  connectionsDiscovered: 0,
};

export function SideQuestShell() {
  const [tab, setTab] = useState("dashboard");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], links: [] });
  const [highlightGraph, setHighlightGraph] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [activities, setActivities] = useState<AgentActivityEvent[]>([]);
  const [stats, setStats] = useState<NetworkStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [bandRoomUrl, setBandRoomUrl] = useState<string | null>(null);
  const [bandKickoffStatus, setBandKickoffStatus] = useState<string | null>(
    null,
  );

  const refreshGraph = useCallback(async () => {
    const response = await fetch("/api/graph");
    setGraph((await response.json()) as GraphData);
  }, []);

  useEffect(() => {
    void fetch("/api/health")
      .then((r) => r.json())
      .then(
        (data: {
          services: Record<string, boolean>;
          bandRoomUrl?: string | null;
        }) => {
          setServices(data.services);
          setBandRoomUrl(data.bandRoomUrl ?? null);
        },
      );
    void refreshGraph();
  }, [refreshGraph]);

  const applyDiscovery = (data: {
    sideQuests: SideQuest[];
    status: PipelineStatus;
    graph: GraphData;
    activities?: AgentActivityEvent[];
    stats?: NetworkStats;
  }) => {
    setSideQuests(data.sideQuests ?? []);
    setStatus(data.status);
    setGraph(data.graph ?? { nodes: [], links: [] });
    if (data.activities) {
      setActivities((prev) => [...prev, ...data.activities!]);
    }
    if (data.stats) setStats(data.stats);
    if (data.sideQuests?.[0]) {
      setActiveQuestId(data.sideQuests[0].id);
      setHighlightGraph(data.sideQuests[0].highlightPath ?? null);
      setTab("dashboard");
    }
  };

  const runDemo = async () => {
    setLoading(true);
    setActivities([]);
    setStatus({ stage: "extracting", message: "Loading demo conversations…" });

    const loadRes = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useDemo: true }),
    });
    const { conversations: demoConvs } = (await loadRes.json()) as {
      conversations: Conversation[];
    };
    setConversations(demoConvs);
    setSelectedConv(demoConvs[0] ?? null);

    const res = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo" }),
    });
    applyDiscovery((await res.json()) as Parameters<typeof applyDiscovery>[0]);
    setLoading(false);
  };

  const ingestOne = async (conversation: Conversation) => {
    setLoading(true);
    conversation.processingStatus = "processing";
    setStatus({ stage: "extracting", message: `Processing ${conversation.title}…` });

    const ingestRes = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });
    const ingestData = (await ingestRes.json()) as {
      activities?: AgentActivityEvent[];
    };
    if (ingestData.activities) {
      setActivities((prev) => [...prev, ...ingestData.activities!]);
    }

    const updated = [
      ...conversations.filter((c) => c.id !== conversation.id),
      { ...conversation, processingStatus: "complete" as const, summary: conversation.text.slice(0, 80) },
    ];
    setConversations(updated);
    setSelectedConv(updated.find((c) => c.id === conversation.id) ?? null);

    const discoverRes = await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversations: updated }),
    });
    applyDiscovery((await discoverRes.json()) as Parameters<typeof applyDiscovery>[0]);
    setLoading(false);
  };

  const uploadAudio = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    const response = await fetch("/api/transcribe", { method: "POST", body: formData });
    const data = (await response.json()) as {
      conversation?: Conversation;
      transcriptionId?: string;
    };
    if (data.conversation) await ingestOne(data.conversation);
    setLoading(false);
  };

  const kickoffBand = async () => {
    setBandKickoffStatus("Posting demo conversation to Band…");
    const conv =
      conversations[0] ??
      ({
        id: "conv-alice",
        title: "Conversation 1 — Alice @ Crusoe booth",
        text: "Alice: We built an inference platform that can operate inside a customer's VPC. No data leaves their environment.",
        segments: [
          {
            start: 0,
            end: 12,
            speaker: "Alice",
            text: "We built an inference platform that can operate inside a customer's VPC. No data leaves their environment.",
          },
        ],
      } as Conversation);

    const res = await fetch("/api/band/kickoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: conv, meetingId: conv.id }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      message?: string;
      error?: string;
      bandRoomUrl?: string | null;
    };
    if (data.ok) {
      setBandKickoffStatus(
        data.message ?? "Posted — watch your Band SideQuest chat for agent replies.",
      );
      if (data.bandRoomUrl) setBandRoomUrl(data.bandRoomUrl);
    } else {
      setBandKickoffStatus(data.error ?? "Band kickoff failed");
    }
  };

  const showWhy = (sq: SideQuest) => {
    setActiveQuestId(sq.id);
    setHighlightGraph(sq.highlightPath ?? null);
    setTab("graph");
  };

  const featured = sideQuests[0] ?? null;
  const displayGraph = highlightGraph ?? graph;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
          SideQuest
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Your conversations know who should meet.
        </h1>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {Object.entries(services).map(([name, ok]) => (
            <Badge key={name} variant={ok ? "default" : "secondary"} className="text-xs">
              {name}: {ok ? "live" : "mock"}
            </Badge>
          ))}
          <Button size="sm" disabled={loading} onClick={() => void runDemo()}>
            <Zap className="size-4" />
            Demo Data
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="conversations">
            <MessageSquare className="size-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="graph">
            <Network className="size-4" />
            Graph
          </TabsTrigger>
          <TabsTrigger value="sidequests">
            <Sparkles className="size-4" />
            SideQuests
          </TabsTrigger>
          <TabsTrigger value="agents">
            Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {featured ? (
            <SideQuestCard
              sideQuest={featured}
              featured
              highlighted
              onShowWhy={() => showWhy(featured)}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Sparkles className="size-8 text-amber-500" />
                <p className="text-muted-foreground">
                  No SideQuest yet — run Demo Data or add 3 conversations.
                </p>
                <Button onClick={() => void runDemo()} disabled={loading}>
                  Run Demo Data
                </Button>
              </CardContent>
            </Card>
          )}

          <StatsGrid stats={stats} />
          <PipelineStatusCard status={status} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent conversations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedConv(c);
                        setTab("conversations");
                      }}
                      className="w-full rounded-lg border p-3 text-left text-sm hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{c.participant ?? c.title}</span>
                        <Badge variant="outline">{c.processingStatus ?? "pending"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.company ?? c.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs">{c.summary ?? c.text}</p>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
            <AgentActivityPanel events={activities} />
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="mt-6 space-y-4">
          <ConversationForm onSubmit={(c) => void ingestOne(c)} loading={loading} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plaud audio upload</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept="audio/*"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAudio(file);
                }}
              />
            </CardContent>
          </Card>
          <TranscriptPanel conversation={selectedConv} />
        </TabsContent>

        <TabsContent value="graph" className="mt-6 space-y-4">
          <GraphView
            data={displayGraph}
            onNodeClick={(node) => setSelectedNode(node)}
          />
          {highlightGraph && (
            <Badge variant="secondary">SideQuest path highlighted</Badge>
          )}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedNode.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Type: {selectedNode.type}</p>
                {selectedNode.properties && (
                  <pre className="mt-2 overflow-auto rounded bg-muted/40 p-2 text-xs">
                    {JSON.stringify(selectedNode.properties, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sidequests" className="mt-6 space-y-4">
          {sideQuests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved SideQuests — Critic blocks unsupported connections.
            </p>
          ) : (
            sideQuests.map((sq) => (
              <SideQuestCard
                key={sq.id}
                sideQuest={sq}
                highlighted={activeQuestId === sq.id}
                onShowWhy={() => showWhy(sq)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="agents" className="mt-6 space-y-4">
          <AgentActivityPanel events={activities} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">BAND coordination chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm text-muted-foreground">
              <p>ExtractorAgent → GraphAgent → ScoutAgent → ConnectorAgent → CriticAgent</p>
              <p className="text-xs">
                Critic can BLOCK — blocked SideQuests never appear in the UI.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void kickoffBand()}
                >
                  Send demo convo to Band
                </Button>
                {bandRoomUrl && (
                  <a
                    href={bandRoomUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <ExternalLink className="size-4" />
                    Open Band room
                  </a>
                )}
              </div>
              {bandKickoffStatus && (
                <p className="pt-2 text-xs text-muted-foreground">
                  {bandKickoffStatus}
                </p>
              )}
              <p className="pt-2 text-xs">
                Or in Band chat, @mention{" "}
                <span className="font-semibold">@hmorder/extractor</span> with a
                transcript — agents chain handoffs automatically.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
