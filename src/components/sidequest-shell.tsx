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

export interface SideQuestInitialState {
  conversations: Conversation[];
  sideQuests: SideQuest[];
  graph: GraphData;
  activities: AgentActivityEvent[];
  stats: NetworkStats;
  status: PipelineStatus;
  services: Record<string, boolean>;
  bandRoomUrl: string | null;
}

interface SideQuestShellProps {
  initial?: SideQuestInitialState;
}

export function SideQuestShell({ initial }: SideQuestShellProps) {
  const [tab, setTab] = useState("dashboard");
  const [conversations, setConversations] = useState<Conversation[]>(
    initial?.conversations ?? [],
  );
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(
    initial?.conversations[0] ?? null,
  );
  const [graph, setGraph] = useState<GraphData>(
    initial?.graph ?? { nodes: [], links: [] },
  );
  const [highlightGraph, setHighlightGraph] = useState<GraphData | null>(
    initial?.sideQuests[0]?.highlightPath ?? null,
  );
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>(
    initial?.sideQuests ?? [],
  );
  const [activeQuestId, setActiveQuestId] = useState<string | null>(
    initial?.sideQuests[0]?.id ?? null,
  );
  const [status, setStatus] = useState<PipelineStatus | null>(
    initial?.status ?? null,
  );
  const [activities, setActivities] = useState<AgentActivityEvent[]>(
    initial?.activities ?? [],
  );
  const [stats, setStats] = useState<NetworkStats>(
    initial?.stats ?? EMPTY_STATS,
  );
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Record<string, boolean>>(
    initial?.services ?? {},
  );
  const [bandRoomUrl, setBandRoomUrl] = useState<string | null>(
    initial?.bandRoomUrl ?? null,
  );
  const [bandKickoffStatus, setBandKickoffStatus] = useState<string | null>(
    null,
  );
  const [demoError, setDemoError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const refreshGraph = useCallback(async () => {
    const response = await fetch("/api/graph");
    setGraph((await response.json()) as GraphData);
  }, []);

  useEffect(() => {
    if (initial) return;
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
  }, [initial, refreshGraph]);

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
    setDemoError(null);
    setActivities([]);
    setStatus({ stage: "extracting", message: "Loading demo conversations…" });

    try {
      const loadRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useDemo: true }),
      });
      if (!loadRes.ok) {
        throw new Error(`Transcribe API failed (${loadRes.status})`);
      }
      const loadData = (await loadRes.json()) as {
        conversations?: Conversation[];
        error?: string;
      };
      if (!loadData.conversations?.length) {
        throw new Error(loadData.error ?? "Demo conversations missing");
      }
      setConversations(loadData.conversations);
      setSelectedConv(loadData.conversations[0] ?? null);

      setStatus({ stage: "discovering", message: "Running SideQuest demo…" });

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo", useMock: true }),
      });
      const data = (await res.json()) as Parameters<typeof applyDiscovery>[0] & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `Pipeline failed (${res.status})`);
      }
      applyDiscovery(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Demo failed — check terminal";
      setDemoError(message);
      setStatus({ stage: "error", message });
    } finally {
      setLoading(false);
    }
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

  const pollPlaudTranscript = async (
    transcriptionId: string,
    title: string,
  ): Promise<Conversation> => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      setUploadStatus(`Plaud transcribing… (${attempt + 1}/40)`);
      const response = await fetch(`/api/transcribe/${transcriptionId}`);
      const data = (await response.json()) as {
        status?: string;
        transcript?: Conversation;
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      if (data.status === "SUCCESS" && data.transcript) {
        return {
          ...data.transcript,
          title,
          processingStatus: "pending",
        };
      }
      if (data.status === "FAILED") {
        throw new Error("Plaud transcription failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    throw new Error(
      "Transcription timed out — paste the transcript at /conversations/add instead",
    );
  };

  const uploadAudio = async (file: File) => {
    setLoading(true);
    setUploadStatus("Uploading audio to Plaud…");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, ""));
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        conversation?: Conversation;
        transcriptionId?: string;
        title?: string;
        error?: string;
        notice?: string;
      };
      if (data.error) throw new Error(data.error);

      if (data.conversation) {
        setUploadStatus(data.notice ?? "Processing conversation…");
        await ingestOne(data.conversation);
        setUploadStatus("Done — check SideQuests tab");
        return;
      }

      if (data.transcriptionId) {
        const conversation = await pollPlaudTranscript(
          data.transcriptionId,
          data.title ?? file.name,
        );
        setUploadStatus("Extracting entities and updating graph…");
        await ingestOne(conversation);
        setUploadStatus("Done — SideQuest updated");
        return;
      }

      throw new Error("Unexpected Plaud response");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Audio upload failed";
      setUploadStatus(message);
      setStatus({ stage: "error", message });
    } finally {
      setLoading(false);
    }
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
          <button
            type="button"
            disabled={loading}
            onClick={() => void runDemo()}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
          >
            <Zap className="size-4" />
            {loading ? "Running…" : "Demo Data"}
          </button>
          <a
            href="/"
            className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-sm hover:bg-muted"
          >
            Reload demo
          </a>
          <a
            href="/conversations/add"
            className="inline-flex h-7 items-center rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 text-sm text-amber-500 hover:bg-amber-500/20"
          >
            Add real conversation
          </a>
        </div>
        {demoError && (
          <p className="text-sm text-red-500">
            Demo error: {demoError}. Check the terminal where npm run dev is
            running, or pull the latest code in GitHub Desktop.
          </p>
        )}
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
            <SideQuestCard sideQuest={featured} featured highlighted />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Sparkles className="size-8 text-amber-500" />
                <p className="text-muted-foreground">
                  No SideQuest yet — run Demo Data or add 3 conversations.
                </p>
                <button
                  type="button"
                  onClick={() => void runDemo()}
                  disabled={loading}
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
                >
                  Run Demo Data
                </button>
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
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">Record at Hack Day with Plaud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Record a booth chat or hallway conversation on your Plaud device.</p>
              <p>2. Export the audio (.mp3 / .wav) from the Plaud app.</p>
              <p>3. Upload below — SideQuest transcribes, extracts entities, updates Neo4j.</p>
              <p>
                4. After 3+ conversations, cross-conversation SideQuests appear. Or{" "}
                <a href="/conversations/add" className="text-amber-500 underline">
                  paste a transcript manually
                </a>{" "}
                (works without JavaScript).
              </p>
              {services.plaud ? (
                <Badge>Plaud: connected</Badge>
              ) : (
                <Badge variant="secondary">Plaud: not configured on server</Badge>
              )}
            </CardContent>
          </Card>
          <ConversationForm onSubmit={(c) => void ingestOne(c)} loading={loading} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plaud audio upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAudio(file);
                }}
              />
              {uploadStatus && (
                <p className="text-sm text-muted-foreground">{uploadStatus}</p>
              )}
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
