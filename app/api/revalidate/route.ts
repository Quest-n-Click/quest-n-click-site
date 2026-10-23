import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { refreshDocs } from "@/lib/docs/store";
import { clearGithubMemo } from "@/lib/github";
import { clearMemo } from "@/lib/memo";

export const dynamic = "force-dynamic";

function authorised(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called by the engine's release workflow: re-read GitHub and load a newer documentation archive if there is one. */
export async function POST(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  revalidateTag("github", "max");
  clearGithubMemo();
  clearMemo("home:");
  clearMemo("changelog:");
  try {
    const result = await refreshDocs();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
