#!/usr/bin/env node
// Screenshots of the main pages, light and dark, phone and desktop: `BASE_URL=http://localhost:3100 node scripts/screenshots.mjs out/`.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const out = process.argv[2] ?? "screenshots";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const pages = ["/", "/play", "/docs", "/docs/create.rooms", "/changelog", "/fr"];
for (const [name, viewport] of [["desktop", { width: 1280, height: 800 }], ["phone", { width: 390, height: 844 }]]) {
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport, colorScheme: scheme, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const p of pages) {
      await page.goto(base + p, { waitUntil: "networkidle" });
      const file = path.join(out, `${name}-${scheme}${p === "/" ? "-home" : p.replace(/\//g, "-")}.png`);
      await page.screenshot({ path: file, fullPage: p !== "/changelog" });
      console.log(file);
    }
    await ctx.close();
  }
}
await browser.close();
