const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://gig-ind.vercel.app").replace(/\/$/, "");
const routes = ["", "/browse", "/membership", "/how-it-works", "/safety", "/faq", "/become-companion", "/privacy", "/terms", "/community-guidelines"];
const cities = ["delhi", "mumbai", "bengaluru", "hyderabad", "pune", "goa", "chennai", "kolkata"];

export function GET() {
  const lastModified = new Date().toISOString();
  const urls = ["en", "hi"].flatMap((locale) => [
    ...routes.map((route) => `${siteUrl}/${locale}${route}`),
    ...cities.map((city) => `${siteUrl}/${locale}/browse/${city}`),
  ]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${lastModified}</lastmod><changefreq>weekly</changefreq></url>`).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
