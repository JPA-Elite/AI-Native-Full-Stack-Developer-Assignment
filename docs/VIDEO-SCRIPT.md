# Walkthrough video outline (3–5 minutes)

The final link belongs in [`../VIDEO_URL.txt`](../VIDEO_URL.txt). Record at 1440×900, signed out at the start, with seed data reset (`rm -rf .data && npm run dev`).

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:20 | Login screen | "Ajaia Docs is a scoped collaborative editor. One complete loop: write, import, attach, share. Three seeded accounts make it testable in under two minutes." |
| 0:20–0:45 | Dashboard as Ada | "Owned vs shared is visible immediately: tabs, owner badges, role badges, last editor, collaborator and attachment counts." |
| 0:45–1:40 | New document → title → rich text | "Autosave runs on an 800 ms debounce with serialized saves. No save button. Formatting is bold, italic, underline, headings, lists, quotes, code, links." |
| 1:40–2:00 | Refresh | "Content and formatting survive a reload because saves are server-sanitized HTML persisted in SQLite/libSQL." |
| 2:00–2:45 | Share → Linus as viewer → sign out → Linus | "Sharing is owner-only, invite-only, two roles. Viewers get a read-only editor and a clear banner; the API independently enforces 403/404." |
| 2:45–3:20 | Import + attachments | "Markdown, text, and Word import becomes an editable draft. Attachments are authorized through the parent document, not the file id." |
| 3:20–3:50 | Architecture note on screen or talk over dashboard | "TipTap for editing, sanitized HTML as the contract, libSQL/Turso because Vercel's filesystem is ephemeral, one permission function used by every route." |
| 3:50–4:20 | Switch to README limits | "Deliberately not built: real-time, comments, versions, public links. Last-write-wins is the known tradeoff; next is save versioning with conflicts." |
| 4:20–4:50 | Test output / screenshots | "AI generated scaffolding, tests, and docs. I rejected local SQLite on Vercel, inline permission checks, and the first autosave implementation. Verified with typecheck, lint, 42 unit/integration tests, a 31-assertion API smoke test, four Playwright flows, and desktop/mobile screenshot review." |
| 4:50–5:00 | Close | "Live URL and demo credentials are in SUBMISSION.md." |

## Recording tips

- Zoom the browser to 110–125% so text is readable on video.
- Use two browser profiles (or one normal + one incognito) so Ada and Linus sessions do not collide.
- Show the save indicator explicitly after typing; pause ~1 second so the transition from "Unsaved" to "All changes saved" is visible.
- Keep a `.md` file ready on the desktop for the import step.
- Do not claim features that are not built; the limits table in the README is intentional.
