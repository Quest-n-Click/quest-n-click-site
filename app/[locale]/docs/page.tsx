import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hast } from "@/components/docs/Hast";
import { getDocs, groupByDomain } from "@/lib/docs/store";
import { ENGINE_REPO_URL, isLocale, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = messages[locale];
  return { title: t.docs.title, description: t.docs.lead, alternates: { canonical: href(locale, "/docs"), languages: { en: "/docs", fr: "/fr/docs" } } };
}

export default async function DocsHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const t = messages[lang].docs;
  const docs = await getDocs();
  const byTask = await docs.html(lang, "index.by-task");
  const groups = groupByDomain(docs.order, lang);
  const starts = ["start.what-it-is", "start.features", "create.first-game", "install.package", "studio.overview", "index.faq"]
    .map((id) => docs.byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.langs[lang]));
  const excerpts = await Promise.all(starts.map((p) => docs.excerpt(lang, p.id)));
  return (
    <article>
      <h1 className="text-4xl font-bold tracking-tight">{t.title}</h1>
      <p className="prose-site mt-3 text-lg text-ink-2">{t.lead}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {starts.map((p, i) => (
          <li key={p.id} className="hard rounded-[4px] bg-paper-2 p-4">
            <p className="pixel text-ink-3">{t.domains[p.domain] ?? p.domain}</p>
            <Link href={`${href(lang, "/docs")}/${p.id}`} className="mt-1 block text-lg font-bold hover:text-sky-deep">{p.title[lang]}</Link>
            <p className="mt-1 text-sm text-ink-2">{excerpts[i]}</p>
          </li>
        ))}
      </ul>
      {byTask ? (
        <section className="doc mt-12" aria-labelledby="by-task">
          <h2 id="by-task" className="!mt-0 !border-0 !pt-0">{t.byTask}</h2>
          <Hast tree={byTask} locale={lang} />
        </section>
      ) : null}
      <section className="mt-12" aria-labelledby="by-domain">
        <h2 id="by-domain" className="text-2xl font-bold">{t.byDomain}</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.domain}>
              <h3 className="border-b-2 border-ink pb-1 font-bold">{t.domains[g.domain] ?? g.domain}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {g.pages.map((p) => (
                  <li key={p.id}>
                    <Link href={`${href(lang, "/docs")}/${p.id}`} className="text-ink-2 hover:text-ink hover:underline">{p.title[lang]}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-12 border-t-2 border-line pt-6 text-sm text-ink-2" aria-labelledby="versions">
        <h2 id="versions" className="font-bold text-ink">{t.otherVersions}</h2>
        <p className="mt-1">
          {t.otherVersionsText}{" "}
          <a href={`${ENGINE_REPO_URL}/releases`} className="underline" rel="noopener">GitHub · releases</a>
        </p>
      </section>
    </article>
  );
}
