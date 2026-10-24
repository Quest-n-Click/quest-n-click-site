"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { PixelFrame } from "@/components/site/PixelFrame";

export interface StudioStep {
  key: string;
  title: string;
  text: string;
  label: string;
  src: string;
  alt: string;
}

/** The Studio's three steps as a vertical tab list; the screenshot follows the selected step. */
export function StudioSteps({ steps, window, tag }: { steps: StudioStep[]; window: string; tag: string }) {
  const [active, setActive] = useState(1);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, delta: number) => {
    const to = (from + delta + steps.length) % steps.length;
    setActive(to);
    refs.current[to]?.focus();
  };
  const step = steps[active];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <PixelFrame title={`${window} · ${step.label}`} tag={tag}>
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
          {steps.map((s, i) => (
            <Image
              key={s.key}
              src={s.src}
              alt={s.alt}
              width={1440}
              height={900}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className={`${i === active ? "block" : "hidden"} aspect-[1.6] w-full object-cover object-top`}
              priority={false}
            />
          ))}
        </div>
      </PixelFrame>
      <div role="tablist" aria-orientation="vertical" className="grid self-center">
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
    </div>
  );
}
