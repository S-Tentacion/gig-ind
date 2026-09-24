"use client";

import { LocalizedLink as Link, useLocalizedRouter } from "@/components/localization-provider";
import { ArrowRight, Box, ChevronLeft, Clock3, HelpCircle, MapPin, PackageCheck, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { MemberMenu, useSessionMember } from "@/components/member-menu";
import { KitDeliveryStepper } from "@/components/kit-delivery-stepper";
import { ROUTES } from "@/lib/routes";

export function KitOrdersModule() {
  const router = useLocalizedRouter();
  const { member, loaded } = useSessionMember();

  useEffect(() => {
    if (!loaded) return;
    if (!member) router.replace(ROUTES.login);
    else if (!member.kitPurchased) router.replace(ROUTES.membership);
  }, [loaded, member, router]);
  if (!loaded || !member) return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><Clock3 className="animate-spin" aria-label="Loading orders" /></main>;
  if (!member.kitPurchased) return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><Clock3 className="animate-spin" aria-label="Redirecting to Kit" /></main>;

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d0918] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[150px]" /><div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-[150px]" /></div>
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-cyan-100"><ShieldCheck size={18} /></span><span><span className="brand-wordmark block text-[10px] font-bold uppercase tracking-[.24em]">GIGOLO INDIA</span><span className="mt-0.5 block font-serif text-lg tracking-[.1em]">PRISM</span></span></Link><MemberMenu member={member} /></nav>
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-9 lg:px-8 lg:pt-14"><Link href="/" className="inline-flex items-center gap-1.5 text-sm text-violet-100/65 transition hover:text-cyan-100"><ChevronLeft size={16} /> Back to PRISM</Link><div className="mt-7 flex flex-col gap-6 rounded-[2rem] border border-white/12 bg-[#151022]/85 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100">MY KIT &amp; ORDERS</p><h1 className="mt-3 font-serif text-4xl tracking-[-.055em] sm:text-5xl">Your PRISM Kit.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-violet-100/65">Everything about your Kit delivery and member access is kept together here.</p></div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-cyan-100"><PackageCheck size={12} /> Payment confirmed</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-violet-100/65"><MapPin size={12} /> {member.city}</span></div></div></section>
      <KitDeliveryStepper city={member.city} />
      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 px-5 pb-20 lg:grid-cols-3 lg:px-8"><article className="rounded-[1.5rem] border border-white/12 bg-white/[.035] p-5"><Box size={19} className="text-cyan-100" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-violet-100/45">YOUR KIT</p><h2 className="mt-2 font-serif text-2xl">PRISM member access</h2><p className="mt-3 text-sm leading-6 text-violet-100/65">Your Kit unlocks your private member space and access to PRISM features.</p></article><article className="rounded-[1.5rem] border border-white/12 bg-white/[.035] p-5"><MapPin size={19} className="text-cyan-100" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-violet-100/45">DELIVERY DESTINATION</p><h2 className="mt-2 font-serif text-2xl">{member.city}</h2><p className="mt-3 text-sm leading-6 text-violet-100/65">Your Kit is prepared for the city saved in your member profile.</p><Link href="/profile" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-cyan-100 transition hover:text-white">Update profile <ArrowRight size={14} /></Link></article><article className="rounded-[1.5rem] border border-white/12 bg-white/[.035] p-5"><HelpCircle size={19} className="text-cyan-100" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-violet-100/45">NEED HELP?</p><h2 className="mt-2 font-serif text-2xl">We&apos;re here.</h2><p className="mt-3 text-sm leading-6 text-violet-100/65">For an order, delivery, privacy, or account question, contact Support.</p><Link href="/privacy#safety" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-cyan-100 transition hover:text-white">Contact Support <ArrowRight size={14} /></Link></article></section>
    </main>
  );
}
