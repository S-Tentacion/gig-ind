"use client";

import { LocalizedLink as Link, useLocalizedRouter } from "@/components/localization-provider";
import { ChevronLeft, Clock3, CreditCard, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { MemberMenu, useSessionMember } from "@/components/member-menu";
import { PrismBoostPanel } from "@/components/prism-boost-panel";
import { ROUTES } from "@/lib/routes";

export function BoostCreditsModule() {
  const router = useLocalizedRouter();
  const { member, loaded } = useSessionMember();

  useEffect(() => {
    if (!loaded) return;
    if (!member) router.replace(ROUTES.login);
    else if (!member.kitPurchased) router.replace(ROUTES.membership);
  }, [loaded, member, router]);

  if (!loaded || !member) return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><Clock3 className="animate-spin" aria-label="Loading Boost credits" /></main>;
  if (!member.kitPurchased) return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><Clock3 className="animate-spin" aria-label="Redirecting to Kit" /></main>;

  return <main className="min-h-screen overflow-hidden bg-[#0d0918] text-white">
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[150px]" /><div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-[150px]" /></div>
    <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-cyan-100"><ShieldCheck size={18} /></span><span><span className="brand-wordmark block text-[10px] font-bold uppercase tracking-[.24em]">GIGOLO INDIA</span><span className="mt-0.5 block font-serif text-lg tracking-[.1em]">PRISM</span></span></Link><MemberMenu member={member} /></nav>
    <section className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 pb-20 pt-9 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pt-14">
      <div><Link href="/" className="inline-flex items-center gap-1.5 text-sm text-violet-100/65 transition hover:text-cyan-100"><ChevronLeft size={16} /> Back to PRISM</Link><p className="mt-9 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><Rocket size={14} /> BOOST CREDITS</p><h1 className="mt-3 max-w-xl font-serif text-5xl leading-[.94] tracking-[-.06em] sm:text-6xl">A little more <span className="bg-gradient-to-r from-fuchsia-200 via-amber-100 to-cyan-200 bg-clip-text text-transparent">PRISM.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-violet-100/70">Purchase credits when you want them, then start one hour of Profile Boost whenever the moment feels right.</p>
        <div className="mt-9 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-white/12 bg-white/[.035] p-4"><Clock3 size={18} className="text-cyan-100" /><h2 className="mt-5 text-sm font-semibold">One credit</h2><p className="mt-2 text-xs leading-5 text-violet-100/60">One credit activates one hour of Boost.</p></article><article className="rounded-2xl border border-white/12 bg-white/[.035] p-4"><CreditCard size={18} className="text-cyan-100" /><h2 className="mt-5 text-sm font-semibold">Choose your amount</h2><p className="mt-2 text-xs leading-5 text-violet-100/60">Select from ⭐ 875 up to ⭐ 8,750.</p></article><article className="rounded-2xl border border-white/12 bg-white/[.035] p-4"><Sparkles size={18} className="text-cyan-100" /><h2 className="mt-5 text-sm font-semibold">Use later</h2><p className="mt-2 text-xs leading-5 text-violet-100/60">Saved credits remain ready for you.</p></article></div>
        <p className="mt-8 max-w-xl text-xs leading-5 text-violet-100/50">Boost does not guarantee placement, visibility, bookings, income, or any outcome.</p>
      </div>
      <PrismBoostPanel />
    </section>
  </main>;
}
