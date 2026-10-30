import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Client } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { verifyPassword } from "@/lib/crypto";

let repo: typeof import("@/lib/repo");
let db: Client;
let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ajaia-test-"));
  process.env.DATABASE_URL = `file:${path.join(dir, "test.db")}`;

  const dbModule = await import("@/lib/db");
  repo = await import("@/lib/repo");
  db = await dbModule.getReadyDb();
});

afterAll(() => {
  db.close();
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // Windows can hold the sqlite file handle briefly after close.
  }
});

describe("seeded workspace", () => {
  it("seeds accounts with the documented demo password", async () => {
    const ada = await repo.findUserByEmail(db, "ada@ajaia.dev");
    expect(ada).not.toBeNull();
    expect(verifyPassword("demo1234", ada!.passwordHash)).toBe(true);
    expect(verifyPassword("wrong", ada!.passwordHash)).toBe(false);
  });

  it("treats email lookup as case-insensitive", async () => {
    const found = await repo.findUserByEmail(db, "  ADA@Ajaia.dev ");
    expect(found?.name).toBe("Ada Lovelace");
  });

  it("shows each person their owned and shared documents", async () => {
    const ada = await repo.listDocumentsForUser("usr_ada");
    const grace = await repo.listDocumentsForUser("usr_grace");
    const linus = await repo.listDocumentsForUser("usr_linus");

    expect(ada).toHaveLength(4);
    expect(grace).toHaveLength(3);
    expect(linus).toHaveLength(2);

    expect(ada.filter((doc) => doc.access === "owner")).toHaveLength(2);
    expect(ada.find((doc) => doc.id === "doc_retro")?.access).toBe("editor");
    expect(ada.find((doc) => doc.id === "doc_research")?.access).toBe("viewer");

    expect(grace.find((doc) => doc.id === "doc_research")?.access).toBe("owner");
    expect(grace.find((doc) => doc.id === "doc_welcome")?.access).toBe("editor");
    expect(linus.find((doc) => doc.id === "doc_welcome")?.access).toBe("viewer");
  });

  it("never leaks a document to a user without a share row", async () => {
    expect(await repo.getDocumentForUser("doc_roadmap", "usr_linus")).toBeNull();
    expect(await repo.getDocumentForUser("doc_research", "usr_linus")).toBeNull();
  });
});

describe("document lifecycle", () => {
  it("creates a document that only the owner can see until shared", async () => {
    const id = await repo.createDocument("usr_ada", { title: "Private draft" });

    const ownerView = await repo.getDocumentForUser(id, "usr_ada");
    expect(ownerView?.access).toBe("owner");
    expect(ownerView?.title).toBe("Private draft");

    expect(await repo.getDocumentForUser(id, "usr_grace")).toBeNull();

    await repo.upsertCollaborator(db, id, "usr_grace", "viewer");
    const shared = await repo.getDocumentForUser(id, "usr_grace");
    expect(shared?.access).toBe("viewer");
    expect(shared?.collaborators).toHaveLength(1);

    // Re-sharing the same person updates the role instead of duplicating rows.
    await repo.upsertCollaborator(db, id, "usr_grace", "editor");
    const edited = await repo.getDocumentForUser(id, "usr_grace");
    expect(edited?.access).toBe("editor");
    expect(edited?.collaborators).toHaveLength(1);

    await repo.removeCollaborator(db, id, "usr_grace");
    expect(await repo.getDocumentForUser(id, "usr_grace")).toBeNull();
  });

  it("persists title and content updates", async () => {
    const id = await repo.createDocument("usr_ada", { title: "Draft" });
    await repo.updateDocument(id, "usr_ada", {
      title: "Renamed draft",
      content: "<h2>Updated</h2><p>Body</p>",
    });

    const document = await repo.getDocumentForUser(id, "usr_ada");
    expect(document?.title).toBe("Renamed draft");
    expect(document?.content).toContain("<h2>Updated</h2>");
    expect(document?.lastEditorName).toBe("Ada Lovelace");
    expect(document?.preview).toContain("Updated Body");
  });

  it("stores and returns attachment bytes", async () => {
    const id = await repo.createDocument("usr_ada", { title: "With attachment" });
    const bytes = new TextEncoder().encode("hello attachment");

    const attachmentId = await repo.createAttachment(db, {
      documentId: id,
      filename: "brief.txt",
      mimeType: "text/plain",
      size: bytes.byteLength,
      data: bytes,
      uploadedBy: "usr_ada",
    });

    const meta = await repo.listAttachments(db, id);
    expect(meta).toHaveLength(1);
    expect(meta[0].filename).toBe("brief.txt");
    expect(meta[0].uploaderName).toBe("Ada Lovelace");

    const file = await repo.getAttachmentFile(db, attachmentId);
    expect(new TextDecoder().decode(file!.data)).toBe("hello attachment");

    await repo.deleteAttachment(db, attachmentId, id);
    expect(await repo.getAttachmentFile(db, attachmentId)).toBeNull();
  });

  it("cascades shares and attachments when a document is deleted", async () => {
    const id = await repo.createDocument("usr_ada", { title: "Delete me" });
    await repo.upsertCollaborator(db, id, "usr_grace", "editor");
    await repo.createAttachment(db, {
      documentId: id,
      filename: "note.txt",
      mimeType: "text/plain",
      size: 4,
      data: new TextEncoder().encode("note"),
      uploadedBy: "usr_ada",
    });

    await repo.deleteDocument(id);

    expect(await repo.getDocumentForUser(id, "usr_ada")).toBeNull();

    const attachmentCount = await db.execute({
      sql: "SELECT COUNT(*) AS count FROM attachments WHERE document_id = ?",
      args: [id],
    });
    const shareCount = await db.execute({
      sql: "SELECT COUNT(*) AS count FROM document_shares WHERE document_id = ?",
      args: [id],
    });
    expect(Number(attachmentCount.rows[0].count)).toBe(0);
    expect(Number(shareCount.rows[0].count)).toBe(0);
  });
});

describe("sessions", () => {
  it("issues hashed session tokens and resolves the signed-in user", async () => {
    const { token } = await repo.createSession(db, "usr_ada");

    const stored = await db.execute({
      sql: "SELECT token_hash FROM sessions WHERE user_id = ?",
      args: ["usr_ada"],
    });
    expect(stored.rows[0]?.token_hash).not.toBe(token);

    const user = await repo.getUserBySessionToken(db, token);
    expect(user?.email).toBe("ada@ajaia.dev");

    await repo.deleteSession(db, token);
    expect(await repo.getUserBySessionToken(db, token)).toBeNull();
  });

  it("rejects unknown tokens", async () => {
    expect(await repo.getUserBySessionToken(db, "not-a-real-token")).toBeNull();
  });
});
