import type { Locale } from "@/lib/i18n";

export const DOMAINS = [
  "start",
  "install",
  "play",
  "create",
  "studio",
  "team",
  "bridge",
  "clever",
  "engine",
  "reference",
  "contribute",
  "index",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const TYPES = ["tutorial", "howto", "explanation", "reference", "troubleshooting", "index"] as const;
export type PageType = (typeof TYPES)[number];

export interface Section {
  id: string;
  title: string;
  sha256?: string;
}

export interface PageLang {
  file: string;
  sha256: string;
  sections: Section[];
}

export interface PageMeta {
  id: string;
  domain: Domain | string;
  type: PageType | string;
  alsoTypes?: string[];
  audience: string[];
  context: string[];
  versions?: { appliesFrom?: string; appliesTo?: string };
  state: "ready" | "planned" | string;
  title: Record<Locale, string>;
  url: Record<Locale, string>;
  questions: Record<Locale, string[]>;
  aliases: Record<Locale, string[]>;
  keywords: Record<Locale, string[]>;
  identifiers: string[];
  related?: string[];
  prerequisites?: string[];
  langs: Partial<Record<Locale, PageLang>>;
}

export interface GlossaryEntry {
  id: string;
  en: { term: string; synonyms: string[] };
  fr: { term: string; synonyms: string[] };
  pages: string[];
}

export interface DocsIndex {
  format: "quest-n-click-docs-index";
  version: number;
  pages: PageMeta[];
  glossary: GlossaryEntry[];
  legacy: Record<string, string[]>;
}

export interface BundleManifest {
  format: "quest-n-click-docs-bundle";
  version: number;
  productVersion: string;
  productCommit: string;
  docRevision: string;
  buildId?: string;
  docRevisionNumber?: string;
  files: { path: string; sha256: string; bytes: number }[];
}

/** Where the current documentation comes from. */
export interface DocsSource {
  version: string;
  /** "r1", "r2", … */
  revision: string;
  /** The release tag that carries the archive. */
  tag: string;
  url: string;
  sha256?: string;
  /** How the source was found: the publication record, the releases list, or a local directory. */
  via: "publication" | "releases" | "local";
}
