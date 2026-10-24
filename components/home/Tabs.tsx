"use client";
import { useId, useRef, useState } from "react";

/**
 * Tabs whose panels are rendered on the server and passed as children, in the order of `labels`.
 * Arrow keys move the selection, as the tabs pattern wants.
 */
export function Tabs({ labels, children, tone = "sun" }: { labels: string[]; children: React.ReactNode[]; tone?: "sun" | "grass" }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, delta: number) => {
    const to = (from + delta + labels.length) % labels.length;
    setActive(to);
    refs.current[to]?.focus();
  };
  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {labels.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") move(i, 1);
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(i, -1);
            }}
            className={`tab ${tone === "grass" ? "tab-grass" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      {children.map((panel, i) => (
        <div key={i} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== active} className="mt-4">
          {panel}
        </div>
      ))}
    </div>
  );
}
