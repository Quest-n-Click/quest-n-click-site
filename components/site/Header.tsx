import Image from "next/image";
import Link from "next/link";
import { ENGINE_REPO_URL, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { LangSwitch } from "./LangSwitch";
import { NavLinks } from "./NavLinks";

export function Header({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-paper/90 backdrop-blur">
      <div className="container-site flex h-16 items-center gap-4">
        <Link href={href(locale, "/")} className="flex items-center gap-2.5 shrink-0" aria-label={t.siteName}>
          <Image src="/brand/icon-512.png" alt="" width={32} height={32} className="rounded-[4px] hard" style={{ imageRendering: "pixelated" }} priority />
          <span className="font-bold text-lg tracking-tight">
            quest<span className="text-sun">&#39;n&#39;</span>click
          </span>
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavLinks locale={locale} />
          <a
            href={ENGINE_REPO_URL}
            className="hidden sm:inline-flex items-center rounded-[6px] px-3 py-1.5 font-medium text-ink-2 hover:text-ink"
            rel="noopener"
          >
            {t.nav.github}
          </a>
          <LangSwitch locale={locale} />
        </nav>
      </div>
    </header>
  );
}
