import type { Metadata } from "next";
import "./globals.css";
import { GlobalActivityToast } from "@/components/global-activity-toast";
import { GigoloGuide } from "@/components/gigolo-guide";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gigolo-india.example"), title: "Gigolo India | Thoughtful connections", description: "A discreet, adult-only companion discovery POC for India.", openGraph: { title: "Gigolo India | PRISM member experience", description: "A privacy-first, adult-only companion discovery POC.", images: ["/og.png"] }, twitter: { card: "summary_large_image", title: "Gigolo India | PRISM member experience", description: "A privacy-first, adult-only companion discovery POC.", images: ["/og.png"] } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}><body><ThemeProvider>{children}<GlobalActivityToast/><GigoloGuide/></ThemeProvider></body></html>; }
