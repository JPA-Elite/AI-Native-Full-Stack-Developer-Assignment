import { NextResponse } from "next/server";
import { ApiError, jsonError, loadDocument } from "@/lib/api";
import { getReadyDb } from "@/lib/db";
import { mimeTypeFor, isAttachable, safeFilename, formatAcceptList, ATTACHMENT_EXTENSIONS } from "@/lib/files";
import { createAttachment, listAttachments } from "@/lib/repo";
import { readUploadedFile } from "@/lib/uploads";

type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    await loadDocument(id, "view");
    const db = await getReadyDb();
    return NextResponse.json({ attachments: await listAttachments(db, id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { user } = await loadDocument(id, "edit");
    const file = await readUploadedFile(request);
    const filename = safeFilename(file.name);

    if (!isAttachable(filename)) {
      throw new ApiError(
        415,
        "unsupported_file_type",
        `Attachments support ${formatAcceptList(ATTACHMENT_EXTENSIONS)}.`,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const db = await getReadyDb();
    const attachmentId = await createAttachment(db, {
      documentId: id,
      filename,
      mimeType: mimeTypeFor(filename, file.type || "application/octet-stream"),
      size: bytes.byteLength,
      data: bytes,
      uploadedBy: user.id,
    });

    return NextResponse.json({ attachmentId }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
