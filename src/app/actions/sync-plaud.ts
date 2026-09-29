"use server";

import { syncPlaudAccount } from "@/lib/plaud-sync";
import { redirect } from "next/navigation";

export async function runSyncPlaudAction() {
  const result = await syncPlaudAccount();
  const payload = Buffer.from(JSON.stringify(result), "utf-8").toString(
    "base64url",
  );
  // Keep URL reasonable — if huge, store briefly... for hackathon base64 is ok for small results
  if (payload.length > 7000) {
    redirect(
      `/plaud/sync?ok=${result.ok ? "1" : "0"}&processed=${result.processed.length}&quests=${result.sideQuests.length}&error=${encodeURIComponent(result.error ?? "")}&auth=${result.authenticated ? "1" : "0"}`,
    );
  }
  redirect(`/plaud/sync?data=${payload}`);
}
