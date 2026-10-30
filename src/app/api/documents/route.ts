import { NextResponse } from "next/server";
import { apiUser, jsonError, parseJson } from "@/lib/api";
import { createDocument, listDocumentsForUser } from "@/lib/repo";
import { createDocumentSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await apiUser();
    const documents = await listDocumentsForUser(user.id);
    return NextResponse.json({ documents });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiUser();
    const { title } = await parseJson(request, createDocumentSchema);
    const id = await createDocument(user.id, { title: title ?? "Untitled document" });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
