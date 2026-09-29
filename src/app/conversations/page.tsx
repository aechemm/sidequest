import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { TranscriptPanel } from "@/components/transcript-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppState } from "@/lib/app-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const state = await getAppState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/conversations" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Conversations</h2>
          <p className="text-sm text-muted-foreground">
            Everything SideQuest has learned from your recent chats.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/plaud"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Sync from Plaud
          </Link>
          <Link
            href="/conversations/add"
            className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
          >
            Paste transcript
          </Link>
          <Link
            href="/conversations/upload"
            className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
          >
            Upload audio
          </Link>
        </div>
      </div>

      {state.conversations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No conversations yet. Sync from Plaud after you record, or paste a
            transcript to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.conversations.map((c) => (
            <div key={c.id} id={c.id}>
              <TranscriptPanel conversation={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
