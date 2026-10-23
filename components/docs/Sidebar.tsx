"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { SearchButton } from "./Search";

export interface SidebarGroup {
  domain: string;
  label: string;
  pages: { id: string; title: string; type: string }[];
}

export function DocsSidebar({ locale, groups, version, revision }: { locale: Locale; groups: SidebarGroup[]; version: string; revision: string }) {
  const t = messages[locale].docs;
  const pathname = usePathname();
  const base = href(locale, "/docs");
  const current = pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1).split("#")[0] : "";
  const currentDomain = current.split(".")[0];
  const [open, setOpen] = useState(false);
  return (
    <aside className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:py-10">
      <div className="flex items-center gap-2 py-4 lg:hidden">
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn py-1.5 text-sm" aria-expanded={open} aria-controls="docs-nav">
          ☰ {messages[locale].nav.docs}
        </button>
        <SearchButton locale={locale} compact />
      </div>
      <nav id="docs-nav" aria-label={t.title} className={`${open ? "block" : "hidden"} lg:block`}>
        <div className="hidden lg:block">
          <SearchButton locale={locale} />
        </div>
        <p className="pixel mt-4 text-ink-3" data-docs-version={version}>
          {t.builtFor} {version} · {revision}
        </p>
        <Link href={base} className={`mt-3 block rounded-[4px] px-2 py-1 font-semibold ${current === "" ? "bg-ink text-paper" : "hover:bg-paper-3"}`}>
          {t.title}
        </Link>
        {groups.map((g) => (
          <details key={g.domain} open={g.domain === currentDomain} className="mt-2 group">
            <summary className="cursor-pointer select-none rounded-[4px] px-2 py-1 font-semibold hover:bg-paper-3">
              {g.label} <span className="text-ink-3 font-normal">({g.pages.length})</span>
            </summary>
            <ul className="ml-2 mt-1 border-l-2 border-line pl-2">
              {g.pages.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`${base}/${p.id}`}
                    aria-current={p.id === current ? "page" : undefined}
                    className={`block rounded-[4px] px-2 py-1 text-sm ${p.id === current ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-3 hover:text-ink"}`}
                    onClick={() => setOpen(false)}
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </nav>
    </aside>
  );
}
