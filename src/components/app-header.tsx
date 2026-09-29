import { runSyncPlaudAction } from "@/app/actions/sync-plaud";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="space-y-3 border-b border-border pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
        SideQuest
      </p>
      <h1 className="text-3xl font-bold tracking-tight">
        Your conversations know who should meet.
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Capture real conversations, build a living relationship graph, and
        surface introductions no single chat would reveal.
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <form action={runSyncPlaudAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Sync from Plaud
          </button>
        </form>
        <Link
          href="/conversations/add"
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm hover:bg-muted"
        >
          Add conversation
        </Link>
      </div>
    </header>
  );
}
