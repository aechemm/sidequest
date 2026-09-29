"use server";

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { redirect } from "next/navigation";

const PENDING_PATH = "/tmp/plaud-oauth-pending.json";

interface PendingOAuth {
  clientId: string;
  redirectUri: string;
  tokenUrl: string;
  codeVerifier: string;
  state: string;
}

export async function finishPlaudLoginAction(formData: FormData) {
  const raw = String(formData.get("callbackUrl") ?? "").trim();
  if (!raw) {
    redirect("/plaud/finish-login?error=" + encodeURIComponent("Paste the callback URL"));
  }

  let callback: URL;
  try {
    callback = new URL(raw);
  } catch {
    redirect(
      "/plaud/finish-login?error=" +
        encodeURIComponent("That doesn’t look like a valid URL"),
    );
  }

  const code = callback.searchParams.get("code");
  const returnedState = callback.searchParams.get("state");
  if (!code || !returnedState) {
    redirect(
      "/plaud/finish-login?error=" +
        encodeURIComponent("URL must include code and state (from localhost:8199/auth/callback?...)"),
    );
  }

  let pending: PendingOAuth;
  try {
    pending = JSON.parse(await readFile(PENDING_PATH, "utf-8")) as PendingOAuth;
  } catch {
    redirect(
      "/plaud/finish-login?error=" +
        encodeURIComponent(
          "No active login session. In Desktop terminal run: npm run plaud:login",
        ),
    );
  }

  if (returnedState !== pending.state) {
    redirect(
      "/plaud/finish-login?error=" +
        encodeURIComponent(
          "Login session expired/mismatch. Run npm run plaud:login again, then authorize once.",
        ),
    );
  }

  const basicAuth = Buffer.from(`${pending.clientId}:`).toString("base64");
  const res = await fetch(pending.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: pending.redirectUri,
      code_verifier: pending.codeVerifier,
      state: returnedState,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    redirect(
      "/plaud/finish-login?error=" +
        encodeURIComponent(`Token exchange failed (${res.status}): ${detail}`),
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
  };

  const dir = path.join(homedir(), ".plaud");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(dir, "tokens.json"),
    JSON.stringify(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type ?? "Bearer",
        expires_at: data.expires_in
          ? Date.now() + data.expires_in * 1000
          : undefined,
      },
      null,
      2,
    ),
    { encoding: "utf-8", mode: 0o600 },
  );

  redirect("/plaud/finish-login?ok=1");
}
