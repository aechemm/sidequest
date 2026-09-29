import { savePersonAliasesAction } from "@/app/actions/save-person-aliases";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { getAppState } from "@/lib/app-state";
import {
  collectPeople,
  loadPersonAliases,
} from "@/lib/person-aliases";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PeoplePageProps {
  searchParams: Promise<{ saved?: string }>;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const { saved } = await searchParams;
  // Raw state (no display aliases) so we edit the original labels
  const state = await getAppState({ applyDisplayAliases: false });
  const aliases = await loadPersonAliases();
  const people = collectPeople(
    state.conversations,
    state.sideQuests,
    state.graph,
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/people" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">People</h2>
        <p className="text-sm text-muted-foreground">
          Rename speakers and add companies. Changes show up across conversations,
          introductions, and the graph.
        </p>
      </div>

      {saved === "1" && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-500">
          Names saved.{" "}
          <Link href="/" className="underline">
            Back to dashboard
          </Link>
        </p>
      )}

      {people.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No people yet — sync conversations first.
        </p>
      ) : (
        <form action={savePersonAliasesAction} className="space-y-4">
          {people.map((original) => {
            const alias = aliases[original];
            return (
              <div
                key={original}
                className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_1fr]"
              >
                <input type="hidden" name="original" value={original} />
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Current label
                  </p>
                  <p className="text-sm font-medium">{original}</p>
                </div>
                <div>
                  <label
                    htmlFor={`name__${original}`}
                    className="mb-1 block text-xs font-medium uppercase text-muted-foreground"
                  >
                    Display name
                  </label>
                  <input
                    id={`name__${original}`}
                    name={`name__${original}`}
                    defaultValue={alias?.name ?? ""}
                    placeholder={original}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`company__${original}`}
                    className="mb-1 block text-xs font-medium uppercase text-muted-foreground"
                  >
                    Company
                  </label>
                  <input
                    id={`company__${original}`}
                    name={`company__${original}`}
                    defaultValue={alias?.company ?? ""}
                    placeholder="Optional"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            );
          })}

          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Save names
          </button>
        </form>
      )}
    </div>
  );
}
