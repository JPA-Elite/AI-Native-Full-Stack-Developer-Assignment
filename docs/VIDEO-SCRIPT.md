# Walkthrough video script (4:50, shot by shot)

This replaces the earlier outline. It follows the seven-part flow in [`../VIDEO_URL.txt`](../VIDEO_URL.txt), uses the app's real button labels, and assumes the seeded demo data. Record at 1440×900 with the browser at 110–125% zoom.

---

## Before you record

1. **Reset the database** so counts and timestamps match this script. Stop the dev server, then:
   ```bash
   rm -rf .data
   npm run dev
   ```
2. **Two signed-out windows.** Window A is a normal browser at `/login` (becomes Ada). Window B is a private/incognito window at `/login` (becomes Linus). Side by side, or switch with Alt/Cmd+Tab.
3. **Files ready on the desktop:**
   - `demo-import.md` with a heading, a bullet list, and one bold line (or use `tests/fixtures/import-sample.docx`).
   - One small attachment, e.g. `diagram.png` or a PDF under 4 MB.
4. **Chrome setup:** hide the bookmarks bar, close other tabs, dismiss the "Welcome back" toast after each sign-in (its × is on the right), and make sure no OS notifications can pop in.
5. **Do one silent rehearsal** of 0:30–1:30. That section is the tightest: sign-in, two tab clicks, create, format, save, refresh in 60 seconds.
6. **Rule for the whole video:** only claim shipped behavior. The limits table in the README is part of the submission — say "not built" out loud, don't hide it.

### Seed data cheat sheet (after a reset)

| Document | Owner | Grace | Linus |
| --- | --- | --- | --- |
| Welcome to Ajaia Docs | Ada | Can edit | Can view |
| Q4 roadmap — internal | Ada | Can edit | — |
| Research: onboarding friction | Grace | — | — |
| Sprint retro notes | Linus | — | — |

Ada is also a **viewer** on *Research* and an **editor** on *Sprint retro*. All three accounts use password `demo1234`. *Welcome to Ajaia Docs* already has one seeded attachment, `import-notes.md`.

> For the invite in section 3, share **the document Ada creates in section 2** (Linus has no access to it yet). Do not use *Welcome* — Linus is already a viewer there, so the invite would be a role change, not a new grant.

---

## 0:00–0:30 — What it is and who it is for

**On screen:** sign-in page, signed out. Move the cursor near the three account cards; do not click yet.

**Say (≈70 words):**

> "Hi, I'm [name]. This is **Ajaia Docs** — a small collaborative document editor for teams that write together and need to always know who can see what. It's built with Next.js 16, TipTap, and libSQL. Three seeded accounts make the whole loop reviewable in about five minutes: write, format, import, attach, share. Everything here is the product as shipped, not a mockup."

**Tip:** if you're short on time, cut "Next.js 16, TipTap, and libSQL" — it's repeated in section 5.

---

## 0:30–1:30 — Sign in, dashboard, create, format, save, refresh

| Time | Do | Say |
| --- | --- | --- |
| 0:30 | Click the **Ada Lovelace** card. It fills the email only. Type `demo1234`, click **Sign in**. | "I'll sign in as Ada. Picking a card fills the email — the password is always typed, so there's no demo backdoor." |
| 0:38 | Dashboard loads; dismiss the **Welcome back, Ada** toast. Point at the header count and the three tabs. | "This is the workspace: four documents, two shared with me. The tabs separate what I own from what was shared." |
| 0:44 | Click **Shared with me** (tab), pause on the skeleton for a beat, then the two rows. Hover the **Can view** / **Can edit** badges and the last-editor column. Click **All documents**. | "Every row shows my access level, the owner, who edited it last, and collaborator and attachment counts. Switching a tab fetches the view from the server, so the list shows a skeleton instead of stale rows." |
| 0:54 | Click **New document**. Wait for the editor to load. | "New document." |
| 0:58 | Click the title field (`Document title`) and type **Launch checklist**. | "Title, then a little structure." |
| 1:03 | In the body: type **Ship day** → press Enter → type **Owner checks** → apply **Bulleted list**, type two short items. Then select a line and click **Bold (⌘B)** and **Underline (⌘U)**. | "Headings, bold, underline, lists — the toolbar is the normal rich-text set; links, quotes, code blocks, undo/redo, word count." |
| 1:18 | Stop typing. Point at the save indicator as it goes **Unsaved changes → Saving… → All changes saved**. Optionally press Ctrl/Cmd+S. | "There is no save button. Edits debounce at eight hundred milliseconds, saves are serialized so they can't race, and ⌘S flushes immediately. Watch it settle to **All changes saved**." |
| 1:25 | Press Ctrl/Cmd+R to refresh. Point at the title, the formatted lines, and the word count. | "Refresh — title, formatting, and word count are all back, because the sanitized HTML is persisted server-side." |

**Don't:** open the format menu and hunt for buttons on camera. Rehearse the bold/underline sequence once so your cursor lands.

---

## 1:30–2:20 — Share with Linus as a viewer, prove read-only

| Time | Do | Say |
| --- | --- | --- |
| 1:30 | Click **Share** (top right of the editor). Dialog **Share document** opens with "People with access" and Ada as **Owner**. | "Sharing is owner-only and invite-only. There are exactly two roles." |
| 1:36 | In **Email address to invite**, type `linus@ajaia.dev` (or click the **Linus** chip). Leave **Access level** on **Can view**. Click **Invite**. | "I'll add Linus as a viewer." |
| 1:42 | The success toast says **Access granted** and Linus appears with **Can view**. Click **Done**. | "The dialog shows the authoritative list from the server, not a guess." |
| 1:47 | Switch to **window B** (signed out). Click **Linus Torvalds**, type `demo1234`, **Sign in**. Dismiss the toast. | "Now the same document, as Linus." |
| 1:55 | Click **Shared with me**, open **Launch checklist**. | "It's in his shared list because I just granted access." |
| 2:02 | Point at, in order: the amber banner **"You have view-only access…"**, the header subtitle **Shared by Ada Lovelace · Can view**, the **Can view** badge, the footer **Read-only view**, and the fact that the toolbar is absent. Click into the body and type nothing. | "Viewers get a read-only banner, no formatting toolbar, and a read-only editor. This isn't just a hidden toolbar — the API rejects writes from viewers with a 403, and documents you can't see return 404 so IDs can't be enumerated." |

**Tip:** if the two windows are not side by side, cut to window B full screen for 1:47–2:20; don't make the viewer squint at a thumbnail.

---

## 2:20–3:00 — Import, then attachments

| Time | Do | Say |
| --- | --- | --- |
| 2:20 | Back in window A (Ada). Click **Back to documents** (arrow, top left), then **Import**. | "Import turns a file into a new editable draft." |
| 2:26 | Drop or browse `demo-import.md` (or the `.docx` fixture). Click **Import document**. | "Markdown, plain text, or Word, up to four megabytes." |
| 2:33 | New draft opens. Point at the title derived from the filename and the converted heading/bullets/bold. | "Headings, lists, emphasis, and links are converted to editor HTML — and sanitized on the way in, so no format is a bypass." |
| 2:40 | Click the paperclip (**Toggle attachments**) on *this* document, click **Attach a file**, choose `diagram.png`. Toast **Attachment added**. | "Attachments live next to the writing." |
| 2:48 | Point at the row: filename, size, uploader. Click the **Download** icon (it opens the file). Close the panel. | "Download or remove. Access is inherited from the parent document, never the file ID." |
| 2:56 | Open **Welcome to Ajaia Docs** → paperclip. Point at the seeded `import-notes.md`. | "This seeded document already has one. Viewers can download attachments but cannot add or remove them." |

**If the import drag-and-drop is fiddly on camera:** click **browse** instead. If you have time left, double-click the downloaded file to show the bytes match.

---

## 3:00–3:40 — Key decisions

**On screen:** either talk over the dashboard, or show `docs/ARCHITECTURE.md` (scroll to the stack table). Don't show two things moving at once.

| Time | Screen | Say |
| --- | --- | --- |
| 3:00 | Architecture note, stack table | "TipTap for editing, and sanitized HTML as the stored contract — not TipTap JSON. HTML is simpler to sanitize, import into, and debug. The server re-sanitizes every save against a strict tag allowlist and rewrites links to `noopener noreferrer nofollow`." |
| 3:12 | Architecture note, storage row | "libSQL instead of a local SQLite file, because Vercel's filesystem is ephemeral — a file database would silently lose writes. The same queries run against a local file in development and Turso in production." |
| 3:22 | Editor save indicator | "Autosave: an 800 ms debounce, an in-flight guard with a queued follow-up save, ⌘S, and a keepalive flush when the tab closes. The client never decides whether it may write." |
| 3:31 | Share dialog (reopen briefly) or permissions table | "Invite-only sharing with two roles, resolved in one permissions module. Every mutating route calls the same capability check, and every query is scoped by membership at the SQL level too." |

---

## 3:40–4:20 — What was deprioritized, and what comes next

**On screen:** README "Intentional limits" section (or the limits table in `SUBMISSION.md`). Scroll slowly once.

**Say (≈110 words):**

> "Deliberately not built: real-time collaboration and presence, comments, version history, public links, email delivery, inline images, login rate limiting. Autosave is last-write-wins, and that's documented rather than hidden — two simultaneous editors can overwrite each other. I chose one complete loop over half a CRDT: a partial real-time layer would have been worse than a reliable save loop.
>
> Next, in order: a version column with 409 conflict handling so a stale save surfaces instead of overwriting; anchored comments with resolve; revocable public read-only links; Markdown and PDF export; presence polling. Those are also listed in the README, so nothing here is a surprise."

---

## 4:20–4:50 — AI workflow: what it made, what I rejected, how I verified

**On screen:** terminal with `npm test` output (already run once so the scrollback exists), then `docs/screenshots/` in the file manager or a quick montage: `04-share.png`, `07-viewer.png`, `05-attachments.png`, `08-mobile-dashboard.png`. Do not scroll code on camera.

**Say (≈130 words):**

> "I used an agentic coding CLI with a coding model, and reviewed every output before accepting it. It generated scaffolding, the seed content, broad test cases, and first drafts of the docs. I rejected or changed the important parts: local SQLite on Vercel — replaced with libSQL and Turso; storing TipTap JSON — replaced with sanitized HTML; save-on-every-keystroke — replaced with the serialized debounce; inline permission checks — centralized, with 404s for invisible documents; a permissive sanitizer — narrowed after XSS payload tests; and Yjs collaboration — cut as out of scope. I also rewrote the marketing copy to match what's actually shipped.
>
> Verified with typecheck and lint, 42 Vitest tests, a 31-assertion API smoke script, four Playwright flows in Chromium, and screenshot review at 1440×900 and 390×844. The AI's E2E test also had a real bug — it used a quick-add chip that disappears after the first collaborator — so I rewrote it to fill the email field."

**Safe cut:** if you're over time, drop the E2E-test anecdote, keep the tool list and the verification numbers.

---

## 4:50 — Close

**On screen:** dashboard, or `SUBMISSION.md`.

**Say:**

> "Live URL and demo credentials are in SUBMISSION.md. The source, architecture note, AI workflow note, tests, and screenshots are all in the repo. Thanks."

Stop recording. Trim dead air at the start/end, add captions only if the platform needs them.

---

## Timing safety net

| If you're… | Do this |
| --- | --- |
| **Over 5:00** | Cut the seeded-attachment beat at 2:56, cut the E2E anecdote, and shorten section 5 to one sentence per decision. |
| **Under 4:50** | Show the *Research: onboarding friction* document as Ada (viewer) and point at the same banner from the other side, or add one line about the tiny screen: the dashboard and editor reflow at mobile width. |
| **Flubbed a click** | Don't narrate the mistake; pause one second, redo the action, and cut in editing. No need to restart the whole take. |
| **Toast covers something** | Dismiss with its ×, wait for the fade, then continue — toasts sit bottom-right and will block the attachment footer. |

## Exact labels you'll click

- Sign-in: account cards **Ada Lovelace / Grace Hopper / Linus Torvalds**, fields **Email** and **Password**, button **Sign in**.
- Dashboard: tabs **All documents / Owned by me / Shared with me**, buttons **Import** and **New document**, search **Search documents**, sidebar **Documents** and **Shared with me**.
- Editor: title field **Document title**, toolbar **Heading 1**, **Heading 2**, **Bold (⌘B)**, **Italic (⌘I)**, **Underline (⌘U)**, **Bulleted list**, **Numbered list**, **Quote**, **Code block**, **Add link**; header **Share**, **Toggle attachments**, **Document actions**.
- Share dialog: **Share document**, **Email address to invite**, **Access level**, **Invite**, **Done**, success toast **Access granted**.
- Import dialog: **Import a file**, **Drop a file here, or browse**, **Import document**, success toast **Imported**.
- Attachments panel: **Attachments**, **Attach a file**, **Download <filename>**, toast **Attachment added**.
- Save states: **Unsaved changes**, **Saving…**, **All changes saved**, **Couldn't save**.

## Claims to keep accurate

- 42 Vitest tests, 4 Playwright flows, 31-assertion smoke script — if any number changes, rerun and update rather than repeat this script from memory.
- "Owner-only" sharing: editors cannot invite or change roles; only the owner can delete.
- Attachments: 4 MB max, allow-listed extensions, stored as BLOBs in the database.
- Import: `.md`, `.markdown`, `.txt`, `.docx`; no inline images or comments are imported.
- Do **not** say "real-time", "Google Docs", "version history", or "public link" as if they exist.
