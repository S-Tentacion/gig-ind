import { NextRequest, NextResponse } from "next/server";
import { getMemberByContact } from "@/lib/db";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : "";
  const expiresIn = typeof body.expiresIn === "number" && Number.isFinite(body.expiresIn) ? Math.max(60, Math.min(Math.floor(body.expiresIn), 60 * 60 * 24 * 7)) : 60 * 60;
  if (!accessToken || !refreshToken) return NextResponse.json({ error: "A complete sign-in session was not provided." }, { status: 400 });
  try {
    const { data, error } = await createSupabaseAuthClient().auth.getUser(accessToken);
    const contact = data.user?.email || data.user?.phone;
    const member = contact ? getMemberByContact(contact) : undefined;
    if (error || !member) return NextResponse.json({ error: "This sign-in session is not linked to a member account." }, { status: 401 });
    const response = NextResponse.json({ member: { id: member.id, name: member.username, city: member.city, kitPurchased: member.kitPurchased } });
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: expiresIn, path: "/" };
    response.cookies.set("gigolo_india_access_token", accessToken, options);
    response.cookies.set("gigolo_india_refresh_token", refreshToken, { ...options, maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "SUPABASE_NOT_CONFIGURED") return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    return NextResponse.json({ error: "We could not complete your sign-in." }, { status: 500 });
  }
}
