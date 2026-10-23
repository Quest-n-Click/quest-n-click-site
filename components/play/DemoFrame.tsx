"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { PixelFrame } from "@/components/site/PixelFrame";
import type { Locale } from "@/lib/i18n";
import { messages } from "@/messages";

/** A demo embedded from GitHub Pages. It loads on the visitor's press, behind a still, so the page stays light. */
export function DemoFrame({
  locale,
  src,
  open,
  poster,
  ratio,
  title,
  hint,
  tone,
  desktopOnly = false,
}: {
  locale: Locale;
  src: string;
  open: string;
  poster: string;
  ratio: "16/9" | "16/10";
  title: string;
  hint: string;
  tone: "sun" | "sky";
  desktopOnly?: boolean;
}) {
  const t = messages[locale].play;
  const [playing, setPlaying] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const fullscreen = () => box.current?.requestFullscreen?.();
  return (
    <div className="mt-6">
      <PixelFrame tone={tone} title={title}>
        <div
          ref={box}
          className={`relative w-full bg-[#0a0a12] ${ratio === "16/9" ? "aspect-video" : "aspect-[16/10]"} ${desktopOnly ? "hidden md:block" : ""}`}
        >
          {playing ? (
            <iframe
              src={src}
              title={title}
              className="absolute inset-0 h-full w-full"
              allow="fullscreen; autoplay; gamepad; clipboard-write"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <>
              <Image src={poster} alt={t.poster} fill sizes="(min-width: 1216px) 1152px, 100vw" className="object-cover opacity-80" priority={false} />
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="btn btn-sun absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
              >
                ▶ {t.start}
              </button>
            </>
          )}
        </div>
        {desktopOnly ? (
          <div className="md:hidden p-6 text-center text-ink-2">
            <p>{hint}</p>
            <a href={open} className="btn mt-4" rel="noopener">
              {t.open}
            </a>
          </div>
        ) : null}
      </PixelFrame>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-2">
        <p className="mr-auto">{hint}</p>
        {playing ? (
          <button type="button" onClick={fullscreen} className="btn py-1.5 text-sm">
            {t.fullscreen}
          </button>
        ) : null}
        <a href={open} className="btn py-1.5 text-sm" rel="noopener">
          {t.open}
        </a>
      </div>
    </div>
  );
}
