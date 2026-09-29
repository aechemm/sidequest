import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { ingestConversation, runDiscovery } from "@/lib/pipeline";
import { pollPlaudTranscription } from "@/lib/plaud";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface StatusPageProps {
  searchParams: Promise<{ id?: string; title?: string; attempt?: string }>;
}

export async function generateMetadata({
  searchParams,
}: StatusPageProps): Promise<Metadata> {
  const { id, title, attempt } = await searchParams;
  const n = Number(attempt ?? "0");
  if (!id) return { title: "Transcribing…" };
  const nextUrl = `/conversations/upload/status?id=${encodeURIComponent(id)}&title=${encodeURIComponent(title ?? "")}&attempt=${n + 1}`;
  return {
    title: "Transcribing…",
    other: {
      refresh: `3;url=${nextUrl}`,
    },
  };
}

export default async function UploadStatusPage({ searchParams }: StatusPageProps) {
  const { id, title, attempt } = await searchParams;
  const n = Number(attempt ?? "0");

  if (!id) {
    redirect(
      "/conversations/upload?error=" + encodeURIComponent("Missing transcription id"),
    );
  }

  if (n > 40) {
    redirect(
      "/conversations/upload?error=" +
        encodeURIComponent(
          "Transcription is taking longer than expected — paste the transcript instead.",
        ),
    );
  }

  const result = await pollPlaudTranscription(id);

  if (result.status === "FAILED") {
    redirect(
      "/conversations/upload?error=" +
        encodeURIComponent("Transcription failed"),
    );
  }

  if (result.status === "SUCCESS" && result.transcript) {
    const conversation = {
      ...result.transcript,
      title: title ? decodeURIComponent(title) : result.transcript.title,
      processingStatus: "complete" as const,
    };
    await ingestConversation(conversation);
    const discovery = await runDiscovery([conversation]);
    const top = discovery.sideQuests[0]?.title ?? "none";
    redirect(
      `/conversations/done?title=${encodeURIComponent(conversation.title)}&quests=${discovery.sideQuests.length}&top=${encodeURIComponent(top)}`,
    );
  }

  const nextUrl = `/conversations/upload/status?id=${encodeURIComponent(id)}&title=${encodeURIComponent(title ?? "")}&attempt=${n + 1}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/conversations" />
      <div className="mx-auto max-w-md space-y-3 py-12 text-center">
        <h2 className="text-xl font-bold">Transcribing your recording…</h2>
        <p className="text-sm text-muted-foreground">
          This usually takes under a minute. The page refreshes automatically.
        </p>
        <a href={nextUrl} className="text-sm text-amber-500 underline">
          Refresh now
        </a>
      </div>
    </div>
  );
}
