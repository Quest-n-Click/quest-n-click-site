"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { ImageDialog, type DialogShot } from "./ImageDialog";

export interface GalleryShot {
  src: string;
  w: number;
  h: number;
  title: string;
  text: string;
  alt: string;
}

/** Three screenshots with a title and a line each; one opens large, and the focus comes back to its button. */
export function Gallery({ shots, locale }: { shots: GalleryShot[]; locale: Locale }) {
  const t = messages[locale].home;
  const [open, setOpen] = useState<DialogShot | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const close = () => {
    setOpen(null);
    trigger.current?.focus();
  };
  return (
    <>
      <ul className="grid gap-6 md:grid-cols-3">
        {shots.map((s) => (
          <li key={s.src}>
            <button
              type="button"
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setOpen(s);
              }}
              aria-label={`${s.title}: ${t.enlarge}`}
              className="group block w-full text-left"
            >
              <span className="frame relative block">
                <Image src={s.src} alt={s.alt} width={s.w} height={s.h} sizes="(min-width: 768px) 33vw, 100vw" className="block aspect-[1.9] w-full object-cover" />
                <span aria-hidden className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-[3px] border border-line bg-paper/80 text-sun">
                  ↗
                </span>
              </span>
            </button>
            <p className="mt-3 font-medium">{s.title}</p>
            <p className="mt-1 text-sm text-ink-2">{s.text}</p>
          </li>
        ))}
      </ul>
      <ImageDialog shot={open} onClose={close} closeLabel={t.close} />
    </>
  );
}
