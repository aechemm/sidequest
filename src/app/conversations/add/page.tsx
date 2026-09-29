import { ingestManualConversation } from "@/app/actions/ingest-conversation";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { getAppState } from "@/lib/demo-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AddPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AddConversationPage({ searchParams }: AddPageProps) {
  const state = await getAppState();
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/conversations" />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Add a real conversation</h2>
          <p className="text-sm text-muted-foreground">
            Paste a transcript from the Plaud App. Works without JavaScript.
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
              placeholder={
                "Alice: We built an inference platform...\nBob: Our hospital can't send patient data off-prem..."
              }
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

        <p className="text-sm text-muted-foreground">
          Have audio instead?{" "}
          <Link href="/conversations/upload" className="text-amber-500 underline">
            Upload a file
          </Link>
          . Device pairing help:{" "}
          <Link href="/plaud" className="text-amber-500 underline">
            /plaud
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
