import { NextResponse } from "next/server";
import { ApiError, jsonError, loadDocument, parseJson } from "@/lib/api";
import { getReadyDb } from "@/lib/db";
import {
  findUserByEmail,
  listCollaborators,
  removeCollaborator,
  upsertCollaborator,
} from "@/lib/repo";
import { shareSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    await loadDocument(id, "view");
    const db = await getReadyDb();
    const collaborators = await listCollaborators(db, id);
    return NextResponse.json({ collaborators });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { user, document } = await loadDocument(id, "manage");
    const input = await parseJson(request, shareSchema);

    if (input.email.toLowerCase() === user.email.toLowerCase()) {
      throw new ApiError(400, "cannot_share_with_self", "You already own this document.");
    }

    const db = await getReadyDb();
    const invitee = await findUserByEmail(db, input.email);

    if (!invitee) {
      throw new ApiError(
        404,
        "user_not_found",
        "No workspace member with that email. Try one of the demo accounts.",
      );
    }

    await upsertCollaborator(db, id, invitee.id, input.role);
    const collaborators = await listCollaborators(db, id);

    return NextResponse.json(
      {
        collaborator: collaborators.find((person) => person.id === invitee.id) ?? null,
        collaborators,
        documentId: document.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    await loadDocument(id, "manage");

    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      throw new ApiError(400, "missing_user", "Specify which collaborator to remove.");
    }

    const db = await getReadyDb();
    await removeCollaborator(db, id, userId);
    const collaborators = await listCollaborators(db, id);

    return NextResponse.json({ collaborators });
  } catch (error) {
    return jsonError(error);
  }
}
