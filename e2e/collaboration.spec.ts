import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end coverage of the two flows the assignment is judged on:
 * editing with autosave, and sharing with a different access level.
 */

test.describe.configure({ mode: "serial" });

const runId = Date.now().toString().slice(-6);
const documentTitle = `E2E draft ${runId}`;
let documentId = "";

async function signIn(page: Page, name: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.waitForURL("**/dashboard");
}

test("creates a document, formats it, and survives a reload", async ({ page }) => {
  await signIn(page, "Ada Lovelace");

  await page.getByRole("button", { name: "New document" }).click();
  await page.waitForURL(/\/doc\/doc_[a-z0-9]+/);
  documentId = page.url().split("/doc/")[1];

  await page.getByLabel("Document title").fill(documentTitle);

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await page.keyboard.type("A first paragraph written by the editor.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Bold line");

  await page.keyboard.press("Shift+Home");
  await page.getByRole("button", { name: "Bold (⌘B)" }).click();

  await expect(editor.locator("strong")).toHaveText("Bold line");
  await expect(page.getByRole("status")).toContainText("All changes saved", { timeout: 15_000 });

  await page.reload();
  await editor.waitFor();
  await expect(page.getByLabel("Document title")).toHaveValue(documentTitle);
  await expect(editor).toContainText("A first paragraph written by the editor.");
  await expect(editor.locator("strong")).toHaveText("Bold line");
});

test("shares the document as a viewer and the viewer cannot edit", async ({ page, browser }) => {
  await signIn(page, "Ada Lovelace");
  await page.goto(`/doc/${documentId}`);

  await page.getByRole("button", { name: "Share", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Email address to invite").fill("grace@ajaia.dev");
  await dialog.getByRole("button", { name: "Invite" }).click();

  await expect(dialog.getByText("Grace Hopper")).toBeVisible();
  const graceRow = dialog.getByRole("listitem").filter({ hasText: "Grace Hopper" });
  await expect(graceRow.getByRole("combobox")).toHaveValue("viewer");
  await dialog.getByRole("button", { name: "Done" }).click();

  const graceContext = await browser.newContext();
  const gracePage = await graceContext.newPage();

  await signIn(gracePage, "Grace Hopper");
  await gracePage.goto(`/doc/${documentId}`);
  await gracePage.locator(".ProseMirror").waitFor();

  await expect(gracePage.getByText("view-only", { exact: false })).toBeVisible();
  await expect(gracePage.getByRole("button", { name: "Bold (⌘B)" })).toHaveCount(0);

  const editable = await gracePage.locator(".ProseMirror").getAttribute("contenteditable");
  expect(editable).toBe("false");

  // The shared document is listed with its access badge for Grace.
  await gracePage.goto("/dashboard");
  const row = gracePage.getByRole("listitem").filter({ hasText: documentTitle });
  await expect(row.getByText("Can view")).toBeVisible();

  await graceContext.close();
});

test("imports a Markdown file into a new editable draft", async ({ page }) => {
  await signIn(page, "Ada Lovelace");
  await page.getByRole("button", { name: "Import", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="file"]').setInputFiles({
    name: `e2e-import-${runId}.md`,
    mimeType: "text/markdown",
    buffer: Buffer.from("# Imported heading\n\n- first item\n- second item\n\n**bold** text"),
  });

  await dialog.getByRole("button", { name: "Import document" }).click();
  await page.waitForURL(/\/doc\/doc_[a-z0-9]+/);

  await expect(page.getByLabel("Document title")).toHaveValue(`E2e import ${runId}`);
  await expect(page.locator(".ProseMirror h1")).toHaveText("Imported heading");
  await expect(page.locator(".ProseMirror li")).toHaveCount(2);
  await expect(page.locator(".ProseMirror strong")).toHaveText("bold");
});
