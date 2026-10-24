"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { PixelFrame } from "@/components/site/PixelFrame";
import { ImageDialog, type DialogShot } from "./ImageDialog";

export interface StudioStep {
  key: string;
  title: string;
  text: string;
  label: string;
  /** What the focused crop shows. */
  caption: string;
  focus: { src: string; w: number; h: number };
  full: { src: string; w: number; h: number };
  alt: string;
}

/** The Studio's steps as a vertical tab list; each shows one focused region, and the whole screen on demand. */
export function StudioSteps({ steps, window, enlarge, close }: { steps: StudioStep[]; window: string; enlarge: string; close: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<DialogShot | null>(null);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enlargeButton = useRef<HTMLButtonElement>(null);
  const move = (from: number, delta: number) => {
    const to = (from + delta + steps.length) % steps.length;
    setActive(to);
    refs.current[to]?.focus();
  };
  const step = steps[active];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      <div role="tablist" aria-orientation="vertical" className="grid lg:order-none">
        {steps.map((s, i) => (
          <button
            key={s.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight") move(i, 1);
              if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(i, -1);
            }}
            className={`flex items-start gap-4 border-b border-line border-l-2 px-4 py-5 text-left ${i === active ? "border-l-sun bg-paper-3" : "border-l-transparent hover:bg-paper-2"}`}
          >
            <span className={`pixel pt-1 ${i === active ? "text-sun" : "text-ink-3"}`}>0{i + 1}</span>
            <span className="grid gap-1.5">
              <span className={`font-medium ${i === active ? "text-sun" : ""}`}>{s.title}</span>
              <span className="text-sm text-ink-2">{s.text}</span>
            </span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
        <PixelFrame title={`${window} · ${step.label}`}>
          <Image key={step.key} src={step.focus.src} alt={step.alt} width={step.focus.w} height={step.focus.h} sizes="(min-width: 1024px) 55vw, 100vw" className="block w-full" />
          <figcaption className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-ink-2">
            <span>{step.caption}</span>
            <button
              ref={enlargeButton}
              type="button"
              onClick={() => setOpen({ ...step.full, alt: step.alt, title: `${window} · ${step.label}`, text: step.caption })}
              className="link whitespace-nowrap"
            >
              {enlarge} ↗
            </button>
          </figcaption>
        </PixelFrame>
      </div>
      <ImageDialog
        shot={open}
        onClose={() => {
          setOpen(null);
          enlargeButton.current?.focus();
        }}
        closeLabel={close}
      />
    </div>
  );
}
