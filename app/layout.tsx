import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { GigoloGuide } from "@/components/gigolo-guide";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AgeGate } from "@/components/age-gate";
import { AuthHashSession } from "@/components/auth-hash-session";
import { LocaleProvider } from "@/components/locale-provider";
import { PrismUpgradeProvider } from "@/components/prism-upgrade-modal";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://gig-ind.vercel.app").replace(/\/$/, "");
const privatePaths = new Set(["/login", "/register", "/set-password", "/profile", "/kit-orders", "/boost-credits", "/payments", "/messages", "/buy", "/join", "/auth/callback"]);

const pageDetails: Record<string, { title: string; description: string }> = {
  "/": { title: "Gigolo India | Verified Male Companions & Escorts Across India", description: "Meet verified, discreet male companions across India. Browse profiles, chat privately, and book safely. Adults 18+ only." },
  "/browse": { title: "Browse Verified Companions | Gigolo India", description: "Browse private previews of verified adult companion profiles across India. Sign in for member access." },
  "/membership": { title: "Membership & PRISM Access | Gigolo India", description: "Explore Gigolo India membership options and PRISM access for private, verified adult members." },
  "/become-companion": { title: "Become a Verified Companion | Gigolo India", description: "Learn about the companion application, verification, safety, and privacy process at Gigolo India." },
  "/privacy": { title: "Privacy Policy | Gigolo India", description: "Read Gigolo India's privacy, eligibility, safety, and consent-first community policy." },
  "/terms": { title: "Terms of Use | Gigolo India", description: "Read the terms for using Gigolo India safely, respectfully, and in accordance with local laws." },
  "/safety": { title: "Safety Standards | Gigolo India", description: "Practical safety, consent, privacy, and reporting standards for Gigolo India members." },
  "/community-guidelines": { title: "Community Guidelines | Gigolo India", description: "The consent, privacy, respect, and safety standards for the Gigolo India community." },
  "/how-it-works": { title: "How Gigolo India Works | Verified Adult Member Access", description: "Learn how verified adult members browse profiles, chat privately, set clear boundaries, and use Gigolo India safely." },
  "/faq": { title: "Frequently Asked Questions | Gigolo India", description: "Answers about membership, verification, privacy, safety, and using Gigolo India responsibly." },
};

function getRequestContext(headersList: Headers) {
  const path = headersList.get("x-gigolo-public-path") || "/en";
  const match = path.match(/^\/(en|hi)(\/.*)?$/);
  const locale = match?.[1] === "hi" ? "hi" : "en";
  const pagePath = match?.[2] || "/";
  return { locale, pagePath, publicPath: path };
}

export async function generateMetadata(): Promise<Metadata> {
  const context = getRequestContext(await headers());
  const cityMatch = context.pagePath.match(/^\/browse\/([a-z-]+)$/);
  const cityName = cityMatch?.[1] ? cityMatch[1].replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : null;
  const detail = cityName ? { title: `Male Companions in ${cityName} | Gigolo India`, description: `Browse verified adult male companion profiles in ${cityName}. Private member access, clear boundaries, and safety-first guidance.` } : pageDetails[context.pagePath] || pageDetails["/"];
  const alternatePath = (locale: "en" | "hi") => `/${locale}${context.pagePath === "/" ? "" : context.pagePath}`;
  const indexable = !privatePaths.has(context.pagePath);
  const title = context.locale === "hi" ? `${detail.title} | हिंदी` : detail.title;

  return {
    metadataBase: new URL(siteUrl),
    applicationName: "Gigolo India",
    title: { default: title, template: "%s | Gigolo India" },
    description: detail.description,
    keywords: ["Gigolo India", "Gig India", "private adult companionship", "verified male companions India", "discreet member platform"],
    alternates: { canonical: context.publicPath, languages: { "en-IN": alternatePath("en"), "hi-IN": alternatePath("hi"), "x-default": alternatePath("en") } },
    robots: indexable ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } } : { index: false, follow: false },
    openGraph: { type: "website", locale: context.locale === "hi" ? "hi_IN" : "en_IN", url: context.publicPath, siteName: "Gigolo India", title, description: detail.description, images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gigolo India" }] },
    twitter: { card: "summary_large_image", title, description: detail.description, images: ["/og.png"] },
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#0d0918", colorScheme: "dark" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, pagePath } = getRequestContext(await headers());
  const organizationJsonLd = { "@context": "https://schema.org", "@type": "Organization", name: "Gigolo India", url: siteUrl, logo: `${siteUrl}/favicon.svg`, description: "A private, adults-only companion membership platform focused on verified access, consent, and member privacy." };
  const websiteJsonLd = { "@context": "https://schema.org", "@type": "WebSite", name: "Gigolo India", url: siteUrl, inLanguage: locale === "hi" ? "hi-IN" : "en-IN", potentialAction: { "@type": "SearchAction", target: `${siteUrl}/${locale}/browse?city={search_term_string}`, "query-input": "required name=search_term_string" } };
  const breadcrumbJsonLd = pagePath === "/" ? null : { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/${locale}` }, { "@type": "ListItem", position: 2, name: pagePath.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") || "Page", item: `${siteUrl}/${locale}${pagePath}` }] };
  const faqJsonLd = pagePath === "/" ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Who is this for?", acceptedAnswer: { "@type": "Answer", text: "Adults 18+ who want discreet, consent-based male companionship." } }, { "@type": "Question", name: "Is it safe?", acceptedAnswer: { "@type": "Answer", text: "Every companion is ID-verified and every member is age-verified. Support is available around the clock." } }, { "@type": "Question", name: "Will my details stay private?", acceptedAnswer: { "@type": "Answer", text: "Aliases, private chat, and neutral billing are standard." } }] } : null;
  return <html lang={locale} suppressHydrationWarning className={cn("font-sans", geist.variable)}><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />{breadcrumbJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />}{faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}<ThemeProvider><LocaleProvider><PrismUpgradeProvider><AuthHashSession /><AgeGate>{children}</AgeGate><GigoloGuide /></PrismUpgradeProvider></LocaleProvider></ThemeProvider></body></html>;
}
