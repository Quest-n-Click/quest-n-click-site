import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hast } from "@/components/docs/Hast";
import { getDocs } from "@/lib/docs/store";
import { ENGINE_WIKI_URL, isLocale, href, otherLocale, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const docs = await getDocs().catch(() => null);
  const page = docs?.byId.get(id);
  if (!docs || !page?.langs[locale]) return {};
  const description = await docs.excerpt(locale, id);
  const languages: Record<string, string> = {};
  if (page.langs.en) languages.en = `/docs/${id}`;
  if (page.langs.fr) languages.fr = `/fr/docs/${id}`;
  return {
    title: page.title[locale],
    description,
    alternates: { canonical: `${href(locale, "/docs")}/${id}`, languages },
    openGraph: { title: page.title[locale], description, images: [{ url: "/brand/social.jpg" }] },
  };
}

export default async function DocPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const t = messages[lang].docs;
  const docs = await getDocs();
  const page = docs.byId.get(id);
  if (!page) notFound();
  const other = otherLocale(lang);
  if (!page.langs[lang]) {
    // The page exists in the other language only: say so and link it.
    return (
      <article className="prose-site">
        <h1 className="text-3xl font-bold">{page.title[lang] ?? page.title[other]}</h1>
        <p className="mt-3 text-ink-2">{messages[lang].notFound.text}</p>
        {page.langs[other] ? <Link href={`${href(other, "/docs")}/${id}`} className="btn mt-6">{t.twin}</Link> : null}
      </article>
    );
  }
  const tree = await docs.html(lang, id);
  if (!tree) notFound();
  const sections = page.langs[lang]!.sections.filter((s) => s.id);
  const i = docs.order.findIndex((p) => p.id === id);
  const prev = [...docs.order.slice(0, i)].reverse().find((p) => p.langs[lang]);
  const next = docs.order.slice(i + 1).find((p) => p.langs[lang]);
  const related = [...(page.prerequisites ?? []), ...(page.related ?? [])]
    .map((rid) => docs.byId.get(rid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.langs[lang]));
  const base = href(lang, "/docs");
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-10">
      <article className="min-w-0">
        <p className="pixel flex flex-wrap gap-x-3 gap-y-1 text-ink-3">
          <span>{t.domains[page.domain] ?? page.domain}</span>
          <span>{t.types[page.type] ?? page.type}</span>
          {page.audience.length ? <span>{t.audience} {page.audience.map((a) => t.audiences[a] ?? a).join(", ")}</span> : null}
          {page.versions?.appliesFrom ? <span>{t.appliesFrom} {page.versions.appliesFrom}</span> : null}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">{page.title[lang]}</h1>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {page.langs[other] ? (
            <Link href={`${href(other, "/docs")}/${id}`} hrefLang={other} lang={other} className="text-sky-deep underline underline-offset-4">{t.twin}</Link>
          ) : null}
          <a href={`${ENGINE_WIKI_URL}/${page.url[lang]}`} className="text-ink-2 underline underline-offset-4" rel="noopener">{t.editOn}</a>
        </p>
        <div className="doc mt-8">
          <Hast tree={tree} locale={lang} />
        </div>
        {related.length ? (
          <section className="mt-12 border-t-2 border-line pt-6" aria-labelledby="related">
            <h2 id="related" className="font-bold">{t.related}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={`${base}/${p.id}`} className="inline-block rounded-[4px] border-2 border-line px-2 py-1 text-sm hover:border-ink">{p.title[lang]}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <nav className="mt-12 flex flex-wrap justify-between gap-4 border-t-2 border-line pt-6 text-sm" aria-label="Pages">
          {prev ? (
            <Link href={`${base}/${prev.id}`} className="btn py-1.5">← {prev.title[lang]}</Link>
          ) : <span />}
          {next ? (
            <Link href={`${base}/${next.id}`} className="btn py-1.5">{next.title[lang]} →</Link>
          ) : null}
        </nav>
      </article>
      {sections.length ? (
        <aside className="hidden xl:block">
          <nav aria-label={t.onThisPage} className="sticky top-24 text-sm">
            <p className="pixel text-ink-3">{t.onThisPage}</p>
            <ul className="mt-2 space-y-1 border-l-2 border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-0.5 block border-l-2 border-transparent pl-3 text-ink-2 hover:border-ink hover:text-ink">{s.title}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      ) : null}
    </div>
  );
}
