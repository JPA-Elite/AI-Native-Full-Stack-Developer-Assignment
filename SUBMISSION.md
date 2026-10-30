# Submission — Ajaia Docs

**Live product:** `<ADD YOUR VERCEL URL HERE>`
**Walkthrough video:** see [`VIDEO_URL.txt`](./VIDEO_URL.txt)
**Source:** this repository

---

## Reviewer quick path (≈5 minutes)

1. Open the live URL (or run locally — see [README](./README.md)).
2. Sign in as **Ada Lovelace** (`ada@ajaia.dev` / `demo1234`) via the one-click account card.
3. Open **Welcome to Ajaia Docs** → edit a line, apply bold/underline, watch **All changes saved** → refresh to confirm persistence.
4. Click **Share** → invite `linus@ajaia.dev` as **Can view** (if not already) → **Sign out** → sign in as **Linus Torvalds** (`linus@ajaia.dev`) → open the same document: read-only banner, no toolbar, `contenteditable=false`.
5. Back as Ada, open **Import** and upload a `.md` / `.txt` / `.docx` file (≤4 MB) → it becomes a new editable draft. Open the paperclip to attach a file.

## Test accounts

All accounts use password **`demo1234`**. The sign-in screen also has one-click buttons.

| Name | Email | Seeded relationship |
| --- | --- | --- |
| Ada Lovelace | `ada@ajaia.dev` | Owner of *Welcome to Ajaia Docs* + *Q4 roadmap*; editor on *Sprint retro*; viewer on *Research* |
| Grace Hopper | `grace@ajaia.dev` | Editor on Ada's two docs; owner of *Research* |
| Linus Torvalds | `linus@ajaia.dev` | **Viewer** on *Welcome to Ajaia Docs*; owner of *Sprint retro* |

No other credentials, services, or paid dependencies are required.

---

## What is included

| Deliverable | Location |
| --- | --- |
| Source code | `src/`, `e2e/`, `tests/`, config files |
| README (setup, features, deployment, limits) | [`README.md`](./README.md) |
| Architecture note | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| AI workflow note | [`docs/AI-WORKFLOW.md`](./docs/AI-WORKFLOW.md) |
| This submission summary | `SUBMISSION.md` |
| Walkthrough video URL | [`VIDEO_URL.txt`](./VIDEO_URL.txt) |
| Screenshots | `docs/screenshots/` (login, dashboard, editor, sharing, attachments, viewer, mobile) |
| Video outline (for the recording) | [`docs/VIDEO-SCRIPT.md`](./docs/VIDEO-SCRIPT.md) |
| Automated tests | `tests/` (Vitest), `e2e/` (Playwright) |
| API smoke test | `scripts/smoke-test.mjs` |
| Demo `.docx` fixture | `tests/fixtures/import-sample.docx` |
| Environment template | `.env.example` |

## Feature status

### Working end to end

- Seeded sign-in with scrypt-hashed passwords, hashed session tokens, httpOnly cookies, sign-out.
- Create, rename (dashboard or inline title), edit, autosave, reopen, and delete documents.
- Rich text: bold, italic, underline, H1/H2, bulleted/numbered lists, blockquotes, code blocks, links, undo/redo, word count.
- Autosave with visible state, retry/error handling, `⌘S`, and flush on tab close. Server re-sanitizes every save.
- Import `.md`, `.markdown`, `.txt`, `.docx` into a new document (4 MB max), with conversion and sanitization.
- Attachments (PDF, images, Office, CSV, Markdown, text, JSON, zip; 4 MB max) with download and removal; access inherited from the document.
- Share with an existing workspace member as viewer or editor; change role; remove access.
- Server-enforced access control: owners can manage/delete, editors can write, viewers are read-only. Unauthorized reads return 404.
- Dashboard ownership distinction: tabs, badges, owner attribution, collaborator/attachment indicators, search, empty states.
- Responsive dashboard/editor, loading skeletons, 404 and error boundaries.

### Incomplete / intentionally not built

- **No real-time collaboration or presence.** Autosave is last-write-wins; no live cursors or conflict prompts.
- **No comments, suggestions, or version history.**
- **No public-link sharing.** Access requires a workspace member invite.
- **No sign-up or email delivery.** Sharing targets the three seeded accounts only.
- **No inline images in documents.** Files are attachments, not embedded media.
- **Search is client-side** and covers the loaded document list.
- **No PDF/Markdown export.**
- **No login rate limiting.**

### Next with another 2–4 hours

1. Save versioning with 409 conflict resolution (prevents silent overwrite).
2. Anchored comments with resolve/unresolve.
3. Revocable public read-only links.
4. Version history with restore.
5. Markdown/PDF export.
6. Presence heartbeat ("Grace is viewing") using polling.
7. Login rate limiting and object storage for attachments.

---

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev
# http://localhost:3000
```

The SQLite database is created and seeded automatically on first request at `.data/ajaia.db`. Delete `.data` and restart to reset the demo.

```bash
npm run typecheck
npm run lint
npm test            # 42 Vitest tests
npm run test:e2e    # Playwright (npx playwright install chromium first)
```

## Deploy

See the step-by-step Vercel + Turso guide in [`README.md`](./README.md#deploy-to-vercel). Production requires two environment variables: `DATABASE_URL` (libSQL/Turso URL) and `DATABASE_AUTH_TOKEN`. Schema and seed data are created automatically on the first request.

After deploying, update:

- `<ADD YOUR VERCEL URL HERE>` at the top of this file and in the README.
- [`VIDEO_URL.txt`](./VIDEO_URL.txt) with the public walkthrough link.

## Notes for the reviewer

- Documents are shared across accounts on purpose; a document you edit while signed in as Ada is visible to Grace/Linus according to the access table.
- The "Research: onboarding friction" document is owned by Grace and shared with Ada as **viewer**, so you can test read-only behavior without changing any sharing settings.
- Files are stored inside the database to keep the review self-contained. This is a deliberate scope decision, documented in the architecture note.
- There is no Google Drive folder attached to this repository; the source, docs, screenshots, and test artifacts are all in the repository tree so they can be zipped and uploaded as the Drive folder if required.
