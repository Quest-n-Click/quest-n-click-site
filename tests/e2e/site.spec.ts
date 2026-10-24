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

test("the demo is served at /demo/ from the release's web archive", async ({ request }) => {
  const root = await request.get("/demo/");
  expect(root.status()).toBe(200);
  expect(await root.text()).toContain("The Pantry Key (fixture)");
  const studio = await request.get("/demo/studio.html");
  expect(studio.status()).toBe(200);
  expect(await studio.text()).toContain("Studio demo (fixture)");
  const asset = await request.get("/demo/assets/index-abcdef12.js");
  expect(asset.headers()["cache-control"]).toContain("immutable");
  const sw = await request.get("/demo/sw.js");
  expect(sw.headers()["content-type"]).toContain("javascript");
  expect(sw.headers()["cache-control"]).toBe("no-cache");
  const bare = await request.get("/demo", { maxRedirects: 0 });
  expect(bare.status()).toBe(308);
  expect(bare.headers().location).toMatch(/\/demo\/$/);
  expect((await request.get("/demo/nothing.js")).status()).toBe(404);
});

test("/en redirects to the root", async ({ page }) => {
  const res = await page.goto("/en/play");
  expect(res?.url()).toMatch(/\/play$/);
});

test("the play page shows the game behind a still", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("heading", { level: 1, name: /Play/ })).toBeVisible();
  await page.getByRole("button", { name: /Press play/ }).first().click();
  await expect(page.locator("iframe[title='The Pantry Key']")).toHaveAttribute("src", /\/demo\/\?lang=en$/);
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
