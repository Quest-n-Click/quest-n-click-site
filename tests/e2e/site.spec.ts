import { expect, test } from "@playwright/test";

test("the home page, in English and in French", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("first small game");
  await expect(page.getByRole("link", { name: /first-room guide/ })).toHaveAttribute("href", "/docs/create.first-game");
  await expect(page.getByRole("link", { name: /Play an example/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /Pantry Key/ })).toBeVisible();
  await expect(page.locator("[data-latest]")).toHaveAttribute("data-latest", /\d+\.\d+\.\d+/);
  await page.goto("/fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("premier petit jeu");
  await expect(page.getByRole("link", { name: /Jouer à un exemple/ })).toBeVisible();
});

test("the home sections: Studio steps, assistant examples, the technical details", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /Test your puzzle/ }).click();
  await expect(page.getByRole("tab", { name: /Test your puzzle/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("img", { name: /winning path/ })).toBeVisible();
  await page.getByRole("button", { name: /See the whole screen/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("[data-ai-flow]")).toContainText("Someday I will check");
  await page.getByRole("tab", { name: "Puzzles", exact: true }).click();
  await expect(page.getByText(/Suggest a puzzle in the garden/)).toBeVisible();
  await page.getByText("And the technical side?").click();
  await expect(page.locator("pre.shiki").first()).toBeVisible();
  await page.getByRole("button", { name: /Explore the places/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("the menu on a phone-sized screen", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the menu button shows on small screens only");
  await page.goto("/docs");
  await page.getByRole("button", { name: /Open the menu/ }).click();
  await page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Play" }).click();
  await expect(page).toHaveURL(/\/play$/);
});

test("the theme toggle keeps the visitor's choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.locator("[data-theme-toggle]:visible").first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator("[data-theme-toggle]:visible").first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("/en redirects to the root", async ({ page }) => {
  const res = await page.goto("/en/play");
  expect(res?.url()).toMatch(/\/play$/);
});

test("the play page shows the game behind a still", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("heading", { level: 1, name: /Play/ })).toBeVisible();
  await page.getByRole("button", { name: /Press play/ }).first().click();
  await expect(page.locator("iframe[title='The Pantry Key']")).toHaveAttribute("src", /^\/demo\/\?lang=en$/);
});

test("a docs page renders the wiki's markers", async ({ page }) => {
  await page.goto("/docs/bridge.guarantees");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-claim='guarantee']").first()).toBeVisible();
  await expect(page.locator("[data-docs-version]")).toHaveText(/\d+\.\d+\.\d+/);
  await page.goto("/docs/create.rooms");
  await expect(page.locator("pre.shiki").first()).toBeVisible();
  const twin = page.getByRole("link", { name: "Cette page en français" });
  await expect(twin).toHaveAttribute("href", "/fr/docs/create.rooms");
  await twin.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Salles");
});

test("the docs search finds a page", async ({ page }) => {
  await page.goto("/docs");
  await page.locator("[data-search-button]:visible").first().click();
  await page.getByPlaceholder("Search the documentation").fill("solver");
  const hit = page.getByRole("option", { name: /solver/i }).first();
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(page).toHaveURL(/\/docs\/create\.solver/);
});

test("the changelog shows the latest version first", async ({ page }) => {
  await page.goto("/changelog");
  const first = page.locator("h2[data-version]").first();
  await expect(first).toHaveText(/^\d+\.\d+\.\d+/);
  await expect(page.getByText("latest", { exact: true })).toBeVisible();
});

// The demo is the engine release's web archive, served by the site (lib/demo/store.ts). CI gives it a local folder
// (QNC_DEMO_SOURCE) when one is at hand; without it there is nothing to play yet.
test("the demo and the Studio demo are served under /demo/", async ({ page, request }) => {
  test.skip(!process.env.QNC_DEMO_SOURCE, "no demo folder given (QNC_DEMO_SOURCE)");
  const game = await request.get("/demo/");
  expect(game.status()).toBe(200);
  expect(game.headers()["content-type"]).toContain("text/html");
  expect((await request.get("/demo/studio.html")).status()).toBe(200);
  expect((await request.get("/demo/sw.js")).headers()["content-type"]).toContain("javascript");
  expect((await request.get("/demo/../package.json")).status()).not.toBe(200);
  await page.goto("/demo/");
  await expect(page.locator("canvas, #app, main").first()).toBeVisible();
});
