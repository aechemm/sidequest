"use client";

import { GraphView } from "@/components/graph-view";
import { PipelineStatusCard } from "@/components/pipeline-status";
import { SideQuestCard } from "@/components/sidequest-card";
import { TranscriptPanel } from "@/components/transcript-panel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  Conversation,
  GraphData,
  PipelineStatus,
  SideQuest,
} from "@/lib/types";
import {
  ExternalLink,
  GitBranch,
  Mic,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function SideQuestApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], links: [] });
  const [highlightGraph, setHighlightGraph] = useState<GraphData | null>(null);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [bandRoomUrl, setBandRoomUrl] = useState<string | null>(null);

  const refreshGraph = useCallback(async () => {
    const response = await fetch("/api/graph");
    const data = (await response.json()) as GraphData;
    setGraph(data);
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

  const runDemo = async () => {
    setLoading(true);
    setStatus({ stage: "extracting", message: "Loading 3 demo conversations…" });

    const loadRes = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useDemo: true }),
    });
    const loadData = (await loadRes.json()) as {
      conversations: Conversation[];
    };
    setConversations(loadData.conversations);
    setSelectedConv(loadData.conversations[0] ?? null);

    setStatus({ stage: "discovering", message: "Ingesting & discovering connections…" });

    const res = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo" }),
    });
    const data = (await res.json()) as {
      sideQuests: SideQuest[];
      status: PipelineStatus;
      graph: GraphData;
    };

    setSideQuests(data.sideQuests ?? []);
    setStatus(data.status);
    setGraph(data.graph ?? { nodes: [], links: [] });
    if (data.sideQuests?.[0]) {
      setActiveQuestId(data.sideQuests[0].id);
      setHighlightGraph(data.sideQuests[0].highlightPath ?? null);
    }
    setLoading(false);
  };

  const uploadAudio = async (file: File) => {
    setLoading(true);
    setStatus({ stage: "uploading", message: "Uploading to Plaud…" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    const response = await fetch("/api/transcribe", { method: "POST", body: formData });
    const data = (await response.json()) as {
      conversation?: Conversation;
      transcriptionId?: string;
      notice?: string;
    };

    if (data.conversation) {
      await ingestOne(data.conversation);
    } else if (data.transcriptionId) {
      await pollTranscription(data.transcriptionId, file.name);
    }
    setLoading(false);
  };

  const pollTranscription = async (id: string, title: string) => {
    for (let i = 0; i < 30; i++) {
      const response = await fetch(`/api/transcribe/${id}`);
      const data = (await response.json()) as {
        status: string;
        transcript?: Conversation;
      };
      if (data.status === "SUCCESS" && data.transcript) {
        const conv: Conversation = {
          ...data.transcript,
          title,
          id: data.transcript.id ?? `conv-${Date.now()}`,
        };
        await ingestOne(conv);
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setStatus({ stage: "error", message: "Transcription timed out." });
  };

  const ingestOne = async (conversation: Conversation) => {
    setStatus({ stage: "extracting", message: `Processing ${conversation.title}…` });
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });

    const updated = [...conversations.filter((c) => c.id !== conversation.id), conversation];
    setConversations(updated);
    setSelectedConv(conversation);

    const discoverRes = await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversations: updated }),
    });
    const discoverData = (await discoverRes.json()) as {
      sideQuests: SideQuest[];
      status: PipelineStatus;
      graph: GraphData;
    };
    setSideQuests(discoverData.sideQuests ?? []);
    setStatus(discoverData.status);
    setGraph(discoverData.graph);
    if (discoverData.sideQuests?.[0]) {
      setActiveQuestId(discoverData.sideQuests[0].id);
      setHighlightGraph(discoverData.sideQuests[0].highlightPath ?? null);
    }
  };

  const showWhy = (sq: SideQuest) => {
    setActiveQuestId(sq.id);
    setHighlightGraph(sq.highlightPath ?? null);
  };

  const displayGraph = highlightGraph ?? graph;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Plaud</Badge>
          <Badge variant="outline">Crusoe</Badge>
          <Badge variant="outline">Neo4j</Badge>
          <Badge variant="outline">BAND</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">SideQuest</h1>
        <p className="max-w-2xl text-muted-foreground">
          Plaud remembers who you talked to. SideQuest discovers why those
          people should talk to each other — connections that only emerge across
          separate conversations.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(services).map(([name, ok]) => (
            <Badge key={name} variant={ok ? "default" : "secondary"}>
              {name}: {ok ? "live" : "mock"}
            </Badge>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="size-4" />
                Conversations
              </CardTitle>
              <CardDescription>
                Record at Hack Day — each conversation feeds the graph.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                accept="audio/*"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAudio(file);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button disabled={loading} onClick={() => void runDemo()}>
                  <Zap className="size-4" />
                  Run 3-convo demo
                </Button>
              </div>
              {conversations.length > 0 && (
                <div className="space-y-1">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConv(c)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        selectedConv?.id === c.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <PipelineStatusCard status={status} />

          {sideQuests.map((sq) => (
            <SideQuestCard
              key={sq.id}
              sideQuest={sq}
              highlighted={activeQuestId === sq.id}
              onShowWhy={() => showWhy(sq)}
            />
          ))}

          {sideQuests.length === 0 && conversations.length >= 2 && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                <Sparkles className="mb-2 size-5" />
                No SideQuest yet — need connections across conversations. Try
                the 3-convo demo.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="size-4" />
                Relationship Graph
                {highlightGraph && (
                  <Badge variant="secondary">Why? path highlighted</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GraphView data={displayGraph} />
            </CardContent>
          </Card>

          <TranscriptPanel conversation={selectedConv} />

          {bandRoomUrl && (
            <a
              href={bandRoomUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              <ExternalLink className="size-4" />
              Open Band room (Scout · Graph · Connector · Critic)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
