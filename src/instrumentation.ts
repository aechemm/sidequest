export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { startPlaudAutoSync } = await import("@/lib/plaud-auto-sync");
  startPlaudAutoSync();
}
