import "server-only";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import semver from "semver";
import { x as extract } from "tar";
import { getReleases, VERSION_TAG, type Release } from "@/lib/github";

/**
 * The demo (D52 of the engine): each release from 4.5.2 carries `quest-n-click-v<version>-web.tar.gz`, the game and
 * the Studio's demo built for the base path `/demo/`. The site downloads the latest one, checks its sha256 against the
 * release's SHA256SUMS and serves it at `/demo/`. Releases before 4.5.2 have no such file.
 */
export interface DemoSource {
  version: string;
  tag: string;
  url: string;
  sha256: string | null;
  via: "releases" | "fallback" | "local";
}

/**
 * Until a release carries the web archive, `QNC_DEMO_FALLBACK_URL` (and its `QNC_DEMO_FALLBACK_SHA256`) can name one
 * built elsewhere, such as the site's own `demo-preview` release. A release's archive always wins over it.
 */
function fallbackSource(): DemoSource | null {
  const url = process.env.QNC_DEMO_FALLBACK_URL;
  if (!url) return null;
  const version = process.env.QNC_DEMO_FALLBACK_VERSION ?? "preview";
  return { version, tag: version, url, sha256: process.env.QNC_DEMO_FALLBACK_SHA256 ?? null, via: "fallback" };
}

export interface DemoStore {
  source: DemoSource;
  root: string;
  loadedAt: number;
}

interface Global {
  __qncDemo?: Promise<DemoStore | null>;
  __qncDemoCheckedAt?: number;
}
const g = globalThis as unknown as Global;

const CACHE_ROOT = process.env.QNC_DEMO_CACHE ?? path.join(process.cwd(), ".cache", "qnc-demo");
const CHECK_EVERY = 60 * 60 * 1000;

function webAsset(r: Release) {
  return r.assets.find((a) => a.name === `quest-n-click-${r.tag_name}-web.tar.gz`) ?? null;
}

/** The latest stable release that carries a web archive, with the sum the release published for it. */
export async function resolveDemoSource(): Promise<DemoSource | null> {
  const releases = await getReleases();
  if (!releases) throw new Error("GitHub releases are unreachable");
  const candidates = releases
    .filter((r) => !r.prerelease && VERSION_TAG.test(r.tag_name) && webAsset(r))
    .sort((a, b) => semver.rcompare(a.tag_name.slice(1), b.tag_name.slice(1)));
  const release = candidates[0];
  if (!release) return fallbackSource();
  const asset = webAsset(release)!;
  let sha256: string | null = null;
  const sums = release.assets.find((a) => a.name === `quest-n-click-${release.tag_name}-SHA256SUMS`);
  if (sums) {
    try {
      const text = await (await fetch(sums.browser_download_url, { cache: "no-store" })).text();
      const line = text.split(/\r?\n/).find((l) => l.trim().endsWith(`  ${asset.name}`));
      sha256 = line ? line.trim().split(/\s+/)[0] : null;
    } catch (e) {
      console.warn(`[demo] SHA256SUMS unreadable: ${(e as Error).message}`);
    }
  }
  return { version: release.tag_name.slice(1), tag: release.tag_name, url: asset.browser_download_url, sha256, via: "releases" };
}

async function download(source: DemoSource, dir: string) {
  const tmp = `${dir}.part`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  const res = await fetch(source.url, { cache: "no-store", redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`GET ${source.url} → ${res.status}`);
  const hash = createHash("sha256");
  const tap = new Transform({
    transform(chunk, _enc, cb) {
      hash.update(chunk);
      cb(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), tap, extract({ C: tmp }));
  const sum = hash.digest("hex");
  if (source.sha256 && source.sha256 !== sum) {
    await rm(tmp, { recursive: true, force: true });
    throw new Error(`web archive sha256 ${sum} differs from the published ${source.sha256}`);
  }
  if (!source.sha256) console.warn("[demo] no SHA256SUMS line for the web archive: served unchecked");
  await writeFile(path.join(tmp, "source.json"), JSON.stringify({ ...source, sha256: sum }, null, 2));
  await rm(dir, { recursive: true, force: true });
  await rename(tmp, dir);
}

async function loadFromSource(source: DemoSource): Promise<DemoStore> {
  const dir = path.join(CACHE_ROOT, source.version);
  if (!existsSync(path.join(dir, "index.html"))) {
    console.info(`[demo] downloading ${source.url}`);
    await download(source, dir);
  }
  console.info(`[demo] ${source.version} served from ${dir}`);
  return { source, root: dir, loadedAt: Date.now() };
}

async function loadLocal(dir: string): Promise<DemoStore> {
  await stat(path.join(dir, "index.html"));
  let version = "local";
  try {
    version = JSON.parse(await readFile(path.join(dir, "site.json"), "utf8")).version ?? version;
  } catch {
    /* no site.json: fine */
  }
  return { source: { version, tag: version, url: `file://${dir}`, sha256: null, via: "local" }, root: dir, loadedAt: Date.now() };
}

/** The demo, loaded on first use; `null` when no release carries a web archive yet. A failure is retried next time. */
export function getDemo(): Promise<DemoStore | null> {
  if (!g.__qncDemo) {
    const local = process.env.QNC_DEMO_SOURCE;
    g.__qncDemo = (local
      ? loadLocal(path.resolve(local))
      : resolveDemoSource().then((s) => (s ? loadFromSource(s) : null))
    ).catch((e) => {
      g.__qncDemo = undefined;
      throw e;
    });
    g.__qncDemoCheckedAt = Date.now();
  } else if (!process.env.QNC_DEMO_SOURCE && Date.now() - (g.__qncDemoCheckedAt ?? 0) > CHECK_EVERY) {
    g.__qncDemoCheckedAt = Date.now();
    void refreshDemo().catch((e) => console.warn(`[demo] refresh: ${(e as Error).message}`));
  }
  return g.__qncDemo;
}

/** Resolve again and swap the demo when a newer release carries one. */
export async function refreshDemo(): Promise<{ changed: boolean; source: DemoSource | null }> {
  if (process.env.QNC_DEMO_SOURCE) {
    const d = await getDemo();
    return { changed: false, source: d?.source ?? null };
  }
  const next = await resolveDemoSource();
  const current = g.__qncDemo ? await g.__qncDemo.catch(() => null) : null;
  if (!next) return { changed: false, source: current?.source ?? null };
  if (current && current.source.version === next.version) return { changed: false, source: current.source };
  const store = await loadFromSource(next);
  g.__qncDemo = Promise.resolve(store);
  g.__qncDemoCheckedAt = Date.now();
  return { changed: true, source: store.source };
}

/** Whether the site serves the demo itself; the pages link to `/demo/` then, to GitHub Pages otherwise. */
export async function demoAvailable(): Promise<boolean> {
  try {
    return (await getDemo()) !== null;
  } catch {
    return false;
  }
}
