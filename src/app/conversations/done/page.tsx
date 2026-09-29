import Link from "next/link";

interface DonePageProps {
  searchParams: Promise<{ title?: string; quests?: string; top?: string }>;
}

export default async function ConversationDonePage({
  searchParams,
}: DonePageProps) {
  const { title, quests, top } = await searchParams;
  const questCount = Number(quests ?? "0");

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Conversation processed</h1>
      {title && (
        <p className="text-muted-foreground">
          Ingested: <span className="text-foreground">{decodeURIComponent(title)}</span>
        </p>
      )}
      {questCount > 0 ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="font-medium text-amber-500">SideQuest discovered</p>
          <p className="mt-1">{top ? decodeURIComponent(top) : `${questCount} connection(s)`}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No cross-conversation connections yet — add more conversations from
          different chats at the event.
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
          href="/"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
