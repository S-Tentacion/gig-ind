import { NextRequest, NextResponse } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE } from "@/lib/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API calls and public assets must keep their original paths.
  if (pathname.startsWith("/api/")) {
    // Auth endpoints issue their own cookies. Payment callbacks must remain
    // reachable without a browser session.
    if (pathname.startsWith("/api/auth/") || pathname === "/api/payments/webhook") return NextResponse.next();
    return refreshSupabaseSession(request, () => NextResponse.next({ request }));
  }
  if (pathname.startsWith("/_next/") || /\.[^/]+$/.test(pathname)) return NextResponse.next();

  const [firstSegment, ...rest] = pathname.split("/").filter(Boolean);
  if (isAppLocale(firstSegment)) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/${rest.join("/")}` || "/";
    return refreshSupabaseSession(request, () => {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-gigolo-public-path", pathname);
      const response = NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
      response.cookies.set(LOCALE_COOKIE, firstSegment, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
      return response;
    });
  }

  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(savedLocale) ? savedLocale : DEFAULT_LOCALE;
  const destination = request.nextUrl.clone();
  destination.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
