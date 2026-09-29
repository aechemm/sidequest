#!/usr/bin/env node
/**
 * Print the Plaud CLI OAuth URL with the CORRECT CLI client id,
 * then run `plaud login` so localhost:8199 can receive the callback.
 *
 * Usage: node scripts/plaud-login-print-url.mjs
 */
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

// Do not let Embedded Transcription keys hijack CLI OAuth.
delete process.env.PLAUD_CLIENT_ID;
delete process.env.PLAUD_API_KEY;
delete process.env.PLAUD_CLIENT_SECRET;

const CLIENT_ID =
  process.env.PLAUD_CLI_CLIENT_ID ||
  "client_f9e0b214-c11f-434b-8b95-c4497d1feb81";
process.env.PLAUD_CLI_CLIENT_ID = CLIENT_ID;

const verifier = randomBytes(32).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");
const state = randomBytes(16).toString("base64url");
const params = new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: "http://localhost:8199/auth/callback",
  response_type: "code",
  code_challenge: challenge,
  code_challenge_method: "S256",
  state,
});

const url = `https://web.plaud.ai/platform/oauth?${params.toString()}`;

console.log("");
console.log("============================================================");
console.log("STEP 1: Keep this terminal running.");
console.log("STEP 2: In the SAME Cursor Desktop, open this URL:");
console.log("");
console.log(url);
console.log("");
console.log("STEP 3: Sign in with the Plaud account tied to your device.");
console.log("============================================================");
console.log("");
console.log("(Note: the URL above is illustrative. The real login below");
console.log(" opens/prints its own URL — use THAT one if shown.)");
console.log("");
console.log("Starting official plaud login now...");
console.log("");

const child = spawn("npx", ["plaud", "login"], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 1));
