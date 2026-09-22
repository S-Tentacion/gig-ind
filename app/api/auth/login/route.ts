import { NextRequest, NextResponse } from "next/server";
import { getMemberByContact } from "@/lib/db";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";
import { recordSuccessfulSignIn } from "@/lib/supabase-payment-ledger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) return NextResponse.json({ error: "Enter your email address and password." }, { status: 400 });
  const member = getMemberByContact(email);
  if (!member) return NextResponse.json({ error: "We couldn’t find an account with that email address." }, { status: 404 });
  try {
    const result = await createSupabaseAuthClient().auth.signInWithPassword({ email, password });
    if (result.error || !result.data.session || !result.data.user) return NextResponse.json({ error: result.error?.message || "Your email or password is incorrect." }, { status: 401 });
    try {
      await recordSuccessfulSignIn({ authUserId: result.data.user.id, member });
    } catch {
      // Authentication remains available if the non-critical activity timestamp cannot be updated.
    }
    const response = NextResponse.json({ member: { id: member.id, name: member.username, city: member.city, kitPurchased: member.kitPurchased } });
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: result.data.session.expires_in, path: "/" };
    response.cookies.set("gigolo_india_access_token", result.data.session.access_token, options);
    response.cookies.set("gigolo_india_refresh_token", result.data.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "SUPABASE_NOT_CONFIGURED") return NextResponse.json({ error: "Supabase is not configured. Add the project URL and publishable key to .env.local." }, { status: 503 });
    return NextResponse.json({ error: "We could not sign you in. Please try again." }, { status: 500 });
  }
}
