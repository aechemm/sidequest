import { finishPlaudLoginAction } from "@/app/actions/finish-plaud-login";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { getAppState } from "@/lib/demo-state";
import { plaudAuthStatus } from "@/lib/plaud-cli";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ error?: string; ok?: string }>;
}

export default async function FinishPlaudLoginPage({ searchParams }: PageProps) {
  const state = await getAppState();
  const { error, ok } = await searchParams;
  const auth = await plaudAuthStatus();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/plaud" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Finish Plaud login</h2>
        <p className="text-sm text-muted-foreground">
          Use this if Authorize redirected to{" "}
          <code className="font-mono">localhost:8199</code> and the browser said
          connection refused.
        </p>
      </div>

      {ok === "1" || auth.ok ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <p className="font-medium text-amber-500">Plaud CLI is signed in.</p>
          <p className="text-sm text-muted-foreground">{auth.message}</p>
          <Link
            href="/plaud"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
          >
            Go sync Plaud recordings
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
              {decodeURIComponent(error)}
            </p>
          )}

          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              In Desktop Terminal keep this running:{" "}
              <code className="font-mono text-foreground">npm run plaud:login</code>
            </li>
            <li>Open the printed authorize URL and click Authorize.</li>
            <li>
              When you see “localhost refused to connect”, copy the{" "}
              <strong className="text-foreground">entire</strong> address bar URL
              (starts with <code className="font-mono">http://localhost:8199/auth/callback?code=...</code>).
            </li>
            <li>Paste it below and submit.</li>
          </ol>

          <form action={finishPlaudLoginAction} className="space-y-3 rounded-xl border p-4">
            <label htmlFor="callbackUrl" className="block text-sm font-medium">
              Callback URL
            </label>
            <textarea
              id="callbackUrl"
              name="callbackUrl"
              required
              rows={4}
              placeholder="http://localhost:8199/auth/callback?code=...&state=..."
              className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
            >
              Complete login
            </button>
          </form>
        </>
      )}
    </div>
  );
}
