import "server-only";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import semver from "semver";
import { x as extract } from "tar";
import { getReleases } from "@/lib/github";

/**
 * The demo the site serves at /demo/: the sample game and the Studio demo, built by the engine's release for that
 * base path (`quest-n-click-v<version>-web.tar.gz`, from 4.5.2). The archive is taken from the latest stable release
 * that carries one, checked against that release's SHA256SUMS before a byte of it is served, and kept on disk.
 * `QNC_DEMO_SOURCE` serves an extracted folder instead (development, tests).
 */
export interface DemoSource {
  version: string;
  tag: string;
  url: string;
  sha256: string;
}
export interface Demo {
  source: DemoSource | { version: string; tag: string; url: string; sha256?: undefined };
  root: string;
}

interface Global {
  __qncDemo?: Promise<Demo | null>;
  __qncDemoCheckedAt?: number;
}
const g = globalThis as unknown as Global;

const CACHE_ROOT = process.env.QNC_DEMO_CACHE ?? path.join(process.cwd(), ".cache", "qnc-demo");
const CHECK_EVERY = 60 * 60 * 1000;
const webAsset = (v: string) => `quest-n-click-v${v}-web.tar.gz`;
const sumsAsset = (v: string) => `quest-n-click-v${v}-SHA256SUMS`;

/** The latest stable release carrying a web archive and its sums, or null when none does yet. */
export async function resolveDemoSource(): Promise<DemoSource | null> {
  const releases = await getReleases();
  if (!releases) throw new Error("GitHub releases are unreachable and no demo is cached");
  const release = releases
    .filter((r) => !r.prerelease && /^v\d+\.\d+\.\d+$/.test(r.tag_name))
    .filter((r) => {
      const v = r.tag_name.slice(1);
      return r.assets.some((a) => a.name === webAsset(v)) && r.assets.some((a) => a.name === sumsAsset(v));
    })
    .sort((a, b) => semver.rcompare(a.tag_name.slice(1), b.tag_name.slice(1)))[0];
  if (!release) return null;
  const version = release.tag_name.slice(1);
  const url = (name: string) => release.assets.find((a) => a.name === name)!.browser_download_url;
  const res = await fetch(url(sumsAsset(version)), { cache: "no-store", redirect: "follow" });
  if (!res.ok) throw new Error(`GET ${sumsAsset(version)} → ${res.status}`);
  const line = (await res.text()).split("\n").find((l) => l.trim().endsWith(` ${webAsset(version)}`) || l.trim().endsWith(`*${webAsset(version)}`));
  const sha256 = line?.trim().split(/\s+/)[0];
  if (!sha256 || !/^[0-9a-f]{64}$/.test(sha256)) throw new Error(`${sumsAsset(version)} does not list ${webAsset(version)}`);
  return { version, tag: release.tag_name, url: url(webAsset(version)), sha256 };
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
  if (sum !== source.sha256) {
    await rm(tmp, { recursive: true, force: true });
    throw new Error(`demo archive sha256 ${sum} differs from the release's SHA256SUMS (${source.sha256})`);
  }
  await writeFile(path.join(tmp, ".source.json"), JSON.stringify(source, null, 2));
  await rm(dir, { recursive: true, force: true });
  await rename(tmp, dir);
}

async function load(source: DemoSource): Promise<Demo> {
  const dir = path.join(/* turbopackIgnore: true */ CACHE_ROOT, source.version);
  const known = existsSync(path.join(dir, ".source.json"))
    ? (JSON.parse(await readFile(path.join(dir, ".source.json"), "utf8")) as DemoSource)
    : null;
  if (known?.sha256 !== source.sha256) {
    console.info(`[demo] downloading ${source.url}`);
    await download(source, dir);
  }
  console.info(`[demo] ${source.version} served from ${dir}`);
  return { source, root: dir };
}

/** The demo, loaded on first use; null while no release carries a web archive. A failure is retried next time. */
export function getDemo(): Promise<Demo | null> {
  const local = process.env.QNC_DEMO_SOURCE;
  if (!g.__qncDemo) {
    g.__qncDemo = (
      local
        ? Promise.resolve({ source: { version: "local", tag: "local", url: `file://${path.resolve(local)}` }, root: path.resolve(local) })
        : resolveDemoSource().then((s) => (s ? load(s) : null))
    ).catch((e) => {
      g.__qncDemo = undefined;
      throw e;
    });
    g.__qncDemoCheckedAt = Date.now();
  } else if (!local && Date.now() - (g.__qncDemoCheckedAt ?? 0) > CHECK_EVERY) {
    g.__qncDemoCheckedAt = Date.now();
    void refreshDemo().catch((e) => console.warn(`[demo] refresh: ${(e as Error).message}`));
  }
  return g.__qncDemo;
}

/** Resolve again and swap the demo when the release changed (the webhook, and once an hour). */
export async function refreshDemo(): Promise<{ changed: boolean; version: string | null }> {
  if (process.env.QNC_DEMO_SOURCE) return { changed: false, version: "local" };
  const next = await resolveDemoSource();
  const current = g.__qncDemo ? await g.__qncDemo.catch(() => null) : null;
  if (!next) return { changed: false, version: current?.source.version ?? null };
  if (current && current.source.sha256 === next.sha256) return { changed: false, version: next.version };
  const demo = await load(next);
  g.__qncDemo = Promise.resolve(demo);
  g.__qncDemoCheckedAt = Date.now();
  return { changed: true, version: demo.source.version };
}
