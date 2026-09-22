import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://gig-ind.vercel.app").replace(/\/$/, "");
  const sitemap = await fetch(`${siteUrl}/sitemap.xml`, { cache: "no-store" });
  if (!sitemap.ok) return NextResponse.json({ error: "Sitemap health check failed." }, { status: 502 });
  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), sitemap: `${siteUrl}/sitemap.xml` });
}
