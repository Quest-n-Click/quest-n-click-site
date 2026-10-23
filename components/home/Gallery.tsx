"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PixelFrame } from "@/components/site/PixelFrame";
import type { Shot } from "@/content/gallery";
import type { Locale } from "@/lib/i18n";

/** The screenshots in two rows; one opens large on a press, closes on Escape or a press outside. */
export function Gallery({ shots, locale }: { shots: Shot[]; locale: Locale }) {
  const [open, setOpen] = useState<Shot | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shots.map((s) => (
          <li key={s.src}>
            <button type="button" onClick={() => setOpen(s)} className="block w-full text-left">
              <PixelFrame tone={s.who === "player" ? "sun" : "sky"}>
                <Image src={s.src} alt={s.caption[locale]} width={s.w} height={s.h} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="block w-full" />
              </PixelFrame>
            </button>
            <p className="mt-2 text-sm text-ink-2">{s.caption[locale]}</p>
          </li>
        ))}
      </ul>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.caption[locale]}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a12]/90 p-4"
          onClick={() => setOpen(null)}
        >
          <figure className="max-h-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <Image src={open.src} alt={open.caption[locale]} width={open.w} height={open.h} sizes="100vw" className="hard max-h-[85vh] w-auto bg-paper-2" />
            <figcaption className="mt-3 text-center text-paper">{open.caption[locale]}</figcaption>
          </figure>
          <button type="button" onClick={() => setOpen(null)} className="btn absolute right-4 top-4" aria-label="Close">
            ✕
          </button>
        </div>
      ) : null}
    </>
  );
}
