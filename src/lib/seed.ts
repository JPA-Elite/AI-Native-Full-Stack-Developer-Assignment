import type { Client } from "@libsql/client";
import { hashPassword } from "./crypto";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "./demo";

const WELCOME = `
<p>This is a shared space for the team to think, write, and decide together. It is intentionally small: a fast editor, a clear sharing model, and just enough file handling to keep real work moving.</p>
<h2>What you can do here</h2>
<ul>
  <li><strong>Write</strong> with bold, italic, underline, headings, and lists.</li>
  <li><strong>Import</strong> a <code>.md</code>, <code>.txt</code>, or <code>.docx</code> file as a new draft.</li>
  <li><strong>Attach</strong> a reference file to any document you can edit.</li>
  <li><strong>Share</strong> a document as a viewer or an editor.</li>
</ul>
<blockquote>Documents autosave while you type. There is no save button to forget.</blockquote>
<h2>Try it in 60 seconds</h2>
<ol>
  <li>Create a new document from the dashboard.</li>
  <li>Use the toolbar to format a sentence.</li>
  <li>Open <strong>Share</strong>, add Grace as a viewer, then sign in as Grace to see the read-only view.</li>
</ol>
<p>Everything you see was seeded so the product is testable immediately. See <code>README.md</code> for credentials and setup.</p>
`.trim();

const ROADMAP = `
<p><em>Working draft. Please leave comments in the review doc rather than editing this one directly.</em></p>
<h2>Theme: fewer handoffs</h2>
<ul>
  <li><strong>October</strong> — ship document sharing with two roles (viewer, editor).</li>
  <li><strong>November</strong> — file import for the three formats teams actually use.</li>
  <li><strong>December</strong> — usage review and a decision on real-time collaboration.</li>
</ul>
<h2>Non-goals</h2>
<p>Comments, suggestions, and version history are out of scope for this quarter. We would rather make the core editing loop feel solid than ship half of a review workflow.</p>
<h2>Open questions</h2>
<ol>
  <li>Do we need per-document permissions beyond view and edit?</li>
  <li>Is an attachment panel enough, or do teams expect inline images?</li>
  <li>What does “shared with me” need to show on first open?</li>
</ol>
`.trim();

const RESEARCH = `
<p>Six interviews with people who create documents weekly. Three consistent themes came up.</p>
<h2>1. The blank page is the hard part</h2>
<p>Every participant described starting from an existing doc or a template. Very few started from scratch.</p>
<h2>2. Sharing is a permissions question</h2>
<blockquote>“I usually paste a link and hope for the best. I don’t know what the other person can do until they tell me.”</blockquote>
<p>The distinction between <strong>can view</strong> and <strong>can edit</strong> matters more than link expiry or granular roles.</p>
<h2>3. Import is a bridge, not a destination</h2>
<ul>
  <li>Markdown files come from engineering notes.</li>
  <li>Word documents come from legal and finance reviews.</li>
  <li>Plain text is the lowest common denominator for pasted notes.</li>
</ul>
<p>Next step: test a two-role sharing model with five of these participants.</p>
`.trim();

const RETRO = `
<p><strong>Sprint 14</strong> · 8 people · 2 weeks</p>
<h2>What went well</h2>
<ul>
  <li>Shipping the import flow reduced manual copy-paste by roughly half in dogfooding.</li>
  <li>Design reviews moved into the document itself.</li>
</ul>
<h2>What hurt</h2>
<ul>
  <li>Too many docs without an owner. We need a lightweight owner signal.</li>
  <li>People kept asking whether a change had saved.</li>
</ul>
<h2>Actions</h2>
<ol>
  <li>Add an explicit save indicator — done.</li>
  <li>Show the last editor on every document row.</li>
  <li>Decide whether shared documents belong in the owner’s folder tree.</li>
</ol>
`.trim();

const ATTACHMENT_TEXT = `# Import notes
Attachments are stored in the same database as documents. That keeps the demo
portable: no object storage bucket is required to review the product.

Limits: 4 MB per file, allow-listed extensions only.
`.trim();

export async function seedDatabase(db: Client) {
  const existing = await db.execute("SELECT COUNT(*) AS count FROM users");
  const count = Number(existing.rows[0]?.count ?? 0);
  if (count > 0) return;

  const now = new Date();
  const iso = (offsetMinutes = 0) =>
    new Date(now.getTime() - offsetMinutes * 60_000).toISOString();

  const passwordHash = hashPassword(DEMO_PASSWORD);

  for (const user of DEMO_ACCOUNTS) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO users (id, name, email, password_hash, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [user.id, user.name, user.email, passwordHash, user.color, iso(60 * 24 * 30)],
    });
  }

  const documents = [
    {
      id: "doc_welcome",
      title: "Welcome to Ajaia Docs",
      content: WELCOME,
      owner: "usr_ada",
      editor: "usr_ada",
      updated: iso(35),
    },
    {
      id: "doc_roadmap",
      title: "Q4 roadmap — internal",
      content: ROADMAP,
      owner: "usr_ada",
      editor: "usr_ada",
      updated: iso(60 * 5),
    },
    {
      id: "doc_research",
      title: "Research: onboarding friction",
      content: RESEARCH,
      owner: "usr_grace",
      editor: "usr_grace",
      updated: iso(60 * 26),
    },
    {
      id: "doc_retro",
      title: "Sprint retro notes",
      content: RETRO,
      owner: "usr_linus",
      editor: "usr_linus",
      updated: iso(60 * 50),
    },
  ];

  for (const doc of documents) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO documents (id, title, content, owner_id, last_edited_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        doc.id,
        doc.title,
        doc.content,
        doc.owner,
        doc.editor,
        iso(60 * 24 * 14),
        doc.updated,
      ],
    });
  }

  const shares = [
    ["doc_welcome", "usr_grace", "editor"],
    ["doc_welcome", "usr_linus", "viewer"],
    ["doc_roadmap", "usr_grace", "editor"],
    ["doc_research", "usr_ada", "viewer"],
    ["doc_retro", "usr_ada", "editor"],
  ];

  for (const [documentId, userId, role] of shares) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO document_shares (document_id, user_id, role, created_at) VALUES (?, ?, ?, ?)",
      args: [documentId, userId, role, iso(60 * 24 * 7)],
    });
  }

  const bytes = new TextEncoder().encode(ATTACHMENT_TEXT);
  await db.execute({
    sql: `INSERT OR IGNORE INTO attachments (id, document_id, filename, mime_type, size, data, uploaded_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "att_import_notes",
      "doc_welcome",
      "import-notes.md",
      "text/markdown",
      bytes.byteLength,
      bytes,
      "usr_ada",
      iso(30),
    ],
  });
}
