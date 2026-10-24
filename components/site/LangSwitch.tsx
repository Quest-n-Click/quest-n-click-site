"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, otherLocale, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

/** The same page in the other language. */
export function LangSwitch({ locale, to }: { locale: Locale; to?: string }) {
  const pathname = usePathname();
  const other = otherLocale(locale);
  const bare = locale === "fr" ? pathname.replace(/^\/fr(?=\/|$)/, "") || "/" : pathname;
  const target = to ?? href(other, bare);
  return (
    <Link href={target} hrefLang={other} lang={other} className="pixel ml-1 rounded-[4px] border border-line px-2.5 py-2 text-ink-2 hover:border-sun hover:text-ink">
      {other.toUpperCase()}
      <span className="sr-only"> · {messages[locale].switchLang}</span>
    </Link>
  );
}
