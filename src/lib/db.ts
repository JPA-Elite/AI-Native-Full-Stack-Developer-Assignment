import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { seedDatabase } from "./seed";

/**
 * Storage
 * -------
 * One SQL dialect (SQLite / libSQL) for both local and deployed environments.
 *   Local dev  -> file:./.data/ajaia.db (zero setup)
 *   Vercel     -> libsql://<db>.turso.io + DATABASE_AUTH_TOKEN
 * See docs/ARCHITECTURE.md for why.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2c6a51',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '<p></p>',
  owner_id TEXT NOT NULL,
  last_edited_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at);

CREATE TABLE IF NOT EXISTS document_shares (
  document_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (document_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_shares_user ON document_shares(user_id);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  data BLOB NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attachments_document ON attachments(document_id);
`;

export type Db = Client;

type DbCache = {
  url: string;
  client: Client;
  ready: Promise<void>;
};

const globalForDb = globalThis as typeof globalThis & {
  __ajaiaDb?: DbCache;
};

export function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    const dir = path.join(process.cwd(), ".data");
    fs.mkdirSync(dir, { recursive: true });
    return `file:${path.join(dir, "ajaia.db")}`;
  }

  // Relative file URLs are resolved against the project root so `npm run dev`
  // and `npm run start` behave identically.
  if (raw.startsWith("file:")) {
    const target = raw.slice("file:".length);
    const absolute = path.isAbsolute(target)
      ? target
      : path.resolve(/* turbopackIgnore: true */ process.cwd(), target);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    return `file:${absolute}`;
  }

  return raw;
}

export function getDb(): Db {
  const url = resolveDatabaseUrl();

  if (globalForDb.__ajaiaDb?.url === url) {
    return globalForDb.__ajaiaDb.client;
  }

  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  // Reset the cache if initialization fails so a transient database error on a
  // cold start does not poison every later request in the same process.
  const ready = initialize(client).catch((error) => {
    if (globalForDb.__ajaiaDb?.client === client) {
      globalForDb.__ajaiaDb = undefined;
    }
    throw error;
  });

  globalForDb.__ajaiaDb = { url, client, ready };

  return client;
}

async function initialize(client: Client) {
  await client.executeMultiple(SCHEMA);
  await seedDatabase(client);
}

/** Await schema creation + demo seed before the first query of a request. */
export async function getReadyDb(): Promise<Db> {
  const db = getDb();
  await globalForDb.__ajaiaDb?.ready;
  return db;
}
