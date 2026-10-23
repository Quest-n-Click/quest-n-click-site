import "server-only";
import type { Root as HastRoot } from "hast";
import { renderMarkdown } from "./docs/markdown";

export interface ChangelogSection {
  title: string;
  html: HastRoot;
}

export interface ChangelogVersion {
  version: string;
  date: string | null;
  anchor: string;
  intro: HastRoot | null;
  sections: ChangelogSection[];
}

const VERSION = /^## (\S+)(?:\s+[—–-]+\s+(\d{4}-\d{2}-\d{2}))?\s*$/;
const SECTION = /^### (.+?)\s*$/;

/** `CHANGELOG.md` → versions with their sections, each rendered with the docs pipeline. */
export async function parseChangelog(text: string, tag: string): Promise<ChangelogVersion[]> {
  const lines = text.split(/\r?\n/);
  type Draft = { version: string; date: string | null; intro: string[]; sections: { title: string; lines: string[] }[] };
  const drafts: Draft[] = [];
  let cur: Draft | null = null;
  let sec: { title: string; lines: string[] } | null = null;
  for (const line of lines) {
    let m = VERSION.exec(line);
    if (m) {
      cur = { version: m[1], date: m[2] ?? null, intro: [], sections: [] };
      sec = null;
      drafts.push(cur);
      continue;
    }
    if (!cur) continue;
    m = SECTION.exec(line);
    if (m) {
      sec = { title: m[1], lines: [] };
      cur.sections.push(sec);
      continue;
    }
    (sec ? sec.lines : cur.intro).push(line);
  }
  const opts = {
    lang: "en" as const,
    productCommit: tag,
    docsBase: "/docs",
    assetsBase: "/api/docs-assets",
    repoLinks: true,
  };
  return Promise.all(
    drafts.map(async (d) => ({
      version: d.version,
      date: d.date,
      anchor: `v${d.version.replace(/[^\w.-]/g, "-")}`,
      intro: d.intro.join("\n").trim() ? await renderMarkdown(d.intro.join("\n"), opts) : null,
      sections: await Promise.all(
        d.sections.map(async (s) => ({ title: s.title, html: await renderMarkdown(s.lines.join("\n"), opts) })),
      ),
    })),
  );
}
