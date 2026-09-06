import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ error: "Registration is completed only after verified checkout." }, { status: 410 });
}
