"use client";
import { Command } from "cmdk";
import MiniSearch from "minisearch";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SEARCH_OPTIONS, type SearchDoc } from "@/lib/docs/search-options";
import { href, type Locale } from "@/lib/i18n";
import { messages } from "@/messages";

type Hit = { id: string; title: string; domain: string; type: string };

const listeners = new Set<() => void>();
export function openSearch() {
  for (const l of listeners) l();
}

export function SearchButton({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const t = messages[locale].docs;
  return (
    <button
      type="button"
      onClick={openSearch}
      className={`flex items-center gap-2 rounded-[6px] border-2 border-ink bg-paper-2 text-left text-sm text-ink-2 hover:bg-paper-3 ${compact ? "px-3 py-1.5" : "w-full px-3 py-2"}`}
      data-search-button
    >
      <span aria-hidden>⌕</span>
      <span className="flex-1">{t.search}</span>
      {compact ? null : <kbd className="pixel text-[0.55rem] text-ink-3">⌘K</kbd>}
    </button>
  );
}

/** A command palette over the documentation: the index comes from the server once, the search runs in the browser. */
export function SearchPalette({ locale }: { locale: Locale }) {
  const t = messages[locale].docs;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const index = useRef<MiniSearch<SearchDoc> | null>(null);
  const loading = useRef<Promise<void> | null>(null);

  const load = useCallback(() => {
    if (index.current || loading.current) return loading.current ?? Promise.resolve();
    loading.current = fetch(`/api/search-index/${locale}`)
      .then((r) => r.text())
      .then((json) => {
        index.current = MiniSearch.loadJSON<SearchDoc>(json, SEARCH_OPTIONS);
      })
      .catch(() => {
        loading.current = null;
      });
    return loading.current;
  }, [locale]);

  useEffect(() => {
    const show = () => {
      setOpen(true);
      void load();
    };
    listeners.add(show);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      listeners.delete(show);
      window.removeEventListener("keydown", onKey);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) return;
    void load().then(() => {
      const ms = index.current;
      if (!ms) return;
      setHits(
        ms
          .search(q)
          .slice(0, 12)
          .map((r) => ({ id: String(r.id), title: r.title as string, domain: r.domain as string, type: r.type as string })),
      );
    });
  }, [query, open, load]);

  if (!open) return null;
  const shown = query.trim() ? hits : [];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0a0a12]/70 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <Command
        label={t.search}
        shouldFilter={false}
        className="frame w-full max-w-xl shadow-[6px_6px_0_var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder={t.search}
          className="w-full border-b-2 border-line bg-transparent px-4 py-3 text-lg outline-none"
        />
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() && shown.length === 0 ? <Command.Empty className="px-3 py-6 text-center text-ink-2">{t.noResults}</Command.Empty> : null}
          {shown.map((h) => (
            <Command.Item
              key={h.id}
              value={h.id}
              onSelect={() => {
                setOpen(false);
                setQuery("");
                router.push(`${href(locale, "/docs")}/${h.id}`);
              }}
              className="flex cursor-pointer items-baseline gap-3 rounded-[4px] px-3 py-2 data-[selected=true]:bg-ink data-[selected=true]:text-paper"
            >
              <span className="pixel w-20 shrink-0 truncate text-[0.55rem] opacity-70">{t.domains[h.domain] ?? h.domain}</span>
              <span className="flex-1">{h.title}</span>
              <span className="text-xs opacity-60">{t.types[h.type] ?? h.type}</span>
            </Command.Item>
          ))}
        </Command.List>
        <p className="pixel border-t-2 border-line px-4 py-2 text-[0.55rem] text-ink-3">{t.searchHint} · esc</p>
      </Command>
    </div>
  );
}
