import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDocs } from "@/lib/docs/store";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/** The images of the documentation archive. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const rel = parts.join("/");
  if (parts.some((p) => p === ".." || p === "" || p.includes("\\"))) return new NextResponse("bad path", { status: 400 });
  try {
    const docs = await getDocs();
    const root = path.join(docs.root, "assets");
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep)) return new NextResponse("bad path", { status: 400 });
    const s = await stat(file);
    if (!s.isFile()) return new NextResponse("not found", { status: 404 });
    const body = await readFile(file);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "content-length": String(s.size),
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
