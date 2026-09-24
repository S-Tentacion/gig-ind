import { ROUTES, SUPPORTED_LOCALES } from "@/lib/routes";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://gig-ind.vercel.app").replace(/\/$/, "");
const publicRoutes = [ROUTES.home, ROUTES.browse, ROUTES.membership, ROUTES.howItWorks, ROUTES.safety, ROUTES.faq, ROUTES.becomeCompanion, ROUTES.privacy, ROUTES.terms, ROUTES.communityGuidelines];
const cities = ["delhi", "mumbai", "bengaluru", "hyderabad", "pune", "goa", "chennai", "kolkata"];

export function GET() {
  const lastModified = new Date().toISOString();
  const urls = SUPPORTED_LOCALES.flatMap((locale) => [
    ...publicRoutes.map((route) => `${siteUrl}/${locale}${route === ROUTES.home ? "" : route}`),
    ...cities.map((city) => `${siteUrl}/${locale}${ROUTES.browseCity(city)}`),
  ]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${lastModified}</lastmod><changefreq>weekly</changefreq></url>`).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
