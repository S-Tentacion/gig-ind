import { NextResponse } from "next/server";
import { getRecentSignupEvents } from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: Request) {
  const afterParam = new URL(request.url).searchParams.get("after") || "0";
  const after = Number.isSafeInteger(Number(afterParam)) ? Math.max(0, Number(afterParam)) : 0;
  try {
    return NextResponse.json({ events: getRecentSignupEvents(after) });
  } catch {
    // Activity toasts are optional UI. Never let an unavailable POC store break the homepage.
    return NextResponse.json({ events: [] });
  }
}
