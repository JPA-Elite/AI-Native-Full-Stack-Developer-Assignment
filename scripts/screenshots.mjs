import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = "docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
});
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/01-login.png`, fullPage: true });
console.log("login ok");

await page.getByRole("button", { name: /Ada Lovelace/ }).click();
await page.waitForURL("**/dashboard", { timeout: 20000 });
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/02-dashboard.png`, fullPage: true });
console.log("dashboard ok");

await page.getByRole("link", { name: "Welcome to Ajaia Docs" }).first().click();
await page.waitForURL("**/doc/**");
await page.locator(".ProseMirror").waitFor();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/03-editor.png`, fullPage: true });
console.log("editor ok");

await page.getByRole("button", { name: "Share", exact: true }).click();
await page.getByRole("dialog").waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/04-share.png` });
console.log("share ok");

await page.getByRole("button", { name: "Close dialog" }).click();

await page.getByRole("button", { name: "Toggle attachments" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/05-attachments.png` });
console.log("attachments ok");

await page.getByRole("button", { name: "Close attachments panel" }).click();

// Read-only view as Grace (welcome doc is shared with her as editor, retro is editor, research is owner).
const graceContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const gracePage = await graceContext.newPage();
await gracePage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await gracePage.getByRole("button", { name: /Grace Hopper/ }).click();
await gracePage.waitForURL("**/dashboard");
await gracePage.waitForLoadState("networkidle");
await gracePage.screenshot({ path: `${out}/06-dashboard-grace.png`, fullPage: true });

// Linus has viewer access to the welcome doc.
const linusContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const linusPage = await linusContext.newPage();
await linusPage.goto("http://localhost:3000/doc/doc_welcome");
await linusPage.waitForURL("**/login**");
await linusPage.getByRole("button", { name: /Linus Torvalds/ }).click();
await linusPage.waitForURL("**/dashboard");
await linusPage.goto("http://localhost:3000/doc/doc_welcome");
await linusPage.locator(".ProseMirror").waitFor();
await linusPage.waitForTimeout(600);
await linusPage.screenshot({ path: `${out}/07-viewer.png`, fullPage: true });
console.log("viewer ok");

// Mobile views
const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  storageState: await context.storageState(),
});
const mobile = await mobileContext.newPage();
await mobile.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
await mobile.screenshot({ path: `${out}/08-mobile-dashboard.png`, fullPage: true });
await mobile.goto("http://localhost:3000/doc/doc_welcome", { waitUntil: "networkidle" });
await mobile.locator(".ProseMirror").waitFor();
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: `${out}/09-mobile-editor.png`, fullPage: true });
console.log("mobile ok");

await browser.close();
