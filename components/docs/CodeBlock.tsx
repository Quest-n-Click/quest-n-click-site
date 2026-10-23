"use client";
import { useRef, useState } from "react";

/** A code block with a copy button. The highlighted code comes from the server. */
export function CodeBlock({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLPreElement>(null);
  const [done, setDone] = useState(false);
  const copy = async () => {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* clipboard unavailable: nothing to do */
    }
  };
  return (
    <div className="group relative">
      <pre ref={ref} {...(rest as object)}>
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="pixel absolute right-2 top-2 rounded-[4px] border border-ink-3 bg-paper-2 px-2 py-1 text-ink-2 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
        aria-label="Copy"
      >
        {done ? "✓" : "copy"}
      </button>
    </div>
  );
}
