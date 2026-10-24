"use client";
import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n";
import { messages } from "@/messages";

type Theme = "light" | "dark";
const EVENT = "qnc-theme";

/** The theme in force: the visitor's choice (applied before paint by the layout's script), else the system's. */
function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  window.addEventListener(EVENT, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const t = messages[locale].theme;
  const theme = useSyncExternalStore(subscribe, current, () => null);
  const toggle = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("qnc-theme", next);
    } catch {
      /* storage unavailable: the choice lasts for the page */
    }
    window.dispatchEvent(new Event(EVENT));
  };
  const label = theme === "light" ? t.toDark : t.toLight;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-theme-toggle
      className="flex size-10 items-center justify-center rounded-[4px] border border-line text-ink-2 hover:border-sun hover:text-ink"
    >
      <span aria-hidden>{theme === "light" ? "☾" : "☀"}</span>
    </button>
  );
}
