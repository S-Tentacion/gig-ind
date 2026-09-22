import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ error: "Email sign-in and password-reset links are disabled. Sign in with your registered email address and password." }, { status: 410 });
}
