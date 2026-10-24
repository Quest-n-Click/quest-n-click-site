import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { refreshDemo } from "@/lib/demo/store";
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
  const [docs, demo] = await Promise.allSettled([refreshDocs(), refreshDemo()]);
  const body = {
    ok: docs.status === "fulfilled" && demo.status === "fulfilled",
    changed: (docs.status === "fulfilled" && docs.value.changed) || (demo.status === "fulfilled" && demo.value.changed),
    source: docs.status === "fulfilled" ? docs.value.source : { error: (docs.reason as Error).message },
    demo: demo.status === "fulfilled" ? demo.value : { error: (demo.reason as Error).message },
  };
  return NextResponse.json(body, { status: body.ok ? 200 : 502 });
}
