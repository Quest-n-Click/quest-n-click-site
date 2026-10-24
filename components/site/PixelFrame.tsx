/** A screenshot or a demo in a window frame: a thin border, a title bar, an optional honey relief. */
export function PixelFrame({
  children,
  tone = "ink",
  className = "",
  title,
  tag,
}: {
  children: React.ReactNode;
  tone?: "ink" | "sun" | "sky";
  className?: string;
  title?: string;
  tag?: string;
}) {
  return (
    <figure className={`frame ${tone === "sun" ? "frame-sun" : ""} ${className}`}>
      {title ? (
        <figcaption className="frame-bar">
          <span aria-hidden className="tracking-[2px] text-[0.5rem] text-ink-3">●●●</span>
          <span className="truncate">{title}</span>
          {tag ? <span className="pixel ml-auto text-[0.6rem] text-ink-3">{tag}</span> : null}
        </figcaption>
      ) : null}
      {children}
    </figure>
  );
}
