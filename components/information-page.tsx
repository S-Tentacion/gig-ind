"use client";

import { LocalizedLink as Link } from "@/components/localization-provider";
import { ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { useTranslation } from "@/components/localization-provider";
import { ROUTES } from "@/lib/routes";

export function InformationPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: Array<[string, string]> }) {
  const { tr } = useTranslation();
  return <main data-no-translate className="min-h-screen bg-[#0d0918] text-white"><nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-8"><Link href={ROUTES.home} className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} className="text-cyan-100" /> Gigolo India</Link><Link href={ROUTES.browse} className="text-sm font-semibold text-cyan-100">{tr("Browse profiles")}</Link></nav><article className="mx-auto max-w-4xl px-5 pb-16 pt-12 lg:px-8 lg:pb-24"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-100">{tr(eyebrow)}</p><h1 className="mt-4 font-serif text-5xl tracking-[-.06em] sm:text-6xl">{tr(title)}</h1><p className="mt-6 max-w-3xl text-base leading-8 text-violet-100/75">{tr(intro)}</p><div className="mt-12 space-y-6">{sections.map(([heading, sectionCopy]) => <section key={heading} className="rounded-[1.5rem] border border-white/12 bg-white/[.035] p-6"><h2 className="font-serif text-3xl">{tr(heading)}</h2><p className="mt-4 text-sm leading-7 text-violet-100/70">{tr(sectionCopy)}</p></section>)}</div></article><SiteFooter /></main>;
}
