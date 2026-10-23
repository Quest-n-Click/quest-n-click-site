import Link from "next/link";
import { ENGINE_REPO_URL, ENGINE_WIKI_URL, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export function Footer({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return (
    <footer className="mt-24 border-t-2 border-line bg-paper-2">
      <div className="container-site grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="font-bold text-lg">
            quest<span className="text-sun">&#39;n&#39;</span>click
          </p>
          <p className="pixel mt-2 text-ink-3">{t.tagline}</p>
        </div>
        <ul className="space-y-1.5 text-ink-2">
          <li><Link className="hover:text-ink" href={href(locale, "/play")}>{t.nav.play}</Link></li>
          <li><Link className="hover:text-ink" href={href(locale, "/docs")}>{t.nav.docs}</Link></li>
          <li><Link className="hover:text-ink" href={href(locale, "/changelog")}>{t.nav.changelog}</Link></li>
          <li><a className="hover:text-ink" href={ENGINE_REPO_URL} rel="noopener">{t.nav.github}</a></li>
          <li><a className="hover:text-ink" href={ENGINE_WIKI_URL} rel="noopener">{t.nav.wiki}</a></li>
          <li><a className="hover:text-ink" href="https://github.com/wanoo/quest-n-click-site" rel="noopener">{t.footer.sourceSite}</a></li>
        </ul>
        <div className="space-y-2 text-sm text-ink-2 sm:text-right">
          <p>{t.footer.formerly}</p>
          <p>{t.footer.license}</p>
          <p>{t.footer.made}</p>
        </div>
      </div>
    </footer>
  );
}
