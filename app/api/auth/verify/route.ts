import { NextResponse } from "next/server";
import { getMemberByContact } from "@/lib/db";
import { createSupabaseAuthClient, parseContact } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const credential = parseContact(typeof body.contact === "string" ? body.contact : "");
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!credential || !/^\d{6,8}$/.test(token)) return NextResponse.json({ error: "Enter your contact and the verification code." }, { status: 400 });

  try {
    const supabase = createSupabaseAuthClient();
    const result = credential.kind === "email"
      ? await supabase.auth.verifyOtp({ email: credential.value, token, type: "email" })
      : await supabase.auth.verifyOtp({ phone: credential.value, token, type: "sms" });
    if (result.error || !result.data.session || !result.data.user) return NextResponse.json({ error: result.error?.message || "We could not verify that code." }, { status: 400 });
    const authenticatedContact = result.data.user.email || result.data.user.phone;
    const member = authenticatedContact ? getMemberByContact(authenticatedContact) : undefined;
    if (!member) return NextResponse.json({ error: "Your verified account is not linked to a project membership." }, { status: 403 });

    const response = NextResponse.json({ member: { id: member.id, name: member.name, city: member.city, kitPurchased: member.kitPurchased } });
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: result.data.session.expires_in, path: "/" };
    response.cookies.set("gigolo_india_access_token", result.data.session.access_token, options);
    response.cookies.set("gigolo_india_refresh_token", result.data.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "SUPABASE_NOT_CONFIGURED") return NextResponse.json({ error: "Supabase is not configured. Add the project URL and publishable key to .env.local." }, { status: 503 });
    return NextResponse.json({ error: "We could not verify your sign-in. Please try again." }, { status: 500 });
  }
}
