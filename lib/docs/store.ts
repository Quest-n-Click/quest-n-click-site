import "server-only";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";
import path from "node:path";
import { x as extract } from "tar";
import MiniSearch from "minisearch";
import type { Root as HastRoot } from "hast";
import type { Locale } from "@/lib/i18n";
import { LOCALES, href } from "@/lib/i18n";
import { renderMarkdown, markdownText } from "./markdown";
import { resolveDocsSource } from "./resolve";
import { SEARCH_OPTIONS, type SearchDoc } from "./search-options";
import { DOMAINS, TYPES, type BundleManifest, type DocsIndex, type DocsSource, type PageMeta } from "./types";

export interface DocsStore {
  source: DocsSource;
  manifest: BundleManifest;
  index: DocsIndex;
  root: string;
  byId: Map<string, PageMeta>;
  /** Every ready page in sidebar order. */
  order: PageMeta[];
  loadedAt: number;
  markdown(lang: Locale, id: string): Promise<string | null>;
  html(lang: Locale, id: string): Promise<HastRoot | null>;
  excerpt(lang: Locale, id: string): Promise<string>;
  searchIndex(lang: Locale): Promise<string>;
}

interface Global {
  __qncDocs?: Promise<DocsStore>;
  __qncDocsCheckedAt?: number;
}
const g = globalThis as unknown as Global;

const CACHE_ROOT = process.env.QNC_DOCS_CACHE ?? path.join(process.cwd(), ".cache", "qnc-docs");
const CHECK_EVERY = 60 * 60 * 1000;

function domainRank(d: string) {
  const i = (DOMAINS as readonly string[]).indexOf(d);
  return i < 0 ? DOMAINS.length : i;
}
function typeRank(t: string) {
  const i = (TYPES as readonly string[]).indexOf(t);
  return i < 0 ? TYPES.length : i;
}

async function buildStore(root: string, source: DocsSource): Promise<DocsStore> {
  const index = JSON.parse(await readFile(path.join(root, "index.json"), "utf8")) as DocsIndex;
  const manifest = JSON.parse(await readFile(path.join(root, "bundle-manifest.json"), "utf8")) as BundleManifest;
  if (index.format !== "quest-n-click-docs-index") throw new Error(`unexpected index format ${index.format}`);
  const ready = index.pages.filter((p) => p.state === "ready");
  const byId = new Map(ready.map((p) => [p.id, p]));
  const order = [...ready].sort(
    (a, b) =>
      domainRank(a.domain) - domainRank(b.domain) ||
      typeRank(a.type) - typeRank(b.type) ||
      a.title.en.localeCompare(b.title.en),
  );
  const md = new Map<string, Promise<string | null>>();
  const rendered = new Map<string, Promise<HastRoot | null>>();
  const excerpts = new Map<string, Promise<string>>();
  const indexes = new Map<Locale, Promise<string>>();

  const markdown = (lang: Locale, id: string) => {
    const key = `${lang}/${id}`;
    let p = md.get(key);
    if (!p) {
      p = (async () => {
        const meta = byId.get(id);
        const file = meta?.langs[lang]?.file;
        if (!file) return null;
        return readFile(path.join(root, file), "utf8");
      })();
      md.set(key, p);
    }
    return p;
  };

  const html = (lang: Locale, id: string) => {
    const key = `${lang}/${id}`;
    let p = rendered.get(key);
    if (!p) {
      p = (async () => {
        const text = await markdown(lang, id);
        if (text === null) return null;
        return renderMarkdown(text, {
          lang,
          productCommit: manifest.productCommit,
          dropTitle: true,
          docsBase: href(lang, "/docs"),
          assetsBase: "/api/docs-assets",
        });
      })();
      rendered.set(key, p);
    }
    return p;
  };

  const excerpt = (lang: Locale, id: string) => {
    const key = `${lang}/${id}`;
    let p = excerpts.get(key);
    if (!p) {
      p = markdown(lang, id).then((t) => (t ? markdownText(t.replace(/^# .*\n/, "")) : ""));
      excerpts.set(key, p);
    }
    return p;
  };

  const searchIndex = (lang: Locale) => {
    let p = indexes.get(lang);
    if (!p) {
      p = (async () => {
        const ms = new MiniSearch<SearchDoc>(SEARCH_OPTIONS);
        const docs: SearchDoc[] = [];
        for (const page of order) {
          const l = page.langs[lang];
          if (!l) continue;
          docs.push({
            id: page.id,
            title: page.title[lang],
            domain: page.domain,
            type: page.type,
            questions: page.questions[lang]?.join(" \n ") ?? "",
            aliases: page.aliases[lang]?.join(" \n ") ?? "",
            keywords: page.keywords[lang]?.join(" ") ?? "",
            sections: l.sections.map((s) => s.title).join(" \n "),
            identifiers: page.identifiers.join(" "),
          });
        }
        ms.addAll(docs);
        return JSON.stringify(ms.toJSON());
      })();
      indexes.set(lang, p);
    }
    return p;
  };

  return { source, manifest, index, root, byId, order, loadedAt: Date.now(), markdown, html, excerpt, searchIndex };
}

/** Download the archive into `dir`, keeping only what the site reads, and check its sha256 when known. */
async function download(source: DocsSource, dir: string) {
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
  await pipeline(
    Readable.fromWeb(res.body as import("node:stream/web").ReadableStream),
    tap,
    extract({
      C: tmp,
      filter: (p) => /^(\.\/)?(index\.json|bundle-manifest\.json|md\/|assets\/)/.test(p),
    }),
  );
  const sum = hash.digest("hex");
  if (source.sha256 && source.sha256 !== sum) {
    await rm(tmp, { recursive: true, force: true });
    throw new Error(`archive sha256 ${sum} differs from the published ${source.sha256}`);
  }
  await writeFile(path.join(tmp, "source.json"), JSON.stringify({ ...source, sha256: sum }, null, 2));
  await rm(dir, { recursive: true, force: true });
  await rename(tmp, dir);
}

async function loadFromSource(source: DocsSource): Promise<DocsStore> {
  const dir = path.join(CACHE_ROOT, `${source.version}-${source.revision}`);
  if (!existsSync(path.join(dir, "index.json"))) {
    console.info(`[docs] downloading ${source.url}`);
    await download(source, dir);
  }
  const store = await buildStore(dir, source);
  console.info(`[docs] ${source.version} ${source.revision} loaded from ${dir} (${source.via})`);
  return store;
}

async function loadLocal(dir: string): Promise<DocsStore> {
  const manifest = JSON.parse(await readFile(path.join(dir, "bundle-manifest.json"), "utf8")) as BundleManifest;
  const source: DocsSource = {
    version: manifest.productVersion,
    revision: manifest.docRevisionNumber ?? "r1",
    tag: `v${manifest.productVersion}`,
    url: `file://${dir}`,
    via: "local",
  };
  return buildStore(dir, source);
}

/** The documentation, loaded on first use. A failure is not memoised, so the next request tries again. */
export function getDocs(): Promise<DocsStore> {
  if (!g.__qncDocs) {
    const local = process.env.QNC_DOCS_SOURCE;
    g.__qncDocs = (local ? loadLocal(path.resolve(local)) : resolveDocsSource().then(loadFromSource)).catch((e) => {
      g.__qncDocs = undefined;
      throw e;
    });
    g.__qncDocsCheckedAt = Date.now();
  } else if (!process.env.QNC_DOCS_SOURCE && Date.now() - (g.__qncDocsCheckedAt ?? 0) > CHECK_EVERY) {
    // Safety net behind the webhook: once an hour, see whether a newer archive exists.
    g.__qncDocsCheckedAt = Date.now();
    void refreshDocs().catch((e) => console.warn(`[docs] refresh: ${(e as Error).message}`));
  }
  return g.__qncDocs;
}

/** Resolve again and swap the store when the version or the revision changed. Returns what is loaded. */
export async function refreshDocs(): Promise<{ changed: boolean; source: DocsSource }> {
  if (process.env.QNC_DOCS_SOURCE) {
    const s = await getDocs();
    return { changed: false, source: s.source };
  }
  const next = await resolveDocsSource();
  const current = g.__qncDocs ? await g.__qncDocs.catch(() => null) : null;
  if (current && current.source.version === next.version && current.source.revision === next.revision) {
    return { changed: false, source: current.source };
  }
  const store = await loadFromSource(next);
  g.__qncDocs = Promise.resolve(store);
  g.__qncDocsCheckedAt = Date.now();
  return { changed: true, source: store.source };
}

/** The pages of one language in sidebar order, grouped by domain. */
export function groupByDomain(order: PageMeta[], lang: Locale): { domain: string; pages: PageMeta[] }[] {
  const groups = new Map<string, PageMeta[]>();
  for (const p of order) {
    if (!p.langs[lang]) continue;
    const list = groups.get(p.domain) ?? [];
    list.push(p);
    groups.set(p.domain, list);
  }
  // Within a domain: tutorials first, then by title in the reader's language.
  return [...groups].map(([domain, pages]) => ({
    domain,
    pages: [...pages].sort((a, b) => typeRank(a.type) - typeRank(b.type) || a.title[lang].localeCompare(b.title[lang], lang)),
  }));
}

export function pageExists(store: DocsStore, lang: Locale, id: string): boolean {
  return Boolean(store.byId.get(id)?.langs[lang]);
}

export { LOCALES };
