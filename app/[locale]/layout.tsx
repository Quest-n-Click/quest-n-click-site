import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { isLocale, LOCALES, SITE_URL, href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = messages[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${t.siteName} · ${t.tagline}`, template: `%s · ${t.siteName}` },
    description: t.home.lead,
    alternates: { canonical: href(locale, "/"), languages: { en: "/", fr: "/fr" } },
    openGraph: {
      type: "website",
      siteName: t.siteName,
      title: `${t.siteName} · ${t.tagline}`,
      description: t.home.lead,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [{ url: "/brand/social.jpg", width: 1280, height: 640 }],
    },
    icons: { icon: "/brand/icon-512.png", apple: "/brand/icon-512.png" },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = messages[locale as Locale];
  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable} ${pixel.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-sun"
        >
          {t.skip}
        </a>
        <Header locale={locale} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
