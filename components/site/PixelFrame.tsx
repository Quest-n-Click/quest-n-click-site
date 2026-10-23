/** A screenshot or a demo in the site's frame: a hard border and an offset shadow. */
export function PixelFrame({
  children,
  tone = "ink",
  className = "",
  title,
}: {
  children: React.ReactNode;
  tone?: "ink" | "sun" | "sky";
  className?: string;
  title?: string;
}) {
  const shadow = tone === "sun" ? "hard-sun" : tone === "sky" ? "hard-sky" : "hard";
  return (
    <figure className={`${shadow} overflow-hidden rounded-[4px] bg-paper-2 ${className}`}>
      {title ? (
        <figcaption className="flex items-center gap-2 border-b-2 border-ink bg-paper-3 px-3 py-1.5">
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-rose" />
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-sun" />
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-grass" />
          <span className="pixel ml-2 truncate text-ink-2">{title}</span>
        </figcaption>
      ) : null}
      {children}
    </figure>
  );
}
