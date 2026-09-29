import { runSyncPlaudAction } from "@/app/actions/sync-plaud";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAutoSyncStatus,
  startPlaudAutoSync,
} from "@/lib/plaud-auto-sync";
import { plaudAuthStatus } from "@/lib/plaud-cli";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlaudPage() {
  const auth = await plaudAuthStatus();
  startPlaudAutoSync();
  const autoSync = getAutoSyncStatus();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader />
      <AppNav active="/plaud" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Plaud</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Record with your Plaud device, sync to your Plaud account, then bring
          those conversations into SideQuest.
        </p>
      </div>

      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle className="text-base">Sync conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className={auth.ok ? "text-amber-500" : "text-muted-foreground"}>
            {auth.ok
              ? "Connected to your Plaud account"
              : "Plaud account not connected yet"}
          </p>

          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Record a conversation on your Plaud device.</li>
            <li>Wait until it appears with a transcript in the Plaud app.</li>
            <li>
              Tap <strong className="text-foreground">Sync from Plaud</strong>{" "}
              below — or wait for the automatic check.
            </li>
          </ol>

          <form action={runSyncPlaudAction}>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Sync from Plaud
            </button>
          </form>

          <p className="text-xs text-muted-foreground">
            SideQuest also checks for new recordings about every{" "}
            {autoSync.intervalMinutes} minutes
            {autoSync.lastRunAt
              ? ` · last checked ${new Date(autoSync.lastRunAt).toLocaleString()}`
              : ""}
            .
          </p>

          {!auth.ok && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-muted-foreground">
              <p className="font-medium text-foreground">Connect your account</p>
              <p className="mt-1">
                Finish Plaud sign-in once, then sync will work automatically.
              </p>
              <Link
                href="/plaud/finish-login"
                className="mt-2 inline-flex text-amber-500 underline"
              >
                Complete Plaud sign-in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Other ways to add conversations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/conversations/add"
            className="inline-flex h-9 items-center rounded-lg border px-4 hover:bg-muted"
          >
            Paste a transcript
          </Link>
          <Link
            href="/conversations/upload"
            className="inline-flex h-9 items-center rounded-lg border px-4 hover:bg-muted"
          >
            Upload audio
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
