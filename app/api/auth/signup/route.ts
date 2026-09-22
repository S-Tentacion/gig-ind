import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ error: "Create your account through paid registration. Your password is saved when payment is confirmed." }, { status: 410 });
}
