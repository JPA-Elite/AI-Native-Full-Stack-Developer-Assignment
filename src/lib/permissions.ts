export type Access = "owner" | "editor" | "viewer" | null;
export type ShareRole = "editor" | "viewer";

const ROLES: ShareRole[] = ["editor", "viewer"];

export function isShareRole(value: unknown): value is ShareRole {
  return typeof value === "string" && ROLES.includes(value as ShareRole);
}

/**
 * Single source of truth for document access.
 * Owner wins over any share row; anything else is whatever the share says.
 */
export function resolveAccess(
  ownerId: string,
  userId: string,
  shareRole?: string | null,
): Access {
  if (!userId) return null;
  if (ownerId === userId) return "owner";
  if (shareRole === "editor" || shareRole === "viewer") return shareRole;
  return null;
}

export function canView(access: Access): boolean {
  return access !== null;
}

export function canEdit(access: Access): boolean {
  return access === "owner" || access === "editor";
}

export function canManageSharing(access: Access): boolean {
  return access === "owner";
}

export function canDelete(access: Access): boolean {
  return access === "owner";
}

export function accessLabel(access: Access): string {
  switch (access) {
    case "owner":
      return "Owner";
    case "editor":
      return "Can edit";
    case "viewer":
      return "Can view";
    default:
      return "No access";
  }
}
