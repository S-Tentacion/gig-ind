import { NextRequest, NextResponse } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const locales = new Set(["en", "hi"]);
const localeCookie = "gigolo_locale";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API calls and public assets must keep their original paths.
  if (pathname.startsWith("/api/")) {
    // Auth endpoints issue their own cookies, and Telegram requires the payment
    // webhook to answer pre-checkout requests within ten seconds.
    if (pathname.startsWith("/api/auth/") || pathname === "/api/payments/webhook") return NextResponse.next();
    return refreshSupabaseSession(request, () => NextResponse.next({ request }));
  }
  if (pathname.startsWith("/_next/") || /\.[^/]+$/.test(pathname)) return NextResponse.next();

  const [firstSegment, ...rest] = pathname.split("/").filter(Boolean);
  if (firstSegment && locales.has(firstSegment)) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/${rest.join("/")}` || "/";
    return refreshSupabaseSession(request, () => {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-gigolo-public-path", pathname);
      const response = NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
      response.cookies.set(localeCookie, firstSegment, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
      return response;
    });
  }

  const savedLocale = request.cookies.get(localeCookie)?.value;
  const locale = savedLocale && locales.has(savedLocale) ? savedLocale : "en";
  const destination = request.nextUrl.clone();
  destination.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
