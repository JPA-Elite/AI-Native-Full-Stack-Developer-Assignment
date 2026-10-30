# AI workflow note

## Tools used

- **OpenCode** — agentic coding CLI used for scaffolding, implementation, tests, and documentation, with a DeepSeek model. It had terminal, filesystem, and browser-automation access in this workspace.
- **Next.js 16 bundled docs** (`node_modules/next/dist/docs`) — read directly instead of trusting model memory, because this Next major has API changes (async `params`/`cookies`, `proxy` instead of `middleware`, Turbopack defaults).
- **Playwright** — used both to verify flows and to capture the screenshots in `docs/screenshots/` for visual review.

No AI-generated code was accepted without running it. The loop was: generate → read → typecheck → test → inspect in a browser → change or reject.

## Where AI materially sped things up

1. **Scaffolding and repetition.** Next.js setup, Tailwind tokens, UI primitives (button, modal, dropdown, toast), the API route skeletons, and the initial README structure. This is mechanical work that would have consumed a large share of a 4–6 hour box.
2. **Seed content and demo data.** Four realistic documents with formatting, three accounts, and a share matrix so reviewers see owned *and* shared documents on first login. Writing believable seed copy is slow by hand and low-risk to generate.
3. **Test breadth.** The permission matrix, sanitizer payload cases, upload-policy table, and repository integration tests were drafted quickly, then tightened. The `.docx` fixture and import assertion came from noticing the import path was untested.
4. **Cross-checking details.** Confirming TipTap v3's StarterKit already includes Link/Underline, Next 16 Route Handler signatures, and libSQL's local-file behavior. Faster than reading every changelog manually.

Realistically: the product decisions, data model, access rules, and final code review were mine; AI compressed the typing.

## What I changed or rejected

These are the places where accepting the first output would have produced a worse submission:

| AI suggestion / output | Decision |
| --- | --- |
| **Local SQLite file + Vercel deploy** | Rejected. Vercel's filesystem is ephemeral; writes would disappear. Replaced with `@libsql/client` so the same queries run on a local file and a hosted Turso database. |
| **Store TipTap JSON, render on the server** | Rejected. It adds a conversion layer for previews, imports, and sanitization. Stored sanitized HTML instead, with a strict tag allowlist. |
| **Save on every keystroke** | Rejected. Rewrote as an 800 ms debounce with an in-flight guard, a queued follow-up save, `⌘S`, and a `keepalive` flush on `pagehide`. The first version could drop the last edit when navigating away. |
| **Permission checks inlined in each route** | Rejected. Centralized in `resolveAccess` + `loadDocument(id, capability)`. Also changed unauthorized reads from 403 to **404** so document ids cannot be enumerated. |
| **Sanitizer allowing inline styles and images** | Rejected after writing XSS payload tests. Narrowed to a fixed tag/attribute set and forced safe link attributes. |
| **Add Yjs/WebSocket real-time collaboration** | Rejected on scope. A partial CRDT is worse than a reliable autosave loop; documented last-write-wins as an explicit tradeoff. |
| **Generated marketing copy** ("Google Docs replacement", claims about features not built) | Rewritten. The UI and README now state limits plainly: invite-only sharing, 4 MB files, no comments/versions/presence. |
| **Generated E2E test used the "quick add" chip** | Fixed. The chip disappears once a collaborator exists, making the test non-idempotent; switched to filling the email field. |
| **Attachment upload without a role check** | Caught in review/tests. Viewers can download but not upload or delete; editors can. |

I also rejected AI-generated naming and microcopy that felt generic. The editor's save states, empty states, and viewer banner were rewritten to say exactly what the product does.

## How I verified correctness, UX, and reliability

- **Types and lint:** `npm run typecheck` and `npm run lint` clean (React 19 ref rules included).
- **42 Vitest tests:** permission matrix, Zod contracts, sanitizer payloads, Markdown/plain-text/`.docx` conversion with a real fixture, and repository integration against a temp database — ownership, role upserts, session hashing, attachment bytes, cascade deletes.
- **31-assertion API smoke script** against the running server: login, create, save, sanitize, validation, 403/404 boundaries for viewer/editor/stranger, import, attachment upload/download, unauthenticated access, logout.
- **4 Playwright flows** in Chromium: password-required sign-in from an account card, create → bold → autosave → reload, share → second browser context as the viewer → read-only assertion → sign-out toast, and Markdown import through the real dialog.
- **Screenshot review** at 1440×900 and 390×844. This is where I found and fixed the mobile tab overflow, the redundant "Autosaved" state for viewers, and metadata wrapping in mobile rows.
- **Adversarial checks:** `javascript:` links, `<script>`/`<iframe>`/`onerror` payloads, path-traversal filenames, malformed `.docx`, oversized files, sharing with yourself, sharing with an unknown email, and deleting another user's document.

## Where I did not trust AI

- **Deployment assumptions.** Model knowledge of Vercel body limits, serverless filesystem behavior, and Turso connection modes is unreliable; I configured explicit limits and documented the production path rather than claiming a deployment I had not verified.
- **Auth security.** I reviewed the cookie flags, token storage (SHA-256 hashes, never raw), password hashing (scrypt with per-user salt), and session revocation manually.
- **Product judgment.** AI tends to add features. The main contribution of judgment here was subtraction: no comments, no versions, no presence, no public links, no rich embeds — so the editing and sharing loop could be finished and tested.

## What I would do differently with more time

Add a version/`updated_at` precondition to saves so concurrent edits surface a conflict instead of silently overwriting, and add login rate limiting. Both are correctness/security gaps I would not ship to real users, and both are called out in the README and architecture note rather than hidden.
