import Image from "next/image";
import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { SiteNav } from "./SiteNav";

export function Header({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur">
      <div className="container-site flex min-h-[4.25rem] items-center gap-4">
        <Link href={href(locale, "/")} className="flex shrink-0 items-center" aria-label={`${t.siteName}, ${t.nav.home}`}>
          <Image src="/brand/wordmark.png" alt="" width={735} height={159} priority className="h-8 w-auto sm:h-9" sizes="220px" />
        </Link>
        <SiteNav locale={locale} />
      </div>
    </header>
  );
}
