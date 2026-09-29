"use server";

import { savePersonAliases, type PersonAliasMap } from "@/lib/person-aliases";
import { redirect } from "next/navigation";

export async function savePersonAliasesAction(formData: FormData) {
  const originals = formData.getAll("original").map(String);
  const aliases: PersonAliasMap = {};

  for (const original of originals) {
    const name = String(formData.get(`name__${original}`) ?? "").trim();
    const company = String(formData.get(`company__${original}`) ?? "").trim();
    if (!name && !company) continue;
    aliases[original] = {
      name: name || original,
      ...(company ? { company } : {}),
    };
  }

  await savePersonAliases(aliases);
  redirect("/people?saved=1");
}
