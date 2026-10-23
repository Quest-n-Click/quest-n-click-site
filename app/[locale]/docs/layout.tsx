import { notFound } from "next/navigation";
import { DocsSidebar } from "@/components/docs/Sidebar";
import { SearchPalette } from "@/components/docs/Search";
import { getDocs, groupByDomain } from "@/lib/docs/store";
import { isLocale, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { ENGINE_WIKI_URL } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DocsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const t = messages[lang];
  let docs: Awaited<ReturnType<typeof getDocs>> | null = null;
  try {
    docs = await getDocs();
  } catch (e) {
    console.error(`[docs] ${(e as Error).message}`);
  }
  if (!docs) {
    return (
      <div className="container-site py-20">
        <h1 className="text-3xl font-bold">{t.docs.unavailable}</h1>
        <p className="prose-site mt-3 text-ink-2">{t.docs.unavailableText}</p>
        <a href={ENGINE_WIKI_URL} className="btn mt-6" rel="noopener">{t.nav.wiki}</a>
      </div>
    );
  }
  const groups = groupByDomain(docs.order, lang).map((g) => ({
    domain: g.domain,
    label: t.docs.domains[g.domain] ?? g.domain,
    pages: g.pages.map((p) => ({ id: p.id, title: p.title[lang], type: p.type })),
  }));
  return (
    <div className="container-site lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
      <DocsSidebar locale={lang} groups={groups} version={docs.source.version} revision={docs.source.revision} />
      <div className="min-w-0 py-8 lg:py-10">{children}</div>
      <SearchPalette locale={lang} />
    </div>
  );
}
