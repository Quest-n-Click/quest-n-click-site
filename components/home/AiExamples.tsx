"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";

export interface AiExample {
  key: string;
  tab: string;
  prompt: string;
  how: string;
}

/** Example requests to an assistant: illustrations of what can be asked, not a live conversation. */
export function AiExamples({ examples, title, tag, shot, shotAlt }: { examples: AiExample[]; title: string; tag: string; shot: string; shotAlt: string }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, delta: number) => {
    const to = (from + delta + examples.length) % examples.length;
    setActive(to);
    refs.current[to]?.focus();
  };
  const ex = examples[active];
  return (
    <div className="frame border-grass/40 shadow-[5px_5px_0_var(--shadow)]">
      <div className="flex items-center gap-2 border-b border-line bg-paper-3 px-5 py-4 text-sm">
        <span aria-hidden className="text-grass">✦</span>
        <span>{title}</span>
        <span className="pixel ml-auto text-[0.6rem] text-grass">{tag}</span>
      </div>
      <div role="tablist" aria-label={title} className="flex flex-wrap gap-2 px-5 pt-4">
        {examples.map((e, i) => (
          <button
            key={e.key}
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
            onKeyDown={(ev) => {
              if (ev.key === "ArrowRight" || ev.key === "ArrowDown") move(i, 1);
              if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") move(i, -1);
            }}
            className="tab tab-grass"
          >
            {e.tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} className="px-5 pb-5 pt-4">
        <blockquote className="min-h-[5.5rem] text-lg leading-relaxed">{ex.prompt}</blockquote>
        <p className="mt-3 min-h-[3.5rem] text-sm text-ink-2">{ex.how}</p>
      </div>
      <figure className="border-t border-line bg-[#121b28]">
        <Image src={shot} alt={shotAlt} width={1000} height={614} sizes="(min-width: 1024px) 50vw, 100vw" className="max-h-56 w-full object-cover object-[center_5%]" />
        <figcaption className="px-4 py-2.5 text-xs text-ink-3">{shotAlt}</figcaption>
      </figure>
    </div>
  );
}
