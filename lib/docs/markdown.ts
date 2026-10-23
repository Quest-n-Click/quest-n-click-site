import "server-only";
import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighter, type Highlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { visit, SKIP } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";
import type { Root as MdastRoot, Html, Blockquote, Heading, Link, Image, Definition, Code, Parent, Text } from "mdast";
import type { Root as HastRoot, Element } from "hast";
import type { Locale } from "@/lib/i18n";
import { ENGINE_REPO_URL } from "@/lib/i18n";

export interface RenderOptions {
  lang: Locale;
  /** The commit the pages were written for: links to repository files point at it. */
  productCommit: string;
  /** Drop the first H1 (the page shell prints the title from the index). */
  dropTitle?: boolean;
  /** Where page links go: `/docs/<id>` or `/fr/docs/<id>`. */
  docsBase: string;
  /** Where the archive's images are served. */
  assetsBase: string;
  /** Rewrite repository-relative links (`../../path`) to GitHub. */
  repoLinks?: boolean;
}

const ANCHOR = /^<a\s+name="([^"]+)"\s*><\/a>$/i;
const APPLIES = /^<!--\s*applies:\s*([\d.]*)\.\.([\d.]*)(?:\s+since\s+([\d.]+))?(?:\s+(deprecated|archived))?\s*-->$/;
const STEP = /^<!--\s*step:\s*([^\s-]+)\s*-->$/;
const GENERATED = /^<!--\s*generated:(begin|end)\s*-->$/;
const CLAIM = /^\[!(GUARANTEE|LIMIT|MEASURE)\s+id=([\w.-]+)\]\s*/;
const SAFE_HTML =
  /^<\/?(a|details|summary|img|br|sub|sup|kbd|p|div|span|em|strong|code|pre|table|thead|tbody|tr|td|th|ul|ol|li|blockquote|hr|b|i|u|small|picture|source|video|figure|figcaption|dl|dt|dd)\b/i;

type Mutable = Parent & { children: Parent["children"] };

/**
 * `<a name="x"></a>` before a heading becomes that heading's id. CommonMark reads that line as a paragraph of two
 * inline html nodes (an open tag and a close tag on one line is not an html block), so both shapes are handled.
 * Html that is really a placeholder (`<id>`, `<file>`) becomes text.
 */
const remarkQncAnchors: Plugin<[], MdastRoot> = () => (tree) => {
  const slugger = new GithubSlugger();
  const anchorOf = (node: MdastRoot["children"][number]): string | null => {
    if (node.type === "html") return ANCHOR.exec((node as Html).value.trim())?.[1] ?? null;
    if (node.type === "paragraph" && node.children.every((c) => c.type === "html")) {
      return ANCHOR.exec(node.children.map((c) => (c as Html).value).join("").trim())?.[1] ?? null;
    }
    return null;
  };
  // Block level: an anchor, then the heading it names.
  const children = tree.children;
  for (let i = 0; i < children.length; i++) {
    const id = anchorOf(children[i]);
    if (!id) continue;
    const next = children[i + 1];
    if (next && next.type === "heading") {
      const h = next as Heading;
      h.data = { ...h.data, hProperties: { ...(h.data?.hProperties ?? {}), id } };
      children.splice(i, 1);
      i--;
    } else {
      children[i] = { type: "html", value: `<span id="${id}"></span>` } as Html;
    }
  }
  // Inline level: placeholders written as tags become text.
  visit(tree, "html", (node: Html, index, parent) => {
    if (!parent || index === undefined) return;
    const html = node.value.trim();
    if (html.startsWith("<!--") || SAFE_HTML.test(html) || /^<\/[a-z]+>$/i.test(html)) return;
    (parent as Mutable).children[index] = { type: "text", value: node.value } as Text;
  });
  // Headings without an explicit id get a GitHub-style slug.
  visit(tree, "heading", (node: Heading) => {
    const props = (node.data?.hProperties ?? {}) as Record<string, unknown>;
    if (!props.id) node.data = { ...node.data, hProperties: { ...props, id: slugger.slug(toString(node)) } };
  });
};

/** Version markers, step markers and generated regions become custom elements. */
const remarkQncMarkers: Plugin<[], MdastRoot> = () => (tree) => {
  const children = tree.children as MdastRoot["children"];
  const out: MdastRoot["children"] = [];
  let generated: Parent | null = null;
  for (const node of children) {
    if (node.type === "html") {
      const html = (node as Html).value.trim();
      let m = APPLIES.exec(html);
      if (m) {
        (generated?.children ?? out).push({
          type: "paragraph",
          children: [],
          data: {
            hName: "qnc-applies",
            hProperties: { dataFrom: m[1] || "", dataTo: m[2] || "", dataSince: m[3] || "", dataState: m[4] || "" },
          },
        } as unknown as MdastRoot["children"][number]);
        continue;
      }
      m = STEP.exec(html);
      if (m) {
        (generated?.children ?? out).push({
          type: "paragraph",
          children: [],
          data: { hName: "qnc-step", hProperties: { dataStep: m[1] } },
        } as unknown as MdastRoot["children"][number]);
        continue;
      }
      m = GENERATED.exec(html);
      if (m) {
        if (m[1] === "begin" && !generated) {
          generated = { type: "paragraph", children: [], data: { hName: "qnc-generated" } } as unknown as Parent;
          out.push(generated as unknown as MdastRoot["children"][number]);
        } else if (m[1] === "end") {
          generated = null;
        }
        continue;
      }
      if (html.startsWith("<!--")) continue; // any other comment
    }
    (generated?.children ?? out).push(node);
  }
  tree.children = out;
};

/** `> [!GUARANTEE id=x]` blockquotes become `qnc-claim` elements. */
const remarkQncClaims: Plugin<[], MdastRoot> = () => (tree) => {
  visit(tree, "blockquote", (node: Blockquote) => {
    const first = node.children[0];
    if (!first || first.type !== "paragraph") return;
    const lead = first.children[0];
    if (!lead || lead.type !== "text") return;
    const m = CLAIM.exec(lead.value);
    if (!m) return;
    lead.value = lead.value.slice(m[0].length);
    if (!lead.value) first.children.shift();
    if (first.children.length === 0) node.children.shift();
    node.data = { ...node.data, hName: "qnc-claim", hProperties: { dataKind: m[1].toLowerCase(), dataId: m[2] } };
  });
};

/** Links: pages to the site, images to the assets route, repository files to GitHub at the product commit. */
const remarkQncLinks: Plugin<[RenderOptions], MdastRoot> = (o) => (tree) => {
  const page = (url: string): string | null => {
    let m = /^\.\.\/(en|fr)\/([\w.-]+)\.md(#.*)?$/.exec(url);
    if (m) {
      const base = m[1] === o.lang ? o.docsBase : m[1] === "fr" ? "/fr/docs" : "/docs";
      return `${base}/${m[2]}${m[3] ?? ""}`;
    }
    m = /^([\w.-]+)\.md(#.*)?$/.exec(url);
    if (m && !url.startsWith(".")) return `${o.docsBase}/${m[1]}${m[2] ?? ""}`;
    return null;
  };
  const rewrite = (url: string): string => {
    if (/^(https?:|mailto:|#)/.test(url)) return url;
    const p = page(url);
    if (p) return p;
    let m = /^\.\.\/\.\.\/assets\/(.+)$/.exec(url);
    if (m) return `${o.assetsBase}/${m[1]}`;
    m = /^\.\.\/\.\.\/(.+)$/.exec(url);
    if (m && o.repoLinks !== false) return `${ENGINE_REPO_URL}/blob/${o.productCommit}/${m[1]}`;
    if (o.repoLinks !== false && !url.startsWith("/")) return `${ENGINE_REPO_URL}/blob/${o.productCommit}/${url}`;
    return url;
  };
  visit(tree, ["link", "definition", "image"], (node) => {
    const n = node as Link | Definition | Image;
    n.url = rewrite(n.url);
  });
};

/** The first H1 is the title: the page shell prints it. Code fences in the `room` dialect are TypeScript. */
const remarkQncTitle: Plugin<[RenderOptions], MdastRoot> = (o) => (tree) => {
  if (o.dropTitle) {
    const i = tree.children.findIndex((n) => n.type === "heading" && (n as Heading).depth === 1);
    if (i >= 0) tree.children.splice(i, 1);
  }
  visit(tree, "code", (node: Code) => {
    if (node.lang === "room") node.lang = "ts";
    if (node.lang === "room-example") node.lang = "json";
    if (node.lang === "sh") node.lang = "bash";
  });
};

/** A table whose header row is empty (`| | |`) has no header: drop the thead. */
function rehypeEmptyThead() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "thead" || !parent || index === undefined) return;
      const text = toHastText(node).trim();
      if (text === "") {
        (parent.children as Element[]).splice(index, 1);
        return [SKIP, index];
      }
    });
  };
}

function toHastText(node: Element | HastRoot): string {
  let s = "";
  for (const c of node.children) {
    if (c.type === "text") s += c.value;
    else if (c.type === "element") s += toHastText(c);
  }
  return s;
}

let highlighter: Promise<Highlighter> | null = null;
function getHighlighter() {
  highlighter ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["typescript", "javascript", "bash", "json", "yaml", "html", "css", "markdown", "nginx", "diff", "text"],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return highlighter;
}

/** Markdown of the bundle → a hast tree (serialisable), ready for `toJsxRuntime`. */
export async function renderMarkdown(markdown: string, o: RenderOptions): Promise<HastRoot> {
  const hl = await getHighlighter();
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkQncTitle, o)
    .use(remarkQncMarkers)
    .use(remarkQncAnchors)
    .use(remarkQncClaims)
    .use(remarkQncLinks, o)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeShikiFromHighlighter, hl, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: "light-dark()",
      fallbackLanguage: "text",
      addLanguageClass: true,
    })
    .use(rehypeEmptyThead);
  const mdast = processor.parse(markdown);
  const hast = (await processor.run(mdast)) as HastRoot;
  return JSON.parse(JSON.stringify(hast)) as HastRoot; // strip positions and any non-plain data
}

/** The plain text of a Markdown string (excerpts, descriptions). */
export function markdownText(markdown: string, max = 200): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const first = tree.children.find(
    (n) => n.type === "paragraph" && !n.children.every((c) => c.type === "image" || (c.type === "text" && !c.value.trim())),
  );
  const text = first ? toString(first) : toString(tree);
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}
