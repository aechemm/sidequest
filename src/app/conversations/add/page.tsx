import { ingestManualConversation } from "@/app/actions/ingest-conversation";
import Link from "next/link";

interface AddPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AddConversationPage({ searchParams }: AddPageProps) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href="/" className="text-sm text-amber-500 hover:underline">
        ← Back to SideQuest
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Add a real conversation</h1>
        <p className="text-sm text-muted-foreground">
          Paste a transcript from Plaud or any recorder. Works without JavaScript.
        </p>
      </div>

      {error === "missing" && (
        <p className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          Title and transcript are required.
        </p>
      )}

      <form
        action={ingestManualConversation}
        className="space-y-4 rounded-xl border border-border p-6"
      >
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="Alice @ Crusoe booth"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="participant" className="mb-1 block text-sm font-medium">
              Participant
            </label>
            <input
              id="participant"
              name="participant"
              placeholder="Alice"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="company" className="mb-1 block text-sm font-medium">
              Company
            </label>
            <input
              id="company"
              name="company"
              placeholder="Crusoe"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="transcript" className="mb-1 block text-sm font-medium">
            Transcript
          </label>
          <textarea
            id="transcript"
            name="transcript"
            required
            rows={8}
            placeholder={"Alice: We built an inference platform...\nBob: Our hospital can't send patient data off-prem..."}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Process conversation
        </button>
      </form>

      <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium text-amber-500">Plaud audio upload</p>
        <p className="mt-1 text-muted-foreground">
          For audio files, use the{" "}
          <Link href="/" className="underline">
            Conversations tab
          </Link>{" "}
          on the main app (requires JavaScript). Export audio from the Plaud app,
          then upload the .mp3 or .wav file.
        </p>
      </div>
    </div>
  );
}
