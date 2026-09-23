import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!username) return NextResponse.json({ error: "Telegram sign-in is not configured." }, { status: 503 });
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.json({ username, state }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set("telegram_login_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
