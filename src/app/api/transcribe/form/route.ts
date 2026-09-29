import { submitPlaudTranscription, uploadAudioToPlaud } from "@/lib/plaud";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "Plaud conversation").trim();

    if (!(file instanceof File)) {
      redirect(
        "/conversations/upload?error=" + encodeURIComponent("No audio file"),
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadUrl = await uploadAudioToPlaud(buffer, file.name);
    const { transcriptionId } = await submitPlaudTranscription(downloadUrl);

    redirect(
      `/conversations/upload/status?id=${encodeURIComponent(transcriptionId)}&title=${encodeURIComponent(title || file.name)}`,
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Upload failed";
    redirect("/conversations/upload?error=" + encodeURIComponent(message));
  }
}
