import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { SideQuestCard } from "@/components/sidequest-card";
import { getAppState } from "@/lib/demo-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SideQuestsPage() {
  const state = await getAppState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/sidequests" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Approved SideQuests</h2>
        <p className="text-sm text-muted-foreground">
          Critic-approved introductions. Click Why? for the graph path, or expand
          Draft Introduction for the email.
        </p>
      </div>

      {state.sideQuests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No SideQuests yet —{" "}
          <Link href="/conversations/add" className="text-amber-500 underline">
            add conversations
          </Link>
          .
        </p>
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
