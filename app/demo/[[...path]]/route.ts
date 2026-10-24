import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getDemo } from "@/lib/demo/store";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".wasm": "application/wasm",
};
/** Names Vite gives a content hash: cached for good. Everything else (pages, sw.js, data) is revalidated. */
const HASHED = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;

/** The sample game and the Studio demo, served from the engine release's web archive (lib/demo/store.ts). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const parts = (await params).path ?? [];
  // /demo without its slash: the game's service worker is scoped to /demo/, so send it there.
  if (req.nextUrl.pathname === "/demo")
    return NextResponse.redirect(new URL(`/demo/${req.nextUrl.search}`, req.nextUrl.origin), 308);
  if (parts.some((p) => p === ".." || p === "." || p === "" || p.includes("\\") || p.startsWith(".")))
    return new NextResponse("bad path", { status: 400 });
  let demo;
  try {
    demo = await getDemo();
  } catch (e) {
    console.warn(`[demo] ${(e as Error).message}`);
    return new NextResponse("the demo is unavailable for a moment", { status: 503, headers: { "retry-after": "60" } });
  }
  if (!demo) return new NextResponse("no release carries the demo yet", { status: 404 });
  // The archive lives outside the project (.cache/): no build-time tracing of it.
  const root = path.resolve(/* turbopackIgnore: true */ demo.root);
  let file = path.resolve(/* turbopackIgnore: true */ root, parts.join("/"));
  if (file !== root && !file.startsWith(root + path.sep)) return new NextResponse("bad path", { status: 400 });
  try {
    let s = await stat(file);
    if (s.isDirectory()) {
      file = path.join(/* turbopackIgnore: true */ file, "index.html");
      s = await stat(file);
    }
    if (!s.isFile()) return new NextResponse("not found", { status: 404 });
    const body = await readFile(file);
    const name = path.basename(file);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "content-length": String(s.size),
        "cache-control": HASHED.test(name) ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
        "x-demo-version": demo.source.version,
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
