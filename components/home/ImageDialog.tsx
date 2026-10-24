"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

export interface DialogShot {
  src: string;
  w: number;
  h: number;
  alt: string;
  title: string;
  text?: string;
}

/** One image, large, in a modal dialog: Escape and a press outside close it; the caller gives the focus back. */
export function ImageDialog({ shot, onClose, closeLabel }: { shot: DialogShot | null; onClose: () => void; closeLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (shot && !d.open) d.showModal();
    if (!shot && d.open) d.close();
  }, [shot]);
  return (
    <dialog
      ref={dialog}
      aria-label={shot?.title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      className="m-auto w-[min(1100px,calc(100%-2rem))] rounded-[6px] border border-line bg-paper-2 p-0 text-ink backdrop:bg-[#080b15]/90"
    >
      {shot ? (
        <figure>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <figcaption className="font-medium">
              {shot.title}
              {shot.text ? <span className="text-ink-2"> · {shot.text}</span> : null}
            </figcaption>
            <button type="button" onClick={onClose} className="btn min-h-0 px-3 py-1.5" aria-label={closeLabel}>
              ✕
            </button>
          </div>
          <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} sizes="100vw" className="max-h-[78vh] w-full bg-[#070b12] object-contain" />
        </figure>
      ) : null}
    </dialog>
  );
}
