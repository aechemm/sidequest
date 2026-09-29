#!/usr/bin/env node
/**
 * Reliable Plaud CLI OAuth for Cursor Desktop / cloud VMs.
 *
 * - Uses the official CLI OAuth client (not Embedded PLAUD_CLIENT_ID)
 * - Listens on localhost:8199 BEFORE you authorize
 * - If the browser shows connection refused, paste the full callback URL
 *   into: http://127.0.0.1:4318/plaud/finish-login
 */
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

delete process.env.PLAUD_CLIENT_ID;
delete process.env.PLAUD_API_KEY;
delete process.env.PLAUD_CLIENT_SECRET;

const CLIENT_ID =
  process.env.PLAUD_CLI_CLIENT_ID ||
  "client_f9e0b214-c11f-434b-8b95-c4497d1feb81";
const CLIENT_SECRET = process.env.PLAUD_CLI_CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:8199/auth/callback";
const AUTH_URL = "https://web.plaud.ai/platform/oauth";
const TOKEN_URL =
  "https://platform.plaud.ai/developer/api/oauth/third-party/access-token";
const PENDING_PATH = "/tmp/plaud-oauth-pending.json";
const PORT = 8199;

const codeVerifier = randomBytes(32).toString("base64url");
const codeChallenge = createHash("sha256")
  .update(codeVerifier)
  .digest("base64url");
const state = randomBytes(16).toString("base64url");

const authUrl = `${AUTH_URL}?${new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  code_challenge: codeChallenge,
  code_challenge_method: "S256",
  state,
}).toString()}`;

await writeFile(
  PENDING_PATH,
  JSON.stringify(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      tokenUrl: TOKEN_URL,
      codeVerifier,
      state,
      authUrl,
      createdAt: new Date().toISOString(),
    },
    null,
    2,
  ),
  "utf-8",
);

async function exchangeCode(code, returnedState) {
  if (returnedState !== state) {
    throw new Error("OAuth state mismatch — restart login");
  }
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64",
  );
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
      state: returnedState,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const tokenSet = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type ?? "Bearer",
    expires_at: data.expires_in
      ? Date.now() + data.expires_in * 1000
      : undefined,
  };
  const dir = path.join(homedir(), ".plaud");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const tokenPath = path.join(dir, "tokens.json");
  await writeFile(tokenPath, JSON.stringify(tokenSet, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
  return tokenSet;
}

function html(ok, message) {
  return `<!doctype html><html><body style="font-family:sans-serif;padding:2rem;background:#111;color:#eee">
  <h1>${ok ? "✅ Plaud login success" : "❌ Plaud login failed"}</h1>
  <p>${message}</p>
  <p>You can close this tab and return to SideQuest → Sync Plaud.</p>
  </body></html>`;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    if (url.pathname !== "/auth/callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    if (!code || !returnedState) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(html(false, "Missing code/state in callback URL"));
      return;
    }
    await exchangeCode(code, returnedState);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      html(
        true,
        "Tokens saved. Run <code>npm run plaud:me</code> in the terminal, then Sync Plaud.",
      ),
    );
    console.log("\n✅ Login complete. Tokens saved to ~/.plaud/tokens.json");
    console.log("Next: npm run plaud:me");
    setTimeout(() => process.exit(0), 500);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\n❌", message);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(html(false, message));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("============================================================");
  console.log("Plaud OAuth listener is READY on http://localhost:8199");
  console.log("============================================================");
  console.log("");
  console.log("1) Keep this terminal running (do not Ctrl+C yet)");
  console.log("2) In Cursor Desktop browser, open this URL:");
  console.log("");
  console.log(authUrl);
  console.log("");
  console.log("3) Click Authorize");
  console.log("");
  console.log("If the browser says 'localhost refused to connect':");
  console.log("  - Copy the FULL address bar URL (includes ?code=...)");
  console.log("  - Open this page (public tunnel — use this one):");
  console.log(
    "    https://stockholm-blocked-jumping-kit.trycloudflare.com/plaud/finish-login",
  );
  console.log("  - Paste the URL and submit");
  console.log("============================================================");
  console.log("");
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error("");
    console.error("Port 8199 is busy. Run this once, then retry:");
    console.error("  fuser -k 8199/tcp");
    console.error("  npm run plaud:login");
    console.error("");
    process.exit(1);
  }
  throw err;
});
