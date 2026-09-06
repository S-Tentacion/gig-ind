import { NextRequest, NextResponse } from "next/server";
import { getMemberByContact } from "@/lib/db";
import { createSupabaseAuthClient, createSupabaseRouteClient, parseContact } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const credential = parseContact(typeof body.contact === "string" ? body.contact : "");
  if (!credential) return NextResponse.json({ error: "Enter a valid email address or E.164 phone number." }, { status: 400 });
  const member = getMemberByContact(credential.value);
  if (!member) return NextResponse.json({ error: "We couldn’t find an account with that email or phone number." }, { status: 404 });

  try {
    if (credential.kind === "email") {
      const response = NextResponse.json({ verificationRequired: true, channel: "email", magicLinkSent: true });
      const supabase = createSupabaseRouteClient(request, response);
      const result = await supabase.auth.signInWithOtp({ email: credential.value, options: { shouldCreateUser: true, emailRedirectTo: `${new URL(request.url).origin}/auth/callback` } });
      if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
      return response;
    }
    const supabase = createSupabaseAuthClient();
    const result = await supabase.auth.signInWithOtp({ phone: credential.value, options: { shouldCreateUser: true } });
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
    return NextResponse.json({ verificationRequired: true, channel: credential.kind });
  } catch (error) {
    if (error instanceof Error && error.message === "SUPABASE_NOT_CONFIGURED") return NextResponse.json({ error: "Supabase is not configured. Add the project URL and publishable key to .env.local." }, { status: 503 });
    return NextResponse.json({ error: "We could not start sign-in. Please try again." }, { status: 500 });
  }
}
