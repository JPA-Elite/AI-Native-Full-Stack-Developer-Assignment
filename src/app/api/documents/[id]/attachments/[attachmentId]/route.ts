import { NextResponse } from "next/server";
import { jsonError, loadDocument } from "@/lib/api";
import { getReadyDb } from "@/lib/db";
import { deleteAttachment } from "@/lib/repo";

type Context = { params: Promise<{ id: string; attachmentId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { id, attachmentId } = await params;
    await loadDocument(id, "edit");
    const db = await getReadyDb();
    await deleteAttachment(db, attachmentId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
