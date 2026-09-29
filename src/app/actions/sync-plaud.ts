"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { syncPlaudAccount } from "@/lib/plaud-sync";
import { redirect } from "next/navigation";

export async function runSyncPlaudAction() {
  const result = await syncPlaudAccount();

  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "last-sync.json"),
    JSON.stringify(result, null, 2),
    "utf-8",
  );

  redirect(
    `/plaud/sync?ok=${result.ok ? "1" : "0"}&processed=${result.processed.length}&quests=${result.sideQuests.length}&auth=${result.authenticated ? "1" : "0"}&from=file`,
  );
}
