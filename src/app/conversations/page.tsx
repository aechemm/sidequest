import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { TranscriptPanel } from "@/components/transcript-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppState } from "@/lib/demo-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const state = await getAppState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/conversations" />

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">Get conversations into SideQuest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Fastest:</strong>{" "}
            <Link href="/conversations/add" className="text-amber-500 underline">
              Paste a transcript
            </Link>{" "}
            from the Plaud App.
          </p>
          <p>
            <strong className="text-foreground">Audio:</strong> Export .mp3/.wav from
            Plaud App, then{" "}
            <Link href="/conversations/upload" className="text-amber-500 underline">
              upload audio
            </Link>
            .
          </p>
          <p>
            <strong className="text-foreground">Device pairing:</strong>{" "}
            <Link href="/plaud" className="text-amber-500 underline">
              How to connect your Plaud demo device
            </Link>
            .
          </p>
          {state.services.plaud ? (
            <p className="text-amber-500">Plaud transcription API: connected</p>
          ) : (
            <p>Plaud transcription API: not configured</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/conversations/add"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Paste transcript
        </Link>
        <Link
          href="/conversations/upload"
          className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
        >
          Upload audio
        </Link>
        <Link
          href="/plaud"
          className="inline-flex h-9 items-center rounded-lg border border-amber-500/50 px-4 text-sm text-amber-500 hover:bg-amber-500/10"
        >
          Pair Plaud device
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Loaded conversations</h2>
        {state.conversations.map((c) => (
          <div key={c.id} id={c.id}>
            <TranscriptPanel conversation={c} />
          </div>
        ))}
      </div>
    </div>
  );
}
