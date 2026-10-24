import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoUrls } from "@/lib/demo/urls";
import { isLocale, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { DemoFrame } from "@/components/play/DemoFrame";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = messages[locale];
  return {
    title: t.play.title,
    description: t.play.lead,
    alternates: { canonical: href(locale, "/play"), languages: { en: "/play", fr: "/fr/play" } },
  };
}

export default async function PlayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const t = messages[lang];
  const demo = await demoUrls();
  return (
    <div className="container-site py-12 sm:py-16">
      <header className="prose-site">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.play.title}</h1>
        <p className="mt-4 text-lg text-ink-2">{t.play.lead}</p>
      </header>

      <section className="mt-12" aria-labelledby="game">
        <h2 id="game" className="text-2xl font-bold">{t.play.game.title}</h2>
        <p className="prose-site mt-2 text-ink-2">{t.play.game.text}</p>
        <DemoFrame
          locale={lang}
          src={`${demo.game}?lang=${lang}`}
          open={demo.game}
          poster="/gallery/4119-hero.webp"
          ratio="16/9"
          title={t.play.game.title}
          hint={t.play.game.hint}
          tone="sun"
        />
      </section>

      <section className="mt-16" aria-labelledby="studio">
        <h2 id="studio" className="text-2xl font-bold">{t.play.studio.title}</h2>
        <p className="prose-site mt-2 text-ink-2">{t.play.studio.text}</p>
        <DemoFrame
          locale={lang}
          src={demo.studio}
          open={demo.studio}
          poster="/gallery/4119-studio-rooms.webp"
          ratio="16/10"
          title={t.play.studio.title}
          hint={t.play.studio.hint}
          tone="sky"
          desktopOnly
        />
      </section>
    </div>
  );
}
