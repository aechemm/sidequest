import { getCrusoeClient } from "@/lib/crusoe";
import { verifyNeo4jConnection } from "@/lib/neo4j";
import { isPlaudConfigured } from "@/lib/plaud";

export async function GET() {
  const neo4jOk = await verifyNeo4jConnection();
  return Response.json({
    ok: true,
    bandRoomUrl: process.env.BAND_ROOM_URL ?? null,
    services: {
      crusoe: Boolean(getCrusoeClient()),
      neo4j: neo4jOk,
      plaud: isPlaudConfigured(),
      band: Boolean(process.env.BAND_CHAT_ID || process.env.BAND_EXTRACTOR_ID),
    },
  });
}
