import { describe, expect, it } from "vitest";
import {
  createDocumentSchema,
  loginSchema,
  shareSchema,
  updateDocumentSchema,
} from "@/lib/validation";

describe("loginSchema", () => {
  it("accepts a normal credential pair", () => {
    expect(loginSchema.safeParse({ email: "ada@ajaia.dev", password: "demo1234" }).success).toBe(
      true,
    );
  });

  it("rejects malformed emails and empty passwords", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "ada@ajaia.dev", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ password: "x" }).success).toBe(false);
  });
});

describe("document schemas", () => {
  it("defaults a new document to an optional title", () => {
    expect(createDocumentSchema.safeParse({}).success).toBe(true);
    expect(createDocumentSchema.safeParse({ title: "Plan" }).success).toBe(true);
  });

  it("rejects blank or oversized titles", () => {
    expect(createDocumentSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createDocumentSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
    expect(createDocumentSchema.safeParse({ title: "x".repeat(120) }).success).toBe(true);
  });

  it("requires at least one field on update", () => {
    expect(updateDocumentSchema.safeParse({}).success).toBe(false);
    expect(updateDocumentSchema.safeParse({ title: "New name" }).success).toBe(true);
    expect(updateDocumentSchema.safeParse({ content: "<p>Hello</p>" }).success).toBe(true);
  });

  it("rejects content beyond the storage ceiling", () => {
    expect(updateDocumentSchema.safeParse({ content: "x".repeat(500_001) }).success).toBe(false);
  });
});

describe("shareSchema", () => {
  it("accepts viewer and editor roles", () => {
    expect(shareSchema.safeParse({ email: "grace@ajaia.dev", role: "viewer" }).success).toBe(true);
    expect(shareSchema.safeParse({ email: "grace@ajaia.dev", role: "editor" }).success).toBe(true);
  });

  it("rejects unsupported roles and bad emails", () => {
    expect(shareSchema.safeParse({ email: "grace@ajaia.dev", role: "owner" }).success).toBe(false);
    expect(shareSchema.safeParse({ email: "grace@ajaia.dev", role: "admin" }).success).toBe(false);
    expect(shareSchema.safeParse({ email: "nope", role: "viewer" }).success).toBe(false);
  });
});
