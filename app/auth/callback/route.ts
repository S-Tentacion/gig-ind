import { NextRequest, NextResponse } from "next/server";
import { getMemberByContact } from "@/lib/db";
import { createSupabaseRouteClient } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login?error=magic-link", request.url);
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(loginUrl);

  const response = NextResponse.redirect(new URL("/", request.url));
  try {
    const supabase = createSupabaseRouteClient(request, response);
    const result = await supabase.auth.exchangeCodeForSession(code);
    const contact = result.data.user?.email || result.data.user?.phone;
    const member = contact ? getMemberByContact(contact) : undefined;
    if (result.error || !result.data.session || !member) return NextResponse.redirect(loginUrl);

    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: result.data.session.expires_in, path: "/" };
    response.cookies.set("gigolo_india_access_token", result.data.session.access_token, options);
    response.cookies.set("gigolo_india_refresh_token", result.data.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}
