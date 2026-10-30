import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { getCurrentUser } from "./auth";
import type { PublicUser } from "./repo";
import { canEdit, canManageSharing } from "./permissions";
import { getDocumentForUser, type DocumentDetail } from "./repo";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "unauthorized", "Your session has expired. Please sign in again.");
  }
  return user;
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(
      400,
      "invalid_request",
      "Some fields need attention.",
      z.flattenError(result.error).fieldErrors,
    );
  }
  return result.data;
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { error: { code: "internal_error", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}

export type DocumentCapability = "view" | "edit" | "manage";

/**
 * Loads a document with the caller's effective role. Documents the caller
 * cannot see are reported as 404 so ids do not leak across accounts.
 */
export async function loadDocument(
  documentId: string,
  capability: DocumentCapability,
): Promise<{ user: PublicUser; document: DocumentDetail }> {
  const user = await apiUser();
  const document = await getDocumentForUser(documentId, user.id);

  if (!document) {
    throw new ApiError(404, "not_found", "Document not found, or you no longer have access.");
  }

  if (capability === "edit" && !canEdit(document.access)) {
    throw new ApiError(403, "read_only", "You have view-only access to this document.");
  }

  if (capability === "manage" && !canManageSharing(document.access)) {
    throw new ApiError(403, "owner_only", "Only the document owner can manage sharing.");
  }

  return { user, document };
}
