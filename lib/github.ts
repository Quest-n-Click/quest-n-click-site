import "server-only";
import { z } from "zod";
import { clearMemo, memo } from "./memo";
import { ENGINE_REPO, PUBLICATION_URL } from "./i18n";

const API = "https://api.github.com";
const HOUR = 3600;

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "quest-n-click-site",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

/** The last value a fetch returned, kept so a GitHub outage degrades the page instead of breaking it. */
const lastGood = new Map<string, unknown>();

async function withLastGood<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const v = await fn();
    lastGood.set(key, v);
    return v;
  } catch (e) {
    console.warn(`[github] ${key}: ${(e as Error).message}`);
    return (lastGood.get(key) as T | undefined) ?? null;
  }
}

/**
 * The API answers are memoised in memory for an hour rather than in Next's data cache: the releases list weighs over
 * 2 MB (every release body), which that cache refuses, and a `no-store` fetch would make every page dynamic anyway.
 * `clearGithubMemo()` is the webhook's way to force a re-read.
 */
async function gh<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  return memo(`gh:${path}`, HOUR * 1000, async () => {
    const res = await fetch(`${API}${path}`, { headers: headers(), cache: "no-store" });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return schema.parse(await res.json());
  });
}

function raw(url: string): Promise<Response> {
  return fetch(url, { cache: "no-store", headers: { "User-Agent": "quest-n-click-site" } });
}

export function clearGithubMemo() {
  clearMemo("gh:");
  clearMemo("raw:");
  lastGood.clear();
}

const Asset = z.object({
  name: z.string(),
  browser_download_url: z.string(),
  size: z.number(),
});
export type ReleaseAsset = z.infer<typeof Asset>;

const Release = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.string(),
  published_at: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  body: z.string().nullable().optional(),
  assets: z.array(Asset),
});
export type Release = z.infer<typeof Release>;

const Repo = z.object({
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  pushed_at: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
});
export type RepoStats = z.infer<typeof Repo>;

export const DocsPublication = z.object({
  format: z.literal("quest-n-click-docs-publication"),
  version: z.number(),
  latest: z
    .object({
      version: z.string(),
      revision: z.string(),
      sha256: z.string(),
      date: z.string(),
      docRevision: z.string().optional(),
      buildId: z.string().optional(),
    })
    .nullable(),
  versions: z.record(
    z.string(),
    z.object({
      approved: z.string(),
      revisions: z.record(
        z.string(),
        z.object({ sha256: z.string(), tag: z.string(), date: z.string(), docRevision: z.string().optional() }),
      ),
    }),
  ),
});
export type DocsPublication = z.infer<typeof DocsPublication>;

/** The fifty most recent releases, drafts excluded. */
export function getReleases(): Promise<Release[] | null> {
  return withLastGood("releases", async () => {
    const list = await gh(`/repos/${ENGINE_REPO}/releases?per_page=50`, z.array(Release));
    return list.filter((r) => !r.draft).map((r) => ({ ...r, body: undefined }));
  });
}

export const VERSION_TAG = /^v(\d+\.\d+\.\d+)$/;

/** The latest stable product release (a `vX.Y.Z` tag, not a pre-release, not a `docs-v…` revision). */
export async function getLatestRelease(): Promise<Release | null> {
  const releases = await getReleases();
  if (!releases) return null;
  return releases.find((r) => !r.prerelease && VERSION_TAG.test(r.tag_name)) ?? null;
}

export function getRepoStats(): Promise<RepoStats | null> {
  return withLastGood("repo", () => gh(`/repos/${ENGINE_REPO}`, Repo));
}

/** The publication record of the documentation, once the engine's docs-publish has written it. */
export function getDocsPublication(): Promise<DocsPublication | null> {
  return withLastGood("publication", async () => {
    return memo("raw:publication", HOUR * 1000, async () => {
      const res = await raw(PUBLICATION_URL);
      if (res.status === 404) throw new Error("publication.json is not published yet");
      if (!res.ok) throw new Error(`publication.json → ${res.status}`);
      return DocsPublication.parse(await res.json());
    });
  });
}

/** CHANGELOG.md as the given tag (or branch) holds it. */
export function getChangelogText(ref: string): Promise<string | null> {
  return withLastGood(`changelog:${ref}`, async () => {
    return memo(`raw:changelog:${ref}`, HOUR * 1000, async () => {
      const res = await raw(`https://raw.githubusercontent.com/${ENGINE_REPO}/${ref}/CHANGELOG.md`);
      if (!res.ok) throw new Error(`CHANGELOG.md@${ref} → ${res.status}`);
      return res.text();
    });
  });
}

/** README.md of the tag: the "In numbers" figures live in `<!-- metric:x -->N<!-- /metric -->` markers. */
export function getReadmeMetrics(ref: string): Promise<Record<string, string> | null> {
  return withLastGood(`metrics:${ref}`, async () => {
    return memo(`raw:metrics:${ref}`, HOUR * 1000, async () => {
      const res = await raw(`https://raw.githubusercontent.com/${ENGINE_REPO}/${ref}/README.md`);
      if (!res.ok) throw new Error(`README.md@${ref} → ${res.status}`);
      const text = await res.text();
      const out: Record<string, string> = {};
      for (const m of text.matchAll(/<!-- metric:([\w-]+) -->([^<]*)<!-- \/metric -->/g)) out[m[1]] = m[2].trim();
      return out;
    });
  });
}
