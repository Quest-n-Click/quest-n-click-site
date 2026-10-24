import Image from "next/image";
import Link from "next/link";
import { ENGINE_REPO_URL, ENGINE_WIKI_URL, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export function Footer({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return (
    <footer className="mt-20 border-t border-line">
      <div className="container-site grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <Image src="/brand/wordmark.png" alt="Quest'n'Click" width={1084} height={285} className="h-9 w-auto" sizes="200px" />
          <p className="mt-3 text-sm text-ink-3">{t.footer.license}</p>
          <p className="mt-1 max-w-[60ch] text-sm text-ink-3">{t.footer.formerly}</p>
          <p className="mt-1 text-sm text-ink-3">{t.footer.made}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2 sm:justify-end">
          <Link className="hover:text-ink" href={href(locale, "/play")}>{t.nav.play}</Link>
          <Link className="hover:text-ink" href={href(locale, "/docs")}>{t.nav.docs}</Link>
          <Link className="hover:text-ink" href={href(locale, "/changelog")}>{t.nav.changelog}</Link>
          <a className="hover:text-ink" href={ENGINE_REPO_URL} rel="noopener">{t.nav.github} ↗</a>
          <a className="hover:text-ink" href={ENGINE_WIKI_URL} rel="noopener">{t.nav.wiki} ↗</a>
          <a className="hover:text-ink" href="https://github.com/Quest-n-Click/quest-n-click-site" rel="noopener">{t.footer.sourceSite} ↗</a>
        </nav>
      </div>
    </footer>
  );
}
