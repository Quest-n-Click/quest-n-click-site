import { NextResponse, type NextRequest } from "next/server";

/**
 * English lives at the root, French under /fr. Internally every page is app/[locale]/…, so a request without a
 * locale prefix is rewritten to /en/…, and an explicit /en/… is redirected to its canonical root URL.
 * Page ids hold dots (`/docs/create.rooms`), so only real file extensions are left alone.
 */
const STATIC = /\.(png|jpe?g|webp|gif|svg|ico|txt|xml|json|js|css|map|woff2?|ttf|webmanifest)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (STATIC.test(pathname)) return NextResponse.next();
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/en" ? "/" : pathname.slice(3);
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/fr" || pathname.startsWith("/fr/")) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api/|_next/|brand/|gallery/|demo(?:/|$)).*)"],
};
