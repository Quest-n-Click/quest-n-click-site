import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getDemo } from "@/lib/demo/store";
import { PAGES_GAME_URL, PAGES_STUDIO_URL } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".bin": "application/octet-stream",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

/** Hashed build files never change; the pages, the manifest and the service worker are checked on every visit. */
function cacheControl(rel: string): string {
  if (/^assets\/.+-[\w-]{8,}\.\w+$/.test(rel)) return "public, max-age=31536000, immutable";
  if (/\.(html|webmanifest)$/.test(rel) || rel === "sw.js" || /^workbox-.*\.js$/.test(rel)) return "no-cache";
  return "public, max-age=86400";
}

function notYet(): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Quest'n'Click · demo</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111421;color:#e9e7e0;font:17px/1.6 system-ui,sans-serif}main{max-width:40rem;padding:2rem}a{color:#e9be72}</style></head><body><main><h1>The demo moves here with the next release.</h1><p>Until then, the game plays at <a href="${PAGES_GAME_URL}">${PAGES_GAME_URL}</a> and the Studio's demo at <a href="${PAGES_STUDIO_URL}">${PAGES_STUDIO_URL}</a>.</p><p lang="fr">La démo arrive ici avec la prochaine release. D'ici là, le jeu se joue à l'adresse ci-dessus, et la démo du Studio à la seconde.</p><p><a href="/">← Quest'n'Click</a></p></main></body></html>`;
  return new NextResponse(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "retry-after": "3600" } });
}

/** The game and the Studio demo, from the latest release's web archive, at /demo/. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path: parts = [] } = await params;
  const pathname = req.nextUrl.pathname;
  // The game is built for the base `/demo/`: its page must live under that slash, where its service worker reaches.
  if (parts.length === 0 && !pathname.endsWith("/")) {
    // A raw response: NextResponse.redirect would normalise the location back to "/demo" and loop.
    return new Response(null, { status: 308, headers: { location: `/demo/${req.nextUrl.search}` } });
  }
  if (parts.some((p) => p === ".." || p === "" || p.includes("\\"))) return new NextResponse("bad path", { status: 400 });
  let demo;
  try {
    demo = await getDemo();
  } catch (e) {
    return new NextResponse(`the demo is not reachable: ${(e as Error).message}`, { status: 503, headers: { "retry-after": "60" } });
  }
  if (!demo) return parts.length === 0 || parts.join("/") === "studio.html" ? notYet() : new NextResponse("not found", { status: 404 });
  let rel = parts.join("/") || "index.html";
  if (pathname.endsWith("/") && parts.length > 0) rel = `${rel}/index.html`;
  const file = path.resolve(demo.root, rel);
  if (!file.startsWith(demo.root + path.sep)) return new NextResponse("bad path", { status: 400 });
  try {
    const s = await stat(file);
    if (!s.isFile()) return new NextResponse("not found", { status: 404 });
    const body = await readFile(file);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "content-length": String(s.size),
        "cache-control": cacheControl(rel),
        "x-demo-version": demo.source.version,
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
