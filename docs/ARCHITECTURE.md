# Architecture note

## The product slice I chose

The brief leaves the product surface open. I optimized for **one complete loop** rather than broad but shallow coverage:

> A person signs in → writes something real → brings in a file they already have → gives a teammate the right level of access → the teammate can immediately read or edit it.

That loop touches every capability in the assignment (editing, files, sharing, persistence) and is demonstrable in under two minutes. Everything else — comments, presence, versions, export — was deliberately deferred. A document editor without a trustworthy save loop is a demo; a small editor with clear ownership and reliable persistence is a product slice.

Three principles shaped the build:

1. **The editor is the product.** Formatting, autosave latency, and read-only behavior get the most polish.
2. **Access must be obvious.** Every document row and editor shows ownership and the caller's capability. Sharing is invite-only and role-based.
3. **Use one storage model everywhere.** The same SQLite/libSQL code runs locally and in production, so deployment cannot change behavior.

## Stack and why

| Choice | Why |
| --- | --- |
| **Next.js 16 App Router** | Server components for data loading and access checks; Route Handlers for a clean, testable JSON API; one deploy target (Vercel). |
| **TipTap (ProseMirror)** | Mature rich-text editing with a small extension surface, keyboard behavior, and HTML in/out. |
| **libSQL (SQLite dialect)** via `@libsql/client` | Zero-setup file database locally; switch `DATABASE_URL` to a Turso URL in production without changing queries. No ORM tax for a 5-table schema. |
| **Tailwind CSS 4** | Fast, consistent UI without a component library that would blur product decisions. |
| **Zod + `sanitize-html`** | Validation at the boundary and a strict allowlist on stored rich text. |
| **Vitest + Playwright** | Fast unit/integration coverage plus one real browser flow for the highest-risk paths. |

### Why not X?

- **Prisma + SQLite on Vercel** — Vercel's filesystem is ephemeral; a file database would silently lose writes. Turso keeps SQLite ergonomics with real persistence.
- **Postgres/Supabase** — viable, but a hosted Postgres adds setup and connection-pooling concerns without improving this scoped product. libSQL keeps local and remote identical.
- **Yjs/WebSocket collaboration** — real-time co-editing is a large correctness project (merging, presence, cursors, offline). Half of it would be worse than none. The autosave model is explicitly last-write-wins.
- **Storing TipTap JSON** — HTML is simpler to sanitize, import into, preview, and debug; the editor's allowed tag set is narrow enough to make round-tripping safe.

## Data model

```
users ──< sessions
  │
  ├──< documents (owner_id) ──< document_shares >── users
  │         │
  │         └──< attachments
  │
  └── last_edited_by
```

| Table | Notes |
| --- | --- |
| `users` | Seeded workspace. `password_hash` is scrypt (`salt$digest`). |
| `sessions` | Only a **SHA-256 hash** of the session token is stored. Cookie holds the raw token (httpOnly, SameSite=Lax, `Secure` in production), 30-day expiry. |
| `documents` | `content` is sanitized HTML. `updated_at` drives ordering and the "edited X ago" label. `last_edited_by` powers attribution. |
| `document_shares` | `(document_id, user_id)` primary key with role `editor | viewer`; SQL `CHECK` constraint. Upserts change roles without duplicate rows. |
| `attachments` | Filename, MIME type, size, bytes (`BLOB`), uploader. Authorization is derived from the parent document, never the attachment id. |

Schema creation and demo seeding are lazy and idempotent (`CREATE TABLE IF NOT EXISTS`, seed only when `users` is empty), so a fresh deployment is usable on first request with no migration step.

## Request flows

### Autosave

```
TipTap onUpdate → sanitize in client state → 800 ms debounce
  → PATCH /api/documents/:id { title?, content? }
  → loadDocument(id, "edit")             [auth + capability]
  → Zod validation → sanitizeDocumentHtml
  → UPDATE documents ... last_edited_by, updated_at
  → { updatedAt }
```

- Saves are **serialized**: if a request is in flight, the next one is queued rather than racing.
- `⌘/Ctrl+S` flushes immediately; unmount and `pagehide` send a `keepalive` PATCH.
- The client never decides whether it may write. A revoked editor gets a 403 and a visible error.

### Sharing

```
POST /api/documents/:id/shares { email, role }
  → loadDocument(id, "manage")  → only the owner passes
  → reject self, unknown email
  → UPSERT document_shares
  → 201 { collaborators }
```

`DELETE …/shares?userId=` removes access, `POST` with the same email updates the role. The response returns the authoritative collaborator list, so the dialog never guesses.

### Upload / import

- Import: multipart → extension allow-list → size ceiling (4 MB) → Markdown (`marked`), plain text (escaped, paragraph-preserving), or Word (`mammoth`) → **sanitize** → create document.
- Attachments are stored as BLOBs and streamed back through an authorization check with `Content-Disposition`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-store`.

### Authorization model

`src/lib/permissions.ts` is the only place roles become capabilities:

| Access | View | Edit | Manage sharing / delete |
| --- | --- | --- | --- |
| owner | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | — |
| viewer | ✓ | — | — |

`loadDocument(id, capability)` is used by every mutating route. Documents the caller cannot see return **404**, so ids cannot be enumerated; insufficient capability returns **403** with a specific code (`read_only`, `owner_only`).

SQL queries are scoped by membership as well (`owner_id = :uid OR EXISTS share`), so even a missed check cannot return another user's document.

### Rich-text safety

- Server strips everything outside `p, br, h1–h4, ul, ol, li, strong, em, u, s, code, pre, blockquote, hr, a`.
- `on*` attributes, `<script>`, `<iframe>`, `<img>`, inline styles, and all `javascript:` URLs are discarded. Links are forced to `rel="noopener noreferrer nofollow"` and `target="_blank"`.
- Imported Markdown/Word HTML passes through the same sanitizer, so no format is a bypass.
- Tested with explicit payloads (script tags, event handlers, `javascript:` links, raw HTML in Markdown).

## Deliberate tradeoffs

| Tradeoff | Consequence |
| --- | --- |
| **Last-write-wins autosave** | Simple and fast; two simultaneous editors can overwrite each other. A version column + 409 conflict is the next step. |
| **No real-time transport** | No presence or live cursors. Keeps the scope honest and avoids a half-built CRDT. |
| **Attachments in SQLite** | Portable, dependency-free, transactional; not suitable for large files or scale. Object storage + signed URLs is the production path. |
| **Invite-only sharing** | No public links or email delivery. Demonstrates the access model without an email service. |
| **Client-side search** | Instant and simple for a scoped list; does not paginate or search document bodies server-side. |
| **No login rate limit** | Acceptable for a seeded demo; would be added before exposing real accounts. |
| **Lazy seed/schema** | No migration tooling to review; fine for a 5-table demo, replaced by versioned migrations at scale. |

## Failure and error handling

- API errors use a consistent envelope: `{ error: { code, message, details? } }`, with 400/401/403/404/413/415/422/500 used deliberately.
- Upload validation happens twice (client for fast feedback, server for truth), including extension, size, and an unreadable-`.docx` path.
- The editor shows `Saved / Saving / Unsaved / Couldn't save` and surfaces server messages; session expiry redirects to sign-in.
- `not-found` and `error` boundaries, dashboard/editor skeletons, and empty states cover the non-happy paths.
- Deletes cascade manually (shares and attachments) inside a batched write so no orphan rows remain.

## Verification strategy

1. `tsc --noEmit` and ESLint on every change.
2. 42 Vitest tests: permission matrix, Zod contracts, sanitizer payloads, Markdown/text/Word conversion, and repository integration against a temporary database (ownership, sharing, roles, sessions, hashes, attachments, cascade deletes).
3. A 31-assertion API smoke script exercising the real HTTP surface, including 403/404 boundaries and unauthorized attachment downloads.
4. Three Playwright flows in a real browser: create → format → autosave → reload, share → viewer is read-only, and Markdown import.
5. Manual screenshot review at desktop and mobile widths, which caught the mobile tab overflow, read-only save label, and metadata wrapping fixed in the final build.
