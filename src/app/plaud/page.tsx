import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppState } from "@/lib/demo-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlaudPage() {
  const state = await getAppState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <AppHeader services={state.services} />
      <AppNav active="/plaud" />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Pair your Plaud demo device</h2>
        <p className="text-sm text-muted-foreground">
          Important: a Plaud device does <strong className="text-foreground">not</strong>{" "}
          auto-push recordings into a web app via API keys alone. Pairing goes through a
          phone app first.
        </p>
      </div>

      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle className="text-base">What the developer kit actually is</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Client ID + API Key</strong> = Transcription
            API only (upload audio → get transcript). SideQuest already has these wired.
          </p>
          <p>
            <strong className="text-foreground">Device pairing</strong> requires Plaud&apos;s{" "}
            <strong className="text-foreground">Embedded SDK</strong> inside a{" "}
            <strong className="text-foreground">mobile app</strong> (iOS/Android) that binds
            the device over Bluetooth, syncs files, then uploads them.
          </p>
          <p>
            There is no cloud endpoint that says &quot;give me everything on this physical
            NotePin.&quot; Audio lives on the device until a phone syncs it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Path A — Plaud App (use this for Hack Day tonight)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Install the official <strong className="text-foreground">Plaud App</strong> on your phone.</li>
            <li>Pair the demo device in the Plaud App (Bluetooth).</li>
            <li>Record booth / hallway conversations on the device.</li>
            <li>Sync recordings to the phone in the Plaud App.</li>
            <li>
              Copy the transcript →{" "}
              <Link href="/conversations/add" className="text-amber-500 underline">
                paste into SideQuest
              </Link>
              , or export audio →{" "}
              <Link href="/conversations/upload" className="text-amber-500 underline">
                upload here
              </Link>
              .
            </li>
          </ol>
          <p className="pt-2 text-amber-500">
            This is the supported hackathon path. Judges still see Plaud as the sensor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Path B — Bind device to SideQuest (Embedded SDK)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>True &quot;pair to my project&quot; requires:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create an Embedded app in the{" "}
              <a
                href="https://platform-us.plaud.ai"
                target="_blank"
                rel="noreferrer"
                className="text-amber-500 underline"
              >
                Plaud Developer Portal
              </a>{" "}
              (Client ID + Client Secret).
            </li>
            <li>
              Build / run Plaud&apos;s{" "}
              <a
                href="https://github.com/Plaud-AI/plaud-template-app"
                target="_blank"
                rel="noreferrer"
                className="text-amber-500 underline"
              >
                iOS starter app
              </a>{" "}
              with your credentials.
            </li>
            <li>
              Bind the demo device in that app (device can only be bound to{" "}
              <em>one</em> app at a time — unbind from Plaud App first).
            </li>
            <li>Sync audio over BLE → upload → Transcription API → SideQuest ingest.</li>
          </ol>
          <p className="pt-2">
            That is a separate mobile project. We cannot finish a full BLE binder inside this
            Next.js web app tonight — browsers cannot talk to Plaud devices over Bluetooth
            the way the Embedded SDK does.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Path C — Pull from your Plaud account (CLI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            If recordings are already synced into your Plaud App account, pull them from a
            laptop:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-xs">
{`npm install -g @plaud-ai/cli
plaud login
plaud recent
plaud transcript <id>`}
          </pre>
          <p>
            Then paste into{" "}
            <Link href="/conversations/add" className="text-amber-500 underline">
              Add conversation
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/conversations/add"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Paste transcript now
        </Link>
        <Link
          href="/conversations/upload"
          className="inline-flex h-9 items-center rounded-lg border px-4 text-sm hover:bg-muted"
        >
          Upload audio file
        </Link>
      </div>
    </div>
  );
}
