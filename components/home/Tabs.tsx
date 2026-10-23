"use client";
import { useId, useState } from "react";

/** Tabs whose panels are rendered on the server and passed as children, in the order of `labels`. */
export function Tabs({ labels, children }: { labels: string[]; children: React.ReactNode[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {labels.map((label, i) => (
          <button
            key={label}
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            onClick={() => setActive(i)}
            className={`rounded-[6px] border-2 border-ink px-3 py-1.5 text-sm font-semibold ${i === active ? "bg-ink text-paper" : "bg-paper-2 hover:bg-paper-3"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {children.map((panel, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          className="mt-4"
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
