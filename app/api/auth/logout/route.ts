import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("gigolo_india_access_token", "", { httpOnly: true, maxAge: 0, path: "/" });
  response.cookies.set("gigolo_india_refresh_token", "", { httpOnly: true, maxAge: 0, path: "/" });
  request.cookies.getAll().filter((cookie) => cookie.name.startsWith("sb-")).forEach((cookie) => response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" }));
  return response;
}
