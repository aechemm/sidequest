import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { SideQuestCard } from "@/components/sidequest-card";
import { getAppState } from "@/lib/app-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SideQuestsPage() {
  const state = await getAppState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/sidequests" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">SideQuests</h2>
        <p className="text-sm text-muted-foreground">
          Suggested introductions, verified against what was actually said.
        </p>
      </div>

      {state.sideQuests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No introductions yet. Sync a few conversations from different chats,
          then check back.{" "}
          <Link href="/plaud" className="text-amber-500 underline">
            Sync from Plaud
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {state.sideQuests.map((sq) => (
            <SideQuestCard key={sq.id} sideQuest={sq} />
          ))}
        </div>
      )}
    </div>
  );
}
