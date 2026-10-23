import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import type { Root as HastRoot } from "hast";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { messages } from "@/messages";
import { CodeBlock } from "./CodeBlock";

type Props = Record<string, unknown> & { children?: React.ReactNode };

function componentsFor(locale: Locale): Components {
  const t = messages[locale].docs;
  return {
    a: ({ href, children, ...rest }: Props) => {
      const h = typeof href === "string" ? href : "";
      if (h.startsWith("/")) return <Link href={h} {...(rest as object)}>{children}</Link>;
      const external = /^https?:/.test(h);
      return (
        <a href={h} {...(rest as object)} rel={external ? "noopener" : undefined}>
          {children}
        </a>
      );
    },
    pre: ({ children, ...rest }: Props) => <CodeBlock {...(rest as object)}>{children}</CodeBlock>,
    img: ({ src, alt, ...rest }: Props) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={String(src)} alt={String(alt ?? "")} loading="lazy" decoding="async" {...(rest as object)} />
    ),
    "qnc-claim": ({ children, ...rest }: Props) => {
      const kind = String(rest["data-kind"] ?? "guarantee") as "guarantee" | "limit" | "measure";
      const id = String(rest["data-id"] ?? "");
      const tone = kind === "guarantee" ? "border-grass" : kind === "limit" ? "border-rose" : "border-sky";
      return (
        <aside data-claim={kind} data-claim-id={id} className={`my-5 rounded-[4px] border-2 ${tone} bg-paper-2 p-4 shadow-[4px_4px_0_0_var(--line)]`}>
          <p className="pixel mb-2 flex flex-wrap items-center gap-2 text-ink-2">
            <span className={kind === "guarantee" ? "text-grass" : kind === "limit" ? "text-rose" : "text-sky-deep"}>{t.claim[kind]}</span>
            <code className="!bg-transparent !p-0 !text-[0.7rem] font-mono text-ink-3">{id}</code>
          </p>
          <div className="[&>p]:m-0 [&>p+p]:mt-2">{children}</div>
        </aside>
      );
    },
    "qnc-applies": (rest: Props) => {
      const from = String(rest["data-from"] ?? "");
      const to = String(rest["data-to"] ?? "");
      const since = String(rest["data-since"] ?? "");
      const state = String(rest["data-state"] ?? "");
      const parts: string[] = [];
      if (from || to) parts.push(`${t.appliesFrom} ${from || "…"} ${t.appliesTo} ${to || "…"}`);
      if (since) parts.push(`${t.since} ${since}`);
      if (state) parts.push(state === "deprecated" ? t.deprecated : t.archived);
      if (parts.length === 0) return null;
      return <p className="pixel !mt-2 text-ink-3" data-applies>{parts.join(", ")}</p>;
    },
    "qnc-step": (rest: Props) => <span id={`step-${String(rest["data-step"] ?? "")}`} className="block scroll-mt-20" />,
    "qnc-generated": ({ children }: Props) => (
      <div className="my-4 border-l-4 border-sky pl-4" data-generated>
        <p className="pixel !mt-0 mb-2 text-ink-3">{t.generated}</p>
        {children}
      </div>
    ),
  } as unknown as Components;
}

const cache = new Map<Locale, Components>();

/** A hast tree from the Markdown pipeline, as React elements. */
export function Hast({ tree, locale }: { tree: HastRoot; locale: Locale }) {
  let components = cache.get(locale);
  if (!components) {
    components = componentsFor(locale);
    cache.set(locale, components);
  }
  return <>{toJsxRuntime(tree, { Fragment, jsx, jsxs, components, passNode: false })}</>;
}
