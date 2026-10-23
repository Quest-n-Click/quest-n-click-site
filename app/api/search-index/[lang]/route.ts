import { NextResponse } from "next/server";
import { getDocs } from "@/lib/docs/store";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return new NextResponse("unknown language", { status: 404 });
  try {
    const docs = await getDocs();
    const body = await docs.searchIndex(lang);
    return new NextResponse(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        etag: `"${docs.source.version}-${docs.source.revision}-${lang}"`,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 503 });
  }
}
