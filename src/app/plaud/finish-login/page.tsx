import { finishPlaudLoginAction } from "@/app/actions/finish-plaud-login";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { plaudAuthStatus } from "@/lib/plaud-cli";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ error?: string; ok?: string }>;
}

export default async function FinishPlaudLoginPage({ searchParams }: PageProps) {
  const { error, ok } = await searchParams;
  const auth = await plaudAuthStatus();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/plaud" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Connect Plaud</h2>
        <p className="text-sm text-muted-foreground">
          After you authorize in Plaud, paste the redirect link here to finish
          connecting your account.
        </p>
      </div>

      {ok === "1" || auth.ok ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <p className="font-medium text-amber-500">Plaud is connected.</p>
          <Link
            href="/plaud"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
          >
            Sync conversations
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
              {decodeURIComponent(error)}
            </p>
          )}

          <form action={finishPlaudLoginAction} className="space-y-3 rounded-xl border p-4">
            <label htmlFor="callbackUrl" className="block text-sm font-medium">
              Sign-in link
            </label>
            <textarea
              id="callbackUrl"
              name="callbackUrl"
              required
              rows={4}
              placeholder="Paste the full redirect link from your browser"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
            >
              Connect
            </button>
          </form>
        </>
      )}
    </div>
  );
}
