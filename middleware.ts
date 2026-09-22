import { NextRequest, NextResponse } from "next/server";

const locales = new Set(["en", "hi"]);
const localeCookie = "gigolo_locale";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API calls and public assets must keep their original paths.
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || /\.[^/]+$/.test(pathname)) return NextResponse.next();

  const [firstSegment, ...rest] = pathname.split("/").filter(Boolean);
  if (firstSegment && locales.has(firstSegment)) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/${rest.join("/")}` || "/";
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-gigolo-public-path", pathname);
    const response = NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
    response.cookies.set(localeCookie, firstSegment, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  const savedLocale = request.cookies.get(localeCookie)?.value;
  const locale = savedLocale && locales.has(savedLocale) ? savedLocale : "en";
  const destination = request.nextUrl.clone();
  destination.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
