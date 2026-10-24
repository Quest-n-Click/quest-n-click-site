"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { messages } from "@/messages";

export interface GalleryShot {
  src: string;
  w: number;
  h: number;
  title: string;
  text: string;
  alt: string;
}

/** Three screenshots with a title and a line each; one opens large in a dialog that gives the focus back on close. */
export function Gallery({ shots, locale }: { shots: GalleryShot[]; locale: Locale }) {
  const t = messages[locale].home;
  const [open, setOpen] = useState<GalleryShot | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
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
      <dialog
        ref={dialog}
        aria-label={open?.title}
        onClose={close}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
        className="m-auto w-[min(1100px,calc(100%-2rem))] rounded-[6px] border border-line bg-paper-2 p-0 text-ink backdrop:bg-[#080b15]/90"
      >
        {open ? (
          <figure>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <figcaption className="font-medium">
                {open.title} <span className="text-ink-2">· {open.text}</span>
              </figcaption>
              <button type="button" onClick={close} className="btn min-h-0 px-3 py-1.5" aria-label={t.close}>
                ✕
              </button>
            </div>
            <Image src={open.src} alt={open.alt} width={open.w} height={open.h} sizes="100vw" className="max-h-[78vh] w-full object-contain bg-[#070b12]" />
          </figure>
        ) : null}
      </dialog>
    </>
  );
}
