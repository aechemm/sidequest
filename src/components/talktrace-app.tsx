"use client";

import { useCallback, useEffect, useState } from "react";
import { GraphView } from "@/components/graph-view";
import { PipelineStatusCard } from "@/components/pipeline-status";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  GraphData,
  PipelineStatus,
  Transcript,
} from "@/lib/types";
import {
  ExternalLink,
  GitBranch,
  Mic,
  Play,
  Radio,
  Upload,
} from "lucide-react";

export function TalkTraceApp() {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], links: [] });
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [bandRoomUrl, setBandRoomUrl] = useState<string | null>(null);
  const [facts, setFacts] = useState<
    Array<{ id: string; type: string; text: string; approved?: boolean; reason?: string }>
  >([]);

  const refreshGraph = useCallback(async (meetingId?: string) => {
    const url = meetingId
      ? `/api/graph?meetingId=${encodeURIComponent(meetingId)}`
      : "/api/graph";
    const response = await fetch(url);
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

  const loadMockTranscript = async () => {
    setLoading(true);
    setStatus({ stage: "transcribing", message: "Loading sample transcript…" });
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useMock: true }),
    });
    const data = (await response.json()) as { transcript: Transcript };
    setTranscript(data.transcript);
    setStatus({ stage: "idle", message: "Sample transcript ready." });
    setLoading(false);
  };

  const uploadAudio = async (file: File) => {
    setLoading(true);
    setStatus({ stage: "uploading", message: "Uploading audio to Plaud…" });
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as {
      mode: string;
      transcript?: Transcript;
      transcriptionId?: string;
      notice?: string;
    };

    if (data.transcript) {
      setTranscript(data.transcript);
      setStatus({
        stage: "idle",
        message: data.notice ?? "Transcript ready.",
      });
      setLoading(false);
      return;
    }

    if (data.transcriptionId) {
      setStatus({ stage: "transcribing", message: "Waiting for Plaud…" });
      await pollTranscription(data.transcriptionId);
    }
    setLoading(false);
  };

  const pollTranscription = async (id: string) => {
    for (let i = 0; i < 30; i++) {
      const response = await fetch(`/api/transcribe/${id}`);
      const data = (await response.json()) as {
        status: string;
        transcript?: Transcript;
      };
      if (data.status === "SUCCESS" && data.transcript) {
        setTranscript(data.transcript);
        setStatus({ stage: "idle", message: "Transcription complete." });
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setStatus({ stage: "error", message: "Transcription timed out." });
  };

  const runPipeline = async () => {
    if (!transcript) return;
    setLoading(true);
    const response = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, meetingId: transcript.id }),
    });
    const data = (await response.json()) as {
      status: PipelineStatus;
      facts?: Array<{ id: string; type: string; text: string }>;
      verdicts?: Array<{ factId: string; approved: boolean; reason: string }>;
      error?: string;
    };

    if (data.error) {
      setStatus({ stage: "error", message: data.error });
    } else {
      setStatus(data.status);
      const verdictMap = new Map(
        (data.verdicts ?? []).map((v) => [v.factId, v]),
      );
      setFacts(
        (data.facts ?? []).map((f) => ({
          ...f,
          approved: verdictMap.get(f.id)?.approved,
          reason: verdictMap.get(f.id)?.reason,
        })),
      );
      await refreshGraph(transcript.id);
    }
    setLoading(false);
  };

  const kickoffBand = async () => {
    if (!transcript) return;
    setLoading(true);
    setStatus({ stage: "extracting", message: "Posting to Band room…" });
    const response = await fetch("/api/band/kickoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, meetingId: transcript.id }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      message?: string;
      error?: string;
      hint?: string;
    };

    if (data.ok) {
      setStatus({
        stage: "extracting",
        message:
          data.message ??
          "Kickoff posted — agents coordinating in Band room.",
      });
    } else {
      setStatus({
        stage: "error",
        message: `${data.error ?? "Band kickoff failed"}. ${data.hint ?? ""}`,
      });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Crusoe</Badge>
          <Badge variant="outline">Plaud</Badge>
          <Badge variant="outline">BAND</Badge>
          <Badge variant="outline">Neo4j</Badge>
          <Badge variant="outline">DuploCloud-ready</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">TalkTrace</h1>
        <p className="max-w-2xl text-muted-foreground">
          Turn meeting audio into a live knowledge graph. Agents extract
          decisions and commitments on Crusoe, a Critic vetoes unsupported
          facts, and Neo4j stores what you actually decided.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(services).map(([name, ok]) => (
            <Badge key={name} variant={ok ? "default" : "secondary"}>
              {name}: {ok ? "connected" : "mock/fallback"}
            </Badge>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="size-4" />
                Input
              </CardTitle>
              <CardDescription>
                Upload audio via Plaud or use the built-in sample sync.
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
                <Button
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void loadMockTranscript()}
                >
                  <Upload className="size-4" />
                  Sample transcript
                </Button>
                <Button disabled={!transcript || loading} onClick={() => void runPipeline()}>
                  <Play className="size-4" />
                  Run pipeline
                </Button>
                <Button
                  variant="outline"
                  disabled={!transcript || loading}
                  onClick={() => void kickoffBand()}
                >
                  <Radio className="size-4" />
                  Kick off Band agents
                </Button>
              </div>
            </CardContent>
          </Card>

          <PipelineStatusCard status={status} />
          <TranscriptPanel transcript={transcript} />
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="graph">
            <TabsList>
              <TabsTrigger value="graph">
                <GitBranch className="size-4" />
                Graph
              </TabsTrigger>
              <TabsTrigger value="facts">Facts</TabsTrigger>
            </TabsList>
            <TabsContent value="graph" className="mt-4">
              <GraphView data={graph} />
            </TabsContent>
            <TabsContent value="facts" className="mt-4 space-y-2">
              {facts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Run the pipeline to see extracted and critiqued facts.
                </p>
              ) : (
                facts.map((fact) => (
                  <div
                    key={fact.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline">{fact.type}</Badge>
                      <Badge
                        variant={fact.approved ? "default" : "destructive"}
                      >
                        {fact.approved ? "APPROVED" : "BLOCKED"}
                      </Badge>
                    </div>
                    <p>{fact.text}</p>
                    {fact.reason && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {fact.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {bandRoomUrl && (
            <a
              href={bandRoomUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              <ExternalLink className="size-4" />
              Open Band room (live coordination)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
