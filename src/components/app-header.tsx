import Link from "next/link";

interface AppHeaderProps {
  services: Record<string, boolean>;
}

export function AppHeader({ services }: AppHeaderProps) {
  return (
    <header className="space-y-3 border-b border-border pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
        SideQuest
      </p>
      <h1 className="text-3xl font-bold tracking-tight">
        Your conversations know who should meet.
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(services).map(([name, ok]) => (
          <span
            key={name}
            className={
              ok
                ? "rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground"
                : "rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            }
          >
            {name}: {ok ? "live" : "mock"}
          </span>
        ))}
        <Link
          href="/"
          className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-sm hover:bg-muted"
        >
          Reload demo
        </Link>
        <Link
          href="/conversations/add"
          className="inline-flex h-7 items-center rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 text-sm text-amber-500 hover:bg-amber-500/20"
        >
          Add conversation
        </Link>
        <Link
          href="/plaud"
          className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-sm text-primary-foreground hover:bg-primary/80"
        >
          Sync Plaud
        </Link>
      </div>
    </header>
  );
}
