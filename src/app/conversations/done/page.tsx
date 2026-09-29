import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface DonePageProps {
  searchParams: Promise<{ title?: string; quests?: string; top?: string }>;
}

export default async function ConversationDonePage({
  searchParams,
}: DonePageProps) {
  const { title, quests, top } = await searchParams;
  const questCount = Number(quests ?? "0");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/conversations" />

      <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
        <h2 className="text-2xl font-bold">Conversation added</h2>
        {title && (
          <p className="text-muted-foreground">
            Processed:{" "}
            <span className="text-foreground">{decodeURIComponent(title)}</span>
          </p>
        )}
        {questCount > 0 ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="font-medium text-amber-500">Introduction found</p>
            <p className="mt-1">
              {top ? decodeURIComponent(top) : `${questCount} connection(s)`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No introductions yet — add a few more conversations so SideQuest can
            connect the dots.
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/conversations/add"
            className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
          >
            Add another
          </Link>
          <Link
            href="/sidequests"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
          >
            View SideQuests
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
