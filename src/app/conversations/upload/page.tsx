import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface UploadPageProps {
  searchParams: Promise<{ error?: string; status?: string }>;
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const { error, status } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/conversations" />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Upload audio</h2>
          <p className="text-sm text-muted-foreground">
            Upload a recording and SideQuest will transcribe it, then look for
            people, problems, and offers.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {decodeURIComponent(error)}
          </p>
        )}
        {status === "processing" && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            Transcription in progress — this page will update automatically.
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
              placeholder="Conversation with Sam"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="file" className="mb-1 block text-sm font-medium">
              Audio file
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
            Upload &amp; process
          </button>
        </form>

        <p className="text-sm text-muted-foreground">
          Or{" "}
          <Link href="/conversations/add" className="text-amber-500 underline">
            paste a transcript
          </Link>{" "}
          /{" "}
          <Link href="/plaud" className="text-amber-500 underline">
            sync from Plaud
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
