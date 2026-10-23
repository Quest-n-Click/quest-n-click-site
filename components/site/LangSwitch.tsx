"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, otherLocale, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

/** The same page in the other language. Pages that exist in one language only fall back to that language's docs home. */
export function LangSwitch({ locale, to }: { locale: Locale; to?: string }) {
  const pathname = usePathname();
  const other = otherLocale(locale);
  const bare = locale === "fr" ? pathname.replace(/^\/fr(?=\/|$)/, "") || "/" : pathname;
  const target = to ?? href(other, bare);
  return (
    <Link href={target} hrefLang={other} lang={other} className="pixel ml-1 rounded-[4px] border-2 border-ink px-2 py-1.5 hover:bg-paper-3">
      {messages[locale].switchLang === "Français" ? "FR" : "EN"}
      <span className="sr-only"> · {messages[locale].switchLang}</span>
    </Link>
  );
}
