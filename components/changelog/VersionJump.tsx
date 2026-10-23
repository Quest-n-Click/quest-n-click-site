"use client";

export function VersionJump({ label, versions, shown }: { label: string; versions: { version: string; anchor: string; date: string | null }[]; shown: number }) {
  const target = (i: number, anchor: string) => (i < shown ? `#${anchor}` : `?all=1#${anchor}`);
  return (
    <aside className="order-first mb-8 lg:order-none lg:mb-0">
      <div className="lg:sticky lg:top-24">
        <label className="pixel block text-ink-3" htmlFor="version-jump">{label}</label>
        <select
          id="version-jump"
          className="mt-2 w-full rounded-[6px] border-2 border-ink bg-paper-2 px-2 py-1.5"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) window.location.assign(e.target.value);
          }}
        >
          <option value="">—</option>
          {versions.map((v, i) => (
            <option key={v.anchor} value={target(i, v.anchor)}>{v.version}{v.date ? ` · ${v.date}` : ""}</option>
          ))}
        </select>
        <ul className="mt-4 hidden max-h-[60vh] space-y-1 overflow-y-auto border-l-2 border-line text-sm lg:block">
          {versions.slice(0, 40).map((v, i) => (
            <li key={v.anchor}>
              <a href={target(i, v.anchor)} className="-ml-0.5 block border-l-2 border-transparent pl-3 tabular-nums text-ink-2 hover:border-ink hover:text-ink">{v.version}</a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
