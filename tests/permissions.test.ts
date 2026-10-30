import { describe, expect, it } from "vitest";
import {
  canDelete,
  canEdit,
  canManageSharing,
  canView,
  isShareRole,
  resolveAccess,
} from "@/lib/permissions";

describe("resolveAccess", () => {
  it("gives the owner access even if a stale share row exists", () => {
    expect(resolveAccess("user_a", "user_a", "viewer")).toBe("owner");
    expect(resolveAccess("user_a", "user_a", null)).toBe("owner");
  });

  it("maps share roles to access levels", () => {
    expect(resolveAccess("owner", "editor", "editor")).toBe("editor");
    expect(resolveAccess("owner", "viewer", "viewer")).toBe("viewer");
  });

  it("denies users without a share row", () => {
    expect(resolveAccess("owner", "stranger", null)).toBeNull();
    expect(resolveAccess("owner", "stranger", undefined)).toBeNull();
  });

  it("ignores share rows with values outside the schema", () => {
    expect(resolveAccess("owner", "someone", "admin")).toBeNull();
    expect(resolveAccess("owner", "someone", "owner")).toBeNull();
  });

  it("denies anonymous callers", () => {
    expect(resolveAccess("owner", "", "editor")).toBeNull();
  });
});

describe("capability checks", () => {
  it("lets owners do everything", () => {
    expect(canView("owner")).toBe(true);
    expect(canEdit("owner")).toBe(true);
    expect(canManageSharing("owner")).toBe(true);
    expect(canDelete("owner")).toBe(true);
  });

  it("lets editors write but not manage access", () => {
    expect(canView("editor")).toBe(true);
    expect(canEdit("editor")).toBe(true);
    expect(canManageSharing("editor")).toBe(false);
    expect(canDelete("editor")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(canView("viewer")).toBe(true);
    expect(canEdit("viewer")).toBe(false);
    expect(canManageSharing("viewer")).toBe(false);
    expect(canDelete("viewer")).toBe(false);
  });

  it("grants nothing to users with no access", () => {
    expect(canView(null)).toBe(false);
    expect(canEdit(null)).toBe(false);
    expect(canManageSharing(null)).toBe(false);
    expect(canDelete(null)).toBe(false);
  });
});

describe("isShareRole", () => {
  it("accepts only the two supported roles", () => {
    expect(isShareRole("editor")).toBe(true);
    expect(isShareRole("viewer")).toBe(true);
    expect(isShareRole("owner")).toBe(false);
    expect(isShareRole("admin")).toBe(false);
    expect(isShareRole(null)).toBe(false);
  });
});
