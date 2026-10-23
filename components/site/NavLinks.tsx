"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export function NavLinks({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const pathname = usePathname();
  const items: [string, string][] = [
    [href(locale, "/play"), t.nav.play],
    [href(locale, "/docs"), t.nav.docs],
    [href(locale, "/changelog"), t.nav.changelog],
  ];
  return (
    <>
      {items.map(([to, label]) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            href={to}
            aria-current={active ? "page" : undefined}
            className={`rounded-[6px] px-3 py-1.5 font-medium ${active ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
