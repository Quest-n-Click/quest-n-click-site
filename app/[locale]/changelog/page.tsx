import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hast } from "@/components/docs/Hast";
import { VersionJump } from "@/components/changelog/VersionJump";
import { parseChangelog } from "@/lib/changelog";
import { memo } from "@/lib/memo";
import { getChangelogText, getLatestRelease, getReleases } from "@/lib/github";
import { ENGINE_REPO_URL, isLocale, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = messages[locale];
  return { title: t.changelog.title, description: t.changelog.lead, alternates: { canonical: href(locale, "/changelog"), languages: { en: "/changelog", fr: "/fr/changelog" } } };
}

const SHOWN = 15;

export default async function ChangelogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ all?: string }>;
}) {
  const { locale } = await params;
  const { all } = await searchParams;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const t = messages[lang].changelog;
  const [latest, releases] = await Promise.all([getLatestRelease(), getReleases()]);
  const ref = latest?.tag_name ?? "main";
  const text = await getChangelogText(ref);
  const every = text ? await memo(`changelog:${ref}`, 3600 * 1000, () => parseChangelog(text, ref)) : [];
  const versions = all === "1" ? every : every.slice(0, SHOWN);
  const hidden = every.length - versions.length;
  const releaseByVersion = new Map((releases ?? []).map((r) => [r.tag_name.replace(/^v/, ""), r]));
  const fmt = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" });
  return (
    <div className="container-site py-12 sm:py-16">
      <header className="prose-site">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-4 text-lg text-ink-2">{t.lead}</p>
      </header>
      {versions.length === 0 ? (
        <p className="mt-10 text-ink-2">
          {t.unavailable} <a className="underline" href={`${ENGINE_REPO_URL}/blob/main/CHANGELOG.md`} rel="noopener">CHANGELOG.md</a>
        </p>
      ) : (
        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-10">
          <div className="min-w-0">
            {versions.map((v, i) => {
              const rel = releaseByVersion.get(v.version);
              return (
                <section key={v.anchor} id={v.anchor} className="scroll-mt-20 border-t-2 border-line py-10 first:border-0 first:pt-0" aria-labelledby={`${v.anchor}-h`}>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 id={`${v.anchor}-h`} className="text-3xl font-bold tabular-nums" data-version={v.version}>
                      {v.version}
                    </h2>
                    {i === 0 && latest ? <span className="pixel rounded-[4px] bg-sun px-2 py-1 text-[0.55rem] text-sun-ink">{t.latest}</span> : null}
                    {v.date ? <span className="text-ink-2">{fmt.format(new Date(`${v.date}T12:00:00Z`))}</span> : null}
                    {rel ? <a href={rel.html_url} className="text-sm text-sun underline underline-offset-4" rel="noopener">{t.release}</a> : null}
                  </div>
                  <div className="doc mt-4">
                    {v.intro ? <Hast tree={v.intro} locale={lang} /> : null}
                    {v.sections.map((s) => (
                      <section key={s.title}>
                        <h3 className="!mt-6">{s.title}</h3>
                        <Hast tree={s.html} locale={lang} />
                      </section>
                    ))}
                  </div>
                </section>
              );
            })}
            {hidden > 0 ? (
              <p className="border-t-2 border-line pt-8">
                <a href={`${href(lang, "/changelog")}?all=1`} className="btn">
                  {t.showAll} ({hidden})
                </a>
              </p>
            ) : null}
          </div>
          <VersionJump label={t.jump} versions={every.map((v) => ({ version: v.version, anchor: v.anchor, date: v.date }))} shown={versions.length} />
        </div>
      )}
    </div>
  );
}
