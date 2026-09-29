"use server";

import { ingestConversation, runDiscovery } from "@/lib/pipeline";
import { parseManualTranscript } from "@/lib/parse-transcript";
import type { Conversation } from "@/lib/types";
import { redirect } from "next/navigation";

export async function ingestManualConversation(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const participant = String(formData.get("participant") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const transcript = String(formData.get("transcript") ?? "").trim();

  if (!title || !transcript) {
    redirect("/conversations/add?error=missing");
  }

  const conversation = parseManualTranscript(
    title,
    participant,
    company,
    transcript,
  );

  await ingestConversation(conversation);
  const result = await runDiscovery([conversation]);

  const quest = result.sideQuests[0]?.title ?? "none";
  redirect(
    `/conversations/done?title=${encodeURIComponent(title)}&quests=${result.sideQuests.length}&top=${encodeURIComponent(quest)}`,
  );
}

export async function ingestConversationData(conversation: Conversation) {
  await ingestConversation(conversation);
  return runDiscovery([conversation]);
}
