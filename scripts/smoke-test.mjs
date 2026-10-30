const BASE = "http://localhost:3000";

function makeClient() {
  let cookie = "";
  return {
    get cookie() {
      return cookie;
    },
    async fetch(path, init = {}) {
      const headers = new Headers(init.headers);
      if (cookie) headers.set("cookie", cookie);
      const res = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";")[0];
      return res;
    },
  };
}

async function login(email) {
  const client = makeClient();
  const res = await client.fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "demo1234" }),
  });
  const body = await res.json();
  if (res.status !== 200) throw new Error(`login ${email}: ${res.status} ${JSON.stringify(body)}`);
  return client;
}

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, ok: !!condition, detail });
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const ada = await login("ada@ajaia.dev");
const grace = await login("grace@ajaia.dev");

// own list
let res = await ada.fetch("/api/documents");
let { documents } = await res.json();
check("Ada lists 4 seeded docs", documents.length === 4, `got ${documents.length}`);
check("Owned + shared visible", documents.some(d => d.access === "owner") && documents.some(d => d.access === "viewer"));

// create
res = await ada.fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Smoke test doc" }) });
const { id } = await res.json();
check("Create document", res.status === 201 && !!id, id);

// update rich text
res = await ada.fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: "<h2>Hello</h2><ul><li><strong>bold</strong></li></ul><script>alert(1)</script>" }) });
check("Save content", res.status === 200);

res = await ada.fetch(`/api/documents/${id}`);
let doc = (await res.json()).document;
check("Content persisted", doc.content.includes("<h2>Hello</h2>") && doc.content.includes("<strong>bold</strong>"));
check("Script stripped on save", !doc.content.includes("script"), doc.content);

// validation
res = await ada.fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "   " }) });
check("Blank title rejected", res.status === 400);

// cannot see before sharing
res = await grace.fetch(`/api/documents/${id}`);
check("Unshared doc is 404 for Grace", res.status === 404, String(res.status));

// share viewer
res = await ada.fetch(`/api/documents/${id}/shares`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "grace@ajaia.dev", role: "viewer" }) });
check("Share as viewer", res.status === 201);
res = await ada.fetch(`/api/documents/${id}/shares`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ada@ajaia.dev", role: "viewer" }) });
check("Can't share with self", res.status === 400, String(res.status));
res = await ada.fetch(`/api/documents/${id}/shares`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "nobody@ajaia.dev", role: "viewer" }) });
check("Unknown user 404", res.status === 404, String(res.status));

// viewer can read, cannot write
res = await grace.fetch(`/api/documents/${id}`);
doc = (await res.json()).document;
check("Shared doc visible to Grace", res.status === 200 && doc.access === "viewer", doc?.access);
res = await grace.fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Hacked" }) });
check("Viewer write blocked", res.status === 403, String(res.status));
res = await grace.fetch(`/api/documents/${id}/shares`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "linus@ajaia.dev", role: "editor" }) });
check("Viewer can't manage sharing", res.status === 403, String(res.status));
res = await grace.fetch(`/api/documents/${id}`, { method: "DELETE" });
check("Viewer can't delete", res.status === 403, String(res.status));

// upgrade to editor
res = await ada.fetch(`/api/documents/${id}/shares`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "grace@ajaia.dev", role: "editor" }) });
check("Upgrade to editor", res.status === 201);
res = await grace.fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: "<p>Edited by Grace</p>" }) });
check("Editor can write", res.status === 200, String(res.status));
res = await grace.fetch(`/api/documents/${id}`, { method: "DELETE" });
check("Editor still can't delete", res.status === 403, String(res.status));

// import markdown
const form = new FormData();
form.append("file", new Blob(["# Imported\n\n- one\n- two"], { type: "text/markdown" }), "smoke-notes.md");
res = await ada.fetch("/api/import", { method: "POST", body: form });
const imported = await res.json();
check("Markdown import", res.status === 201 && imported.title === "Smoke notes", JSON.stringify(imported));
res = await ada.fetch(`/api/documents/${imported.id}`);
doc = (await res.json()).document;
check("Imported formatting", doc.content.includes("<h1>Imported</h1>") && doc.content.includes("<li>one</li>"));

// import rejection
const badForm = new FormData();
badForm.append("file", new Blob(["nope"], { type: "application/pdf" }), "bad.pdf");
res = await ada.fetch("/api/import", { method: "POST", body: badForm });
check("Unsupported import rejected", res.status === 415, String(res.status));

// attachment
const attForm = new FormData();
attForm.append("file", new Blob(["hello attachment"], { type: "text/plain" }), "notes.txt");
res = await ada.fetch(`/api/documents/${id}/attachments`, { method: "POST", body: attForm });
const { attachmentId } = await res.json();
check("Attachment upload", res.status === 201 && !!attachmentId, attachmentId);
res = await ada.fetch(`/api/attachments/${attachmentId}`);
const text = await res.text();
check("Attachment download", res.status === 200 && text === "hello attachment", text);
check("Attachment is nosniff", res.headers.get("x-content-type-options") === "nosniff");
res = await grace.fetch(`/api/attachments/${attachmentId}`);
check("Collaborator can download", res.status === 200);
const linus = await login("linus@ajaia.dev");
res = await linus.fetch(`/api/attachments/${attachmentId}`);
check("Stranger can't download", res.status === 404, String(res.status));

// unauthenticated
const anon = makeClient();
res = await anon.fetch("/api/documents");
check("Unauthenticated blocked", res.status === 401, String(res.status));

// delete as owner
res = await ada.fetch(`/api/documents/${id}`, { method: "DELETE" });
check("Owner deletes", res.status === 200);
res = await ada.fetch(`/api/documents/${id}`);
check("Deleted doc gone", res.status === 404);

// logout
res = await ada.fetch("/api/auth/logout", { method: "POST" });
check("Logout", res.status === 200);
res = await ada.fetch("/api/documents");
check("Session revoked after logout", res.status === 401, String(res.status));

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
