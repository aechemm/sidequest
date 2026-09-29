import { runSyncPlaudAction } from "@/app/actions/sync-plaud";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppState } from "@/lib/demo-state";
import { plaudAuthStatus } from "@/lib/plaud-cli";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlaudPage() {
  const state = await getAppState();
  const auth = await plaudAuthStatus();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/plaud" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Plaud device → SideQuest</h2>
        <p className="text-sm text-muted-foreground">
          Primary path: record on the device → sync in Plaud App → hit{" "}
          <strong className="text-foreground">Sync Plaud</strong> → SideQuest
          pulls the transcript automatically (via Plaud CLI).
        </p>
      </div>

      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle className="text-base">Sync Plaud (primary demo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p
            className={
              auth.ok ? "text-amber-500" : "text-red-400"
            }
          >
            {auth.ok
              ? "Plaud CLI: signed in"
              : "Plaud CLI: not signed in — run login first (below)"}
          </p>

          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Pair demo device in the official Plaud App (same account as CLI).</li>
            <li>Record a short conversation → stop → wait for sync/transcript.</li>
            <li>Press <strong className="text-foreground">Sync Plaud</strong>.</li>
            <li>SideQuest detects new IDs, pulls transcripts, runs the pipeline.</li>
          </ol>

          <form action={runSyncPlaudAction}>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Sync Plaud
            </button>
          </form>

          {!auth.ok && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
              <p className="font-medium text-red-400">One-time setup required</p>
              <p className="mt-1 text-muted-foreground">
                In the Cursor cloud agent <strong>Desktop</strong> terminal:
              </p>
              <div className="rounded-lg bg-background/60 p-3 text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Important:</strong> Authorizing Plaud in
                  ChatGPT / Cursor MCP settings is <em>not</em> the same as logging the CLI into
                  this cloud machine. SideQuest Sync needs CLI login here.
                </p>
                <p className="font-medium text-foreground">Do this in Cursor Desktop → Terminal:</p>
                <pre className="overflow-x-auto rounded bg-black/40 p-2 font-mono text-xs text-foreground">
{`cd /workspace
npm run plaud:login`}
                </pre>
                <p>
                  When the browser opens, finish Google/Plaud login. If you see a 404, you used
                  the wrong command earlier — use <code className="font-mono">npm run plaud:login</code>{" "}
                  only.
                </p>
                <p>
                  Then run <code className="font-mono">npm run plaud:me</code>. If it shows your
                  name, come back here and press <strong className="text-foreground">Sync Plaud</strong>.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What we fixed about the earlier advice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Cursor was right that browsers can&apos;t Bluetooth-pair the device.
            ChatGPT is right that you <strong className="text-foreground">don&apos;t</strong>{" "}
            need a custom mobile app for account-level ingest.
          </p>
          <p>
            Flow: <strong className="text-foreground">Device → Plaud App → your Plaud account → CLI/MCP → SideQuest</strong>.
          </p>
          <p>
            Manual paste / audio upload remains as fallback only.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fallbacks</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/conversations/add"
            className="inline-flex h-9 items-center rounded-lg border px-4 hover:bg-muted"
          >
            Paste transcript
          </Link>
          <Link
            href="/conversations/upload"
            className="inline-flex h-9 items-center rounded-lg border px-4 hover:bg-muted"
          >
            Upload audio (Transcription API)
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
