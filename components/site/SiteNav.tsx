"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ENGINE_REPO_URL, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { LangSwitch } from "./LangSwitch";

/** The main navigation: anchors of the home page, the pages, GitHub and the language. A menu on small screens. */
export function SiteNav({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const home = href(locale, "/");
  const onHome = pathname === home || pathname === `${home}/`;
  const anchors: [string, string][] = [[`${onHome ? "" : home}#studio`, t.nav.create]];
  const pages: [string, string][] = [
    [href(locale, "/play"), t.nav.play],
    [href(locale, "/docs"), t.nav.docs],
  ];
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const item = (to: string, label: string, active: boolean) => (
    <Link
      key={to}
      href={to}
      aria-current={active ? "page" : undefined}
      onClick={() => setOpen(false)}
      className={`rounded-[4px] px-2.5 py-1.5 text-[0.95rem] ${active ? "bg-paper-3 text-ink" : "text-ink-2 hover:text-ink"}`}
    >
      {label}
    </Link>
  );
  return (
    <>
      <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
        {anchors.map(([to, label]) => item(to, label, false))}
        {pages.map(([to, label]) => item(to, label, pathname === to || pathname.startsWith(`${to}/`)))}
        <a href={ENGINE_REPO_URL} rel="noopener" className="ml-1 rounded-[4px] border border-line px-3 py-1.5 text-[0.9rem] text-ink-2 hover:border-sun hover:text-ink">
          {t.nav.github} ↗
        </a>
        <LangSwitch locale={locale} />
      </nav>
      <div className="ml-auto flex items-center gap-2 lg:hidden">
        <LangSwitch locale={locale} />
        <button
          ref={button}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          className="flex size-10 items-center justify-center rounded-[4px] border border-line text-sun"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" aria-label={t.nav.menu} className="absolute inset-x-0 top-full grid gap-1 border-b border-line bg-paper px-4 py-4 lg:hidden">
          {anchors.map(([to, label]) => item(to, label, false))}
          {pages.map(([to, label]) => item(to, label, pathname === to || pathname.startsWith(`${to}/`)))}
          <a href={ENGINE_REPO_URL} rel="noopener" className="rounded-[4px] px-2.5 py-1.5 text-ink-2 hover:text-ink">
            {t.nav.github} ↗
          </a>
        </nav>
      ) : null}
    </>
  );
}
