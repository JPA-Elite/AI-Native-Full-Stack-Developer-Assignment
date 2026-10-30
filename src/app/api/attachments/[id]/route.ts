import { jsonError, loadDocument } from "@/lib/api";
import { getReadyDb } from "@/lib/db";
import { getAttachmentFile } from "@/lib/repo";

type Context = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const db = await getReadyDb();
    const attachment = await getAttachmentFile(db, id);

    if (!attachment) {
      return Response.json(
        { error: { code: "not_found", message: "Attachment not found." } },
        { status: 404 },
      );
    }

    // Authorization is derived from the parent document, not the attachment id.
    await loadDocument(attachment.documentId, "view");

    const asciiName = attachment.filename.replace(/[^\x20-\x7E]/g, "_");
    const body = new Uint8Array(attachment.data);

    return new Response(body as unknown as BodyInit, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
