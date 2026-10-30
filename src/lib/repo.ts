import type { Client } from "@libsql/client";
import { getReadyDb } from "./db";
import { hashToken } from "./crypto";
import { resolveAccess, type Access, type ShareRole } from "./permissions";
import { htmlToText } from "./utils";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  color: string;
};

export type Collaborator = PublicUser & {
  role: ShareRole;
  addedAt: string;
};

export type AttachmentMeta = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
};

export type DocumentSummary = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  access: Exclude<Access, null>;
  updatedAt: string;
  createdAt: string;
  lastEditorName: string | null;
  preview: string;
  collaboratorCount: number;
  attachmentCount: number;
};

export type DocumentDetail = DocumentSummary & {
  content: string;
  collaborators: Collaborator[];
  attachments: AttachmentMeta[];
};

const PREVIEW_LIMIT = 180;

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function toIso(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function mapUser(row: Record<string, unknown>): PublicUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    color: String(row.color ?? "#2c6a51"),
  };
}

/* ------------------------------- sessions ------------------------------- */

export async function createSession(db: Client, userId: string, ttlDays = 30) {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const expires = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  await db.execute({
    sql: "DELETE FROM sessions WHERE expires_at < ?",
    args: [now.toISOString()],
  });
  await db.execute({
    sql: "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [hashToken(token), userId, expires.toISOString(), now.toISOString()],
  });

  return { token, expiresAt: expires };
}

export async function getUserBySessionToken(
  db: Client,
  token: string,
): Promise<PublicUser | null> {
  const result = await db.execute({
    sql: `SELECT u.id, u.name, u.email, u.color
          FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ?`,
    args: [hashToken(token), new Date().toISOString()],
  });
  const row = result.rows[0];
  return row ? mapUser(row as unknown as Record<string, unknown>) : null;
}

export async function deleteSession(db: Client, token: string) {
  await db.execute({
    sql: "DELETE FROM sessions WHERE token_hash = ?",
    args: [hashToken(token)],
  });
}

/* --------------------------------- users -------------------------------- */

export async function findUserByEmail(
  db: Client,
  email: string,
): Promise<(PublicUser & { passwordHash: string }) | null> {
  const result = await db.execute({
    sql: "SELECT id, name, email, color, password_hash FROM users WHERE email = ? LIMIT 1",
    args: [email.trim().toLowerCase()],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...mapUser(row as unknown as Record<string, unknown>),
    passwordHash: String(row.password_hash),
  };
}

export async function getUserById(db: Client, id: string): Promise<PublicUser | null> {
  const result = await db.execute({
    sql: "SELECT id, name, email, color FROM users WHERE id = ? LIMIT 1",
    args: [id],
  });
  const row = result.rows[0];
  return row ? mapUser(row as unknown as Record<string, unknown>) : null;
}

export async function listWorkspaceUsers(db: Client): Promise<PublicUser[]> {
  const result = await db.execute("SELECT id, name, email, color FROM users ORDER BY name");
  return result.rows.map((row) => mapUser(row as unknown as Record<string, unknown>));
}

/* ------------------------------- documents ------------------------------ */

const SUMMARY_COLUMNS = `
  d.id, d.title, d.owner_id, d.last_edited_by, d.created_at, d.updated_at,
  substr(d.content, 1, 1200) AS preview_html,
  owner.name AS owner_name,
  editor.name AS last_editor_name,
  (SELECT s.role FROM document_shares s WHERE s.document_id = d.id AND s.user_id = :uid) AS my_role,
  (SELECT COUNT(*) FROM document_shares s WHERE s.document_id = d.id) AS collaborator_count,
  (SELECT COUNT(*) FROM attachments a WHERE a.document_id = d.id) AS attachment_count
`;

function mapSummary(row: Record<string, unknown>, userId: string): DocumentSummary {
  const access = resolveAccess(
    String(row.owner_id),
    userId,
    row.my_role as string | null,
  );
  if (!access) throw new Error("Document summary mapped without access");

  const preview = htmlToText(String(row.preview_html ?? ""));
  return {
    id: String(row.id),
    title: String(row.title),
    ownerId: String(row.owner_id),
    ownerName: String(row.owner_name),
    access,
    updatedAt: toIso(row.updated_at),
    createdAt: toIso(row.created_at),
    lastEditorName: row.last_editor_name ? String(row.last_editor_name) : null,
    preview:
      preview.length > PREVIEW_LIMIT ? `${preview.slice(0, PREVIEW_LIMIT).trimEnd()}…` : preview,
    collaboratorCount: toNumber(row.collaborator_count),
    attachmentCount: toNumber(row.attachment_count),
  };
}

export async function listDocumentsForUser(userId: string): Promise<DocumentSummary[]> {
  const db = await getReadyDb();
  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS}
          FROM documents d
          JOIN users owner ON owner.id = d.owner_id
          LEFT JOIN users editor ON editor.id = d.last_edited_by
          WHERE d.owner_id = :uid
             OR EXISTS (SELECT 1 FROM document_shares s WHERE s.document_id = d.id AND s.user_id = :uid)
          ORDER BY d.updated_at DESC`,
    args: { uid: userId },
  });

  return result.rows.map((row) =>
    mapSummary(row as unknown as Record<string, unknown>, userId),
  );
}

export async function createDocument(
  ownerId: string,
  input: { title: string; content?: string },
): Promise<string> {
  const db = await getReadyDb();
  const id = `doc_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO documents (id, title, content, owner_id, last_edited_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.title, input.content ?? "<p></p>", ownerId, ownerId, now, now],
  });

  return id;
}

export async function getDocumentForUser(
  documentId: string,
  userId: string,
): Promise<DocumentDetail | null> {
  const db = await getReadyDb();
  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS}, d.content
          FROM documents d
          JOIN users owner ON owner.id = d.owner_id
          LEFT JOIN users editor ON editor.id = d.last_edited_by
          WHERE d.id = :id`,
    args: { id: documentId, uid: userId },
  });

  const row = result.rows[0];
  if (!row) return null;

  const record = row as unknown as Record<string, unknown>;
  const access = resolveAccess(
    String(record.owner_id),
    userId,
    record.my_role as string | null,
  );
  if (!access) return null;

  const [collaborators, attachments] = await Promise.all([
    listCollaborators(db, documentId),
    listAttachments(db, documentId),
  ]);

  return {
    ...mapSummary(record, userId),
    content: String(record.content ?? "<p></p>"),
    collaborators,
    attachments,
  };
}

export async function updateDocument(
  documentId: string,
  editorId: string,
  fields: { title?: string; content?: string },
): Promise<string> {
  const db = await getReadyDb();
  const now = new Date().toISOString();

  if (fields.title !== undefined && fields.content !== undefined) {
    await db.execute({
      sql: "UPDATE documents SET title = ?, content = ?, last_edited_by = ?, updated_at = ? WHERE id = ?",
      args: [fields.title, fields.content, editorId, now, documentId],
    });
  } else if (fields.title !== undefined) {
    await db.execute({
      sql: "UPDATE documents SET title = ?, updated_at = ? WHERE id = ?",
      args: [fields.title, now, documentId],
    });
  } else if (fields.content !== undefined) {
    await db.execute({
      sql: "UPDATE documents SET content = ?, last_edited_by = ?, updated_at = ? WHERE id = ?",
      args: [fields.content, editorId, now, documentId],
    });
  }

  return now;
}

export async function deleteDocument(documentId: string) {
  const db = await getReadyDb();
  await db.batch(
    [
      { sql: "DELETE FROM attachments WHERE document_id = ?", args: [documentId] },
      { sql: "DELETE FROM document_shares WHERE document_id = ?", args: [documentId] },
      { sql: "DELETE FROM documents WHERE id = ?", args: [documentId] },
    ],
    "write",
  );
}

export async function renameDocument(documentId: string, title: string) {
  const db = await getReadyDb();
  await db.execute({
    sql: "UPDATE documents SET title = ?, updated_at = ? WHERE id = ?",
    args: [title, new Date().toISOString(), documentId],
  });
}

/* -------------------------------- sharing -------------------------------- */

export async function listCollaborators(
  db: Client,
  documentId: string,
): Promise<Collaborator[]> {
  const result = await db.execute({
    sql: `SELECT u.id, u.name, u.email, u.color, s.role, s.created_at
          FROM document_shares s JOIN users u ON u.id = s.user_id
          WHERE s.document_id = ?
          ORDER BY s.created_at ASC`,
    args: [documentId],
  });

  return result.rows.map((row) => ({
    ...mapUser(row as unknown as Record<string, unknown>),
    role: (row.role === "editor" ? "editor" : "viewer") as ShareRole,
    addedAt: toIso(row.created_at),
  }));
}

export async function upsertCollaborator(
  db: Client,
  documentId: string,
  userId: string,
  role: ShareRole,
) {
  await db.execute({
    sql: `INSERT INTO document_shares (document_id, user_id, role, created_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(document_id, user_id) DO UPDATE SET role = excluded.role`,
    args: [documentId, userId, role, new Date().toISOString()],
  });
}

export async function removeCollaborator(
  db: Client,
  documentId: string,
  userId: string,
) {
  await db.execute({
    sql: "DELETE FROM document_shares WHERE document_id = ? AND user_id = ?",
    args: [documentId, userId],
  });
}

/* ------------------------------ attachments ------------------------------ */

export async function listAttachments(
  db: Client,
  documentId: string,
): Promise<AttachmentMeta[]> {
  const result = await db.execute({
    sql: `SELECT a.id, a.filename, a.mime_type, a.size, a.uploaded_by, a.created_at, u.name AS uploader_name
          FROM attachments a JOIN users u ON u.id = a.uploaded_by
          WHERE a.document_id = ?
          ORDER BY a.created_at DESC`,
    args: [documentId],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    filename: String(row.filename),
    mimeType: String(row.mime_type),
    size: toNumber(row.size),
    uploadedBy: String(row.uploaded_by),
    uploaderName: String(row.uploader_name),
    createdAt: toIso(row.created_at),
  }));
}

export async function createAttachment(
  db: Client,
  input: {
    documentId: string;
    filename: string;
    mimeType: string;
    size: number;
    data: Uint8Array;
    uploadedBy: string;
  },
) {
  const id = `att_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  await db.execute({
    sql: `INSERT INTO attachments (id, document_id, filename, mime_type, size, data, uploaded_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.documentId,
      input.filename,
      input.mimeType,
      input.size,
      input.data,
      input.uploadedBy,
      new Date().toISOString(),
    ],
  });
  return id;
}

export async function getAttachmentFile(db: Client, attachmentId: string) {
  const result = await db.execute({
    sql: "SELECT id, document_id, filename, mime_type, data FROM attachments WHERE id = ?",
    args: [attachmentId],
  });
  const row = result.rows[0];
  if (!row) return null;

  const raw = row.data as ArrayBuffer | Uint8Array;
  const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw as ArrayBuffer);

  return {
    id: String(row.id),
    documentId: String(row.document_id),
    filename: String(row.filename),
    mimeType: String(row.mime_type),
    data,
  };
}

export async function deleteAttachment(
  db: Client,
  attachmentId: string,
  documentId: string,
) {
  await db.execute({
    sql: "DELETE FROM attachments WHERE id = ? AND document_id = ?",
    args: [attachmentId, documentId],
  });
}
