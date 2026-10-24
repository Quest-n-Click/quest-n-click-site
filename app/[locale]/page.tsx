import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hast } from "@/components/docs/Hast";
import { AiExamples } from "@/components/home/AiExamples";
import { Gallery } from "@/components/home/Gallery";
import { StudioSteps } from "@/components/home/StudioSteps";
import { Tabs } from "@/components/home/Tabs";
import { PixelFrame } from "@/components/site/PixelFrame";
import { GALLERY } from "@/content/gallery";
import { SNIPPETS } from "@/content/snippets";
import { renderMarkdown } from "@/lib/docs/markdown";
import { getLatestRelease, getReadmeMetrics, getRepoStats } from "@/lib/github";
import { memo } from "@/lib/memo";
import { ENGINE_REPO_URL, isLocale, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export const dynamic = "force-dynamic";

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
  const h = t.home;
  const [release, stats] = await Promise.all([getLatestRelease(), getRepoStats()]);
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
  const docs = (id: string) => `${href(lang, "/docs")}/${id}`;
  const play = href(lang, "/play");
  const shots = GALLERY.discover.map((s, i) => ({ ...s, alt: s.alt[lang], title: h.discoverShots[i].title, text: h.discoverShots[i].text }));
  const steps = h.studioSteps.map((s) => ({ ...s, src: GALLERY.studio[s.key as keyof typeof GALLERY.studio].src, alt: GALLERY.studio[s.key as keyof typeof GALLERY.studio].alt[lang] }));

  return (
    <>
      {/* First screen: name the project, show the game. */}
      <section className="container-site grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.15fr] lg:gap-12 lg:py-20" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">{h.eyebrow}</p>
          <h1 id="hero-title" className="mt-5 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[3.75rem]">
            {h.title1}
            <br />
            <span className="text-sun">{h.title2}</span>
          </h1>
          <p className="prose-site mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2">{h.lead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={play} className="btn btn-sun">
              <span aria-hidden className="text-xs">▶</span> {h.ctaPlay}
            </Link>
            <a href="#studio" className="btn">
              {h.ctaStudio} <span aria-hidden>↓</span>
            </a>
          </div>
          <p className="mt-5 text-sm text-ink-3">{h.note}</p>
          {release ? (
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3" data-latest={version ?? ""}>
              <a href={release.html_url} className="pixel rounded-[4px] border border-line px-2 py-1 text-ink-2 hover:border-sun hover:text-ink" rel="noopener">
                v{version}
              </a>
              {date ? <span>{h.releasedOn} {date}</span> : null}
              {stats ? <span>★ {stats.stargazers_count} {h.stars}</span> : null}
            </p>
          ) : null}
        </div>
        <PixelFrame tone="sun" title="The Pantry Key" tag={h.previewTag}>
          <Image src={GALLERY.hero.src} alt={GALLERY.hero.alt[lang]} width={1440} height={665} priority sizes="(min-width: 1024px) 55vw, 100vw" className="block w-full" />
          <figcaption className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-ink-2">
            <span>{h.previewCaption}</span>
            <Link href={play} className="link whitespace-nowrap">{h.previewLink} ↗</Link>
          </figcaption>
        </PixelFrame>
      </section>

      <div className="border-y border-line">
        <div className="container-site flex flex-wrap items-center gap-x-6 gap-y-2 py-5">
          <span className="pixel text-sun">{h.strip}</span>
          <p className="text-sm text-ink-3 sm:ml-auto">{h.stripText}</p>
        </div>
      </div>

      {/* The game */}
      <section id="discover" className="container-site scroll-mt-20 py-16" aria-labelledby="discover-title">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="eyebrow">{h.discoverEyebrow}</p>
            <h2 id="discover-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{h.discoverTitle}</h2>
          </div>
          <p className="max-w-[46ch] text-ink-2">{h.discoverLead}</p>
        </div>
        <div className="mt-9">
          <Gallery shots={shots} locale={lang} />
        </div>
      </section>

      {/* The Studio */}
      <section id="studio" className="scroll-mt-20 border-y border-line bg-paper-2 py-16" aria-labelledby="studio-title">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="eyebrow">{h.studioEyebrow}</p>
              <h2 id="studio-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{h.studioTitle}</h2>
            </div>
            <p className="max-w-[46ch] text-ink-2">{h.studioLead}</p>
          </div>
          <div className="mt-9">
            <StudioSteps steps={steps} window={h.studioWindow} tag={h.studioTag} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
            <p className="text-ink-3">{h.studioFoot}</p>
            <p className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href={docs("create.first-game")} className="link">{h.studioGuide} ↗</Link>
              <Link href={`${play}#studio`} className="link">{h.studioDemo} ↗</Link>
            </p>
          </div>
        </div>
      </section>

      {/* The assistant */}
      <section id="assistant" className="container-site grid scroll-mt-20 gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16 lg:py-20" aria-labelledby="ai-title">
        <div>
          <p className="eyebrow text-grass">
            <span aria-hidden className="font-sans text-base">✦ </span>
            {h.aiEyebrow}
          </p>
          <h2 id="ai-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {h.aiTitle1}
            <br />
            {h.aiTitle2}
          </h2>
          <p className="mt-5 max-w-[46ch] text-ink-2">{h.aiText1}</p>
          <p className="mt-4 max-w-[46ch] text-ink-2">{h.aiText2}</p>
          <p className="mt-5">
            <Link href={docs("create.working-with-ai")} className="link">{h.aiGuide} ↗</Link>
          </p>
          <p className="mt-3 text-sm text-ink-3">{h.aiConfig}</p>
        </div>
        <AiExamples examples={h.aiExamples} title={h.aiCardTitle} tag={h.aiCardTag} shot={GALLERY.assistant.src} shotAlt={h.aiShot} />
      </section>

      {/* The open project */}
      <section className="border-y border-line bg-paper-2 py-14" aria-labelledby="open-title">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:items-center">
          <div>
            <p className="eyebrow">{h.openEyebrow}</p>
            <h2 id="open-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{h.openTitle}</h2>
            <p className="mt-5 max-w-[46ch] text-ink-2">{h.openText}</p>
            <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a href={ENGINE_REPO_URL} className="link" rel="noopener">{h.openLinks.sources} ↗</a>
              <a href={`${ENGINE_REPO_URL}/issues`} className="link" rel="noopener">{h.openLinks.issues} ↗</a>
              <Link href={href(lang, "/changelog")} className="link">{h.openLinks.news}</Link>
            </p>
            <div className="mt-8 flex items-center gap-5 border-t border-line pt-6">
              <Image src="/brand/pixel.webp" alt="Pixel" width={186} height={221} className="h-20 w-auto" />
              <p className="text-sm text-ink-2">{h.signature}</p>
            </div>
          </div>
          <div>
            <Image src="/brand/logo-768.png" alt={`quest'n'click · ${t.tagline}`} width={768} height={512} sizes="(min-width: 1024px) 28vw, 70vw" className="mx-auto w-full max-w-[18rem] sm:max-w-xs" />
            <details className="group mt-6 border-t border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
                {h.techSummary} <span aria-hidden className="text-xl text-ink-3 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="pb-4 text-sm text-ink-2">
                <p>{h.techText1}</p>
                <p className="mt-3">{h.techText2}</p>
                <p className="mt-3">
                  <Link href={docs("create.principles")} className="link">{h.techPrinciples} ↗</Link>
                </p>
                <div className="doc mt-5 text-sm">
                  <Tabs labels={[h.dataTabs.room, h.dataTabs.rule, h.dataTabs.talk]}>
                    <Hast tree={room} locale={lang} />
                    <Hast tree={rule} locale={lang} />
                    <Hast tree={talk} locale={lang} />
                  </Tabs>
                </div>
                <h3 className="mt-6 font-medium text-ink">{h.startTitle}</h3>
                <p className="mt-1">{h.startLead}</p>
                <div className="doc mt-3 text-sm">
                  <Hast tree={start} locale={lang} />
                </div>
                <p className="mt-3">
                  <Link href={docs("create.first-game")} className="link">{h.tutorial} ↗</Link>
                </p>
                {metrics && Object.keys(metrics).length ? (
                  <div className="mt-6 border-t border-line pt-4">
                    <h3 className="font-medium text-ink">{h.numbersTitle}</h3>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                      {(["tests", "referenceStates", "initialJsKB"] as const)
                        .filter((k) => metrics[k])
                        .map((k) => (
                          <div key={k}>
                            <dd className="text-2xl font-semibold tabular-nums text-ink">{metrics[k]}</dd>
                            <dt className="text-xs text-ink-3">{h.metrics[k]}</dt>
                          </div>
                        ))}
                    </dl>
                    <p className="mt-2 text-xs text-ink-3">{h.numbersNote}</p>
                  </div>
                ) : null}
              </div>
            </details>
            <Link href={href(lang, "/docs")} className="flex min-h-14 items-center justify-between border-t border-line font-medium hover:text-sun">
              {h.openLinks.docs} <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
