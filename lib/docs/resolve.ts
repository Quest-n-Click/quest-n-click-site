import "server-only";
import semver from "semver";
import { getDocsPublication, getReleases } from "@/lib/github";
import { ENGINE_REPO_URL } from "@/lib/i18n";
import type { DocsSource } from "./types";

export const DOCS_REVISION_TAG = /^docs-v(\d+\.\d+\.\d+)-r(\d+)$/;

function archiveName(version: string, revision: string) {
  return revision === "r1" ? `quest-n-click-docs-${version}.tar.gz` : `quest-n-click-docs-${version}-${revision}.tar.gz`;
}

function downloadUrl(tag: string, asset: string) {
  return `${ENGINE_REPO_URL}/releases/download/${tag}/${asset}`;
}

/**
 * The documentation to show: the publication record's `latest` when Pages serves it, else the highest stable
 * release that carries a docs archive, at its highest published revision (`docs-v<v>-r<n>` pre-releases).
 */
export async function resolveDocsSource(): Promise<DocsSource> {
  const publication = await getDocsPublication();
  if (publication?.latest) {
    const { version, revision, sha256 } = publication.latest;
    const rec = publication.versions[version]?.revisions[revision];
    const tag = rec?.tag ?? (revision === "r1" ? `v${version}` : `docs-v${version}-${revision}`);
    return { version, revision, tag, sha256, url: downloadUrl(tag, archiveName(version, revision)), via: "publication" };
  }

  const releases = await getReleases();
  if (!releases) throw new Error("GitHub releases are unreachable and no documentation is cached");

  const stable = releases
    .filter((r) => !r.prerelease && /^v\d+\.\d+\.\d+$/.test(r.tag_name))
    .filter((r) => r.assets.some((a) => a.name === archiveName(r.tag_name.slice(1), "r1")))
    .sort((a, b) => semver.rcompare(a.tag_name.slice(1), b.tag_name.slice(1)));
  const release = stable[0];
  if (!release) throw new Error("No release carries a documentation archive");
  const version = release.tag_name.slice(1);

  let revision = "r1";
  let tag = release.tag_name;
  for (const r of releases) {
    const m = DOCS_REVISION_TAG.exec(r.tag_name);
    if (!m || m[1] !== version) continue;
    const n = Number(m[2]);
    if (n > Number(revision.slice(1)) && r.assets.some((a) => a.name === archiveName(version, `r${n}`))) {
      revision = `r${n}`;
      tag = r.tag_name;
    }
  }
  const asset = archiveName(version, revision);
  const url =
    releases.find((r) => r.tag_name === tag)?.assets.find((a) => a.name === asset)?.browser_download_url ??
    downloadUrl(tag, asset);
  return { version, revision, tag, url, via: "releases" };
}
