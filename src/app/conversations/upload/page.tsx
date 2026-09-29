import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { getAppState } from "@/lib/demo-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface UploadPageProps {
  searchParams: Promise<{ error?: string; status?: string }>;
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const state = await getAppState();
  const { error, status } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/conversations" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Upload Plaud audio</h2>
        <p className="text-sm text-muted-foreground">
          Export audio from the Plaud App, then upload here. SideQuest sends it through
          Plaud&apos;s transcription API, then runs entity extraction.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {decodeURIComponent(error)}
        </p>
      )}
      {status === "processing" && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          Transcription submitted — polling… refresh this page in ~30 seconds, or paste
          the transcript from the Plaud App if you already have it.
        </p>
      )}

      <form
        action="/api/transcribe/form"
        method="post"
        encType="multipart/form-data"
        className="space-y-4 rounded-xl border p-6"
      >
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            placeholder="Booth chat with Alice"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium">
            Audio file (.mp3, .wav, .m4a)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg"
            required
            className="w-full text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Upload &amp; transcribe
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        Prefer text?{" "}
        <Link href="/conversations/add" className="text-amber-500 underline">
          Paste a transcript instead
        </Link>
        .
      </p>
    </div>
  );
}
