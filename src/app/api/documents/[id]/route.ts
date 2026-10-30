import { NextResponse } from "next/server";
import { jsonError, loadDocument, parseJson } from "@/lib/api";
import { sanitizeDocumentHtml } from "@/lib/content";
import { deleteDocument, getDocumentForUser, updateDocument } from "@/lib/repo";
import { updateDocumentSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { user } = await loadDocument(id, "view");
    const document = await getDocumentForUser(id, user.id);
    return NextResponse.json({ document });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { user } = await loadDocument(id, "edit");
    const input = await parseJson(request, updateDocumentSchema);

    const updatedAt = await updateDocument(id, user.id, {
      title: input.title,
      content: input.content === undefined ? undefined : sanitizeDocumentHtml(input.content),
    });

    return NextResponse.json({ id, updatedAt });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    await loadDocument(id, "manage");
    await deleteDocument(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
