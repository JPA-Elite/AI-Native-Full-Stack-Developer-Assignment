import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

let delayMs = 0;
await page.route("**/dashboard**", async (route) => {
  if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
  await route.continue();
});

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Ada Lovelace/ }).click();
await page.getByLabel("Password").fill("demo1234");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard");
await page.waitForTimeout(400);

const loading = page.getByRole("status").filter({ hasText: "Loading documents" });

async function switchView(scope, linkName, expectedUrl, screenshot) {
  delayMs = 2500;
  await scope.getByRole("link", { name: linkName }).click();
  await loading.waitFor({ state: "visible", timeout: 2000 });
  await page.screenshot({ path: screenshot });
  await page.waitForURL(expectedUrl);
  await loading.waitFor({ state: "detached", timeout: 10_000 });
  delayMs = 0;
  console.log(`${linkName}: skeleton shown, landed on ${new URL(page.url()).pathname}${new URL(page.url()).search}`);
}

const sidebar = page.getByRole("navigation", { name: "Workspace" });
const tabs = page.getByRole("navigation", { name: "Document filters" });

await switchView(sidebar, "Shared with me", "**/dashboard?view=shared", ".skeleton-sidebar.png");
await switchView(sidebar, "Documents", /\/dashboard$/, ".skeleton-sidebar-back.png");
await switchView(tabs, "Shared with me", "**/dashboard?view=shared", ".skeleton-tab.png");

// Clicking the tab that is already active must not start a navigation.
delayMs = 2500;
await tabs.getByRole("link", { name: /Shared with me/ }).click();
await page.waitForTimeout(400);
console.log("active-tab click showed skeleton:", await loading.isVisible());
console.log("url after active-tab click:", page.url());
delayMs = 0;

await browser.close();
