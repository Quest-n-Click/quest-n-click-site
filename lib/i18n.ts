export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

/** The public path of a page: EN at the root, FR under /fr. */
export function href(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean === "/" ? "/" : clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "fr" : "en";
}

export const SITE_URL = process.env.SITE_URL ?? "https://quest-n-click.cleverapps.io";
export const ENGINE_REPO = "Quest-n-Click/quest-n-click";
export const ENGINE_REPO_URL = `https://github.com/${ENGINE_REPO}`;
export const ENGINE_WIKI_URL = `${ENGINE_REPO_URL}/wiki`;
/** The sample game and the Studio demo, served by this site from the engine release's web archive (app/demo). */
export const GAME_URL = "/demo/";
export const STUDIO_URL = "/demo/studio.html";
/** The documentation's publication record, kept in the engine wiki's repository. */
export const PUBLICATION_URL = `https://raw.githubusercontent.com/wiki/${ENGINE_REPO}/publication.json`;
