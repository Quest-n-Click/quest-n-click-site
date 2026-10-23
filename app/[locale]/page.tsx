import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hast } from "@/components/docs/Hast";
import { Gallery } from "@/components/home/Gallery";
import { Tabs } from "@/components/home/Tabs";
import { PixelFrame } from "@/components/site/PixelFrame";
import { GALLERY } from "@/content/gallery";
import { SNIPPETS } from "@/content/snippets";
import { renderMarkdown } from "@/lib/docs/markdown";
import { memo } from "@/lib/memo";
import { getDocs } from "@/lib/docs/store";
import { getLatestRelease, getReadmeMetrics, getRepoStats } from "@/lib/github";
import { ENGINE_REPO_URL, isLocale, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export const dynamic = "force-dynamic";

const FEATURE_SECTIONS = ["playing", "further", "making", "teams"];

function featureBlocks(lang: Locale) {
  return memo(`home:features:${lang}`, 3600 * 1000, () => featureBlocksNow(lang));
}

async function featureBlocksNow(lang: Locale) {
  try {
    const docs = await getDocs();
    const md = await docs.markdown(lang, "start.features");
    if (!md) return null;
    const parts = md.split(/^<a name="([^"]+)"><\/a>\s*$/m);
    const out: { id: string; title: string; tree: Awaited<ReturnType<typeof renderMarkdown>> }[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      const id = parts[i];
      if (!FEATURE_SECTIONS.includes(id)) continue;
      const body = parts[i + 1];
      const title = /^## (.+)$/m.exec(body)?.[1] ?? id;
      const tree = await renderMarkdown(body.replace(/^## .+$/m, ""), {
        lang,
        productCommit: docs.manifest.productCommit,
        docsBase: href(lang, "/docs"),
        assetsBase: "/api/docs-assets",
      });
      out.push({ id, title, tree });
    }
    return out.length ? out : null;
  } catch (e) {
    console.warn(`[home] features: ${(e as Error).message}`);
    return null;
  }
}

function installCommands(version: string | null) {
  const v = version ?? "<version>";
  return `T=${ENGINE_REPO_URL}/releases/download/v${v}/quest-n-click-${v}.tgz
npx --package=$T quest-n-click create my-game "My Game" --engine=$T
cd my-game && npm install
npm run assets && npm run dev`;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const t = messages[lang];
  const [release, stats, features] = await Promise.all([getLatestRelease(), getRepoStats(), featureBlocks(lang)]);
  const version = release ? release.tag_name.replace(/^v/, "") : null;
  const metrics = release ? await getReadmeMetrics(release.tag_name) : null;
  const date = release?.published_at
    ? new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(new Date(release.published_at))
    : null;
  const snippetOpts = { lang, productCommit: "main", docsBase: href(lang, "/docs"), assetsBase: "/api/docs-assets", repoLinks: false };
  const [room, rule, talk, start] = await memo(`home:snippets:${lang}:${version}`, 3600 * 1000, () =>
    Promise.all([
      renderMarkdown("```ts\n" + SNIPPETS.room + "\n```", snippetOpts),
      renderMarkdown("```ts\n" + SNIPPETS.rule + "\n```", snippetOpts),
      renderMarkdown("```ts\n" + SNIPPETS.talk + "\n```", snippetOpts),
      renderMarkdown("```bash\n" + installCommands(version) + "\n```", snippetOpts),
    ]),
  );

  return (
    <>
      {/* Hero */}
      <section className="container-site grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="pixel text-sun">{t.tagline}</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">{t.home.heroTitle}</h1>
          <p className="prose-site mt-5 text-lg text-ink-2 sm:text-xl">{t.home.heroLead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href(lang, "/play")} className="btn btn-sun">▶ {t.home.ctaPlay}</Link>
            <Link href={href(lang, "/docs")} className="btn">{t.home.ctaDocs}</Link>
          </div>
          {release ? (
            <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2" data-latest={version ?? ""}>
              <a href={release.html_url} className="pixel rounded-[4px] border-2 border-ink bg-paper-2 px-2 py-1 text-ink hover:bg-paper-3" rel="noopener">
                v{version}
              </a>
              {date ? <span>{t.home.releasedOn} {date}</span> : null}
              {stats ? <span>★ {stats.stargazers_count} {t.home.stars}</span> : null}
            </p>
          ) : null}
        </div>
        <PixelFrame tone="sun" title="The Pantry Key">
          <Image src="/gallery/4119-hero.webp" alt={GALLERY[0].caption[lang]} width={1440} height={665} priority sizes="(min-width: 1024px) 55vw, 100vw" className="block w-full" />
        </PixelFrame>
      </section>

      {/* Data */}
      <section className="border-y-2 border-line bg-paper-2 py-16" aria-labelledby="data">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="prose-site">
            <h2 id="data" className="text-3xl font-bold tracking-tight">{t.home.dataTitle}</h2>
            <p className="mt-4 text-lg text-ink-2">{t.home.dataLead}</p>
            <ul className="mt-6 space-y-2 text-ink-2">
              <li><Link className="underline underline-offset-4 hover:text-ink" href={href(lang, "/docs/create.rooms")}>{t.docs.domains.create} · Rooms</Link></li>
              <li><Link className="underline underline-offset-4 hover:text-ink" href={href(lang, "/docs/create.principles")}>{t.docs.domains.create} · Principles</Link></li>
              <li><Link className="underline underline-offset-4 hover:text-ink" href={href(lang, "/docs/create.working-with-ai")}>{t.docs.domains.create} · Working with an AI</Link></li>
            </ul>
          </div>
          <div className="doc min-w-0">
            <Tabs labels={[t.home.dataTabs.room, t.home.dataTabs.rule, t.home.dataTabs.talk]}>
              <Hast tree={room} locale={lang} />
              <Hast tree={rule} locale={lang} />
              <Hast tree={talk} locale={lang} />
            </Tabs>
          </div>
        </div>
      </section>

      {/* Features */}
      {features ? (
        <section className="container-site py-16" aria-labelledby="features">
          <h2 id="features" className="text-3xl font-bold tracking-tight">{t.home.featuresTitle}</h2>
          <p className="prose-site mt-3 text-lg text-ink-2">{t.home.featuresLead}</p>
          <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.id} className="doc min-w-0 text-base">
                <h3 className="!mt-0 border-b-2 border-ink pb-2 text-xl font-bold">{f.title}</h3>
                <Hast tree={f.tree} locale={lang} />
              </div>
            ))}
          </div>
          <p className="mt-8">
            <Link href={href(lang, "/docs/start.features")} className="btn">{t.home.moreDocs}</Link>
          </p>
        </section>
      ) : null}

      {/* Gallery */}
      <section className="border-y-2 border-line bg-paper-2 py-16" aria-labelledby="gallery">
        <div className="container-site">
          <h2 id="gallery" className="text-3xl font-bold tracking-tight">{t.home.galleryTitle}</h2>
          <p className="prose-site mt-3 text-lg text-ink-2">{t.home.galleryLead}</p>
          <div className="mt-10">
            <Gallery shots={GALLERY} locale={lang} />
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="container-site py-16" aria-labelledby="proof">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <h2 id="proof" className="text-3xl font-bold tracking-tight">{t.home.proofTitle}</h2>
            <p className="prose-site mt-3 text-lg text-ink-2">{t.home.proofLead}</p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {t.home.proofSteps.map((s, i) => (
                <li key={s.title} className="hard rounded-[4px] bg-paper-2 p-4">
                  <p className="pixel text-sun">{i + 1}</p>
                  <p className="mt-2 text-lg font-bold">{s.title}</p>
                  <p className="mt-1 text-sm text-ink-2">{s.text}</p>
                </li>
              ))}
            </ol>
            {metrics && Object.keys(metrics).length ? (
              <div className="mt-10">
                <h3 className="text-xl font-bold">{t.home.numbersTitle}</h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  {(["tests", "referenceStates", "initialJsKB"] as const)
                    .filter((k) => metrics[k])
                    .map((k) => (
                      <div key={k} className="border-l-4 border-sky pl-3">
                        <dd className="text-3xl font-bold tabular-nums">{metrics[k]}</dd>
                        <dt className="text-sm text-ink-2">{t.home.metrics[k]}</dt>
                      </div>
                    ))}
                </dl>
                <p className="mt-3 text-xs text-ink-3">{t.home.numbersNote}</p>
              </div>
            ) : null}
          </div>
          <PixelFrame tone="sky" title="Studio · Check" className="lg:mt-2">
            <Image src="/gallery/4119-proof-graph.webp" alt="The puzzle graph with the critical path and the solver's heat" width={699} height={840} sizes="(min-width: 1024px) 40vw, 100vw" className="block w-full" />
          </PixelFrame>
        </div>
      </section>

      {/* Start */}
      <section className="border-t-2 border-line bg-paper-2 py-16" aria-labelledby="start">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="prose-site">
            <h2 id="start" className="text-3xl font-bold tracking-tight">{t.home.startTitle}</h2>
            <p className="mt-4 text-lg text-ink-2">{t.home.startLead}</p>
            <p className="mt-4 text-ink-2">{t.home.startAfter}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={href(lang, "/docs/create.first-game")} className="btn btn-sky">{t.home.tutorial}</Link>
              <Link href={href(lang, "/docs/install.package")} className="btn">{t.docs.domains.install}</Link>
            </div>
          </div>
          <div className="doc min-w-0">
            <Hast tree={start} locale={lang} />
          </div>
        </div>
      </section>
    </>
  );
}
