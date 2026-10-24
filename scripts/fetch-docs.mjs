#!/usr/bin/env node
// Download the latest documentation archive into .cache/qnc-docs/<version>-r<n>/ and print the directory, so
// `QNC_DOCS_SOURCE=$(npm run -s docs:fetch) npm run dev` works offline afterwards.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { x } from "tar";

const REPO = "Quest-n-Click/quest-n-click";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "quest-n-click-site" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const releases = await (await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=50`, { headers })).json();
const stable = releases
  .filter((r) => !r.draft && !r.prerelease && /^v\d+\.\d+\.\d+$/.test(r.tag_name))
  .filter((r) => r.assets.some((a) => a.name === `quest-n-click-docs-${r.tag_name.slice(1)}.tar.gz`))
  .sort((a, b) => (a.tag_name < b.tag_name ? 1 : -1));
const release = stable[0];
if (!release) throw new Error("no release carries a docs archive");
const version = release.tag_name.slice(1);
let revision = "r1";
let url = release.assets.find((a) => a.name === `quest-n-click-docs-${version}.tar.gz`).browser_download_url;
for (const r of releases) {
  const m = /^docs-v(\d+\.\d+\.\d+)-r(\d+)$/.exec(r.tag_name);
  if (!m || m[1] !== version || Number(m[2]) <= Number(revision.slice(1))) continue;
  const a = r.assets.find((a) => a.name === `quest-n-click-docs-${version}-r${m[2]}.tar.gz`);
  if (a) {
    revision = `r${m[2]}`;
    url = a.browser_download_url;
  }
}
const dir = path.resolve(".cache/qnc-docs", `${version}-${revision}`);
if (!existsSync(path.join(dir, "index.json"))) {
  console.error(`downloading ${url}`);
  const tmp = `${dir}.part`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const hash = createHash("sha256");
  const tap = new Transform({ transform(c, _e, cb) { hash.update(c); cb(null, c); } });
  await pipeline(Readable.fromWeb(res.body), tap, x({ C: tmp, filter: (p) => /^(\.\/)?(index\.json|bundle-manifest\.json|md\/|assets\/)/.test(p) }));
  await writeFile(path.join(tmp, "source.json"), JSON.stringify({ version, revision, tag: release.tag_name, url, sha256: hash.digest("hex"), via: "script" }, null, 2));
  await rm(dir, { recursive: true, force: true });
  await rename(tmp, dir);
}
console.log(dir);
