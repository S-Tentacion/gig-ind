"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Crown,
  Gem,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { SessionMember } from "@/components/member-menu";
import { MemberMenu } from "@/components/member-menu";
import { PrismBoostPanel } from "@/components/prism-boost-panel";
import { LanguageSwitcher, useTranslation } from "@/components/locale-provider";

const transition = { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const };

export function PremiumHome({ member }: { member: SessionMember }) {
  const reduceMotion = useReducedMotion();
  const firstName = member.name.trim().split(/\s+/)[0] || member.name;
  const { t } = useTranslation();
  const openBoostPurchase = () => window.dispatchEvent(new Event("gigolo-india:open-boost-purchase"));

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d0918] text-white selection:bg-cyan-200 selection:text-mauve-950">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" />
        <motion.div
          animate={reduceMotion ? undefined : { x: [0, 90, 0], y: [0, -45, 0], scale: [1, 1.18, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-48 top-24 h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/20 blur-[150px]"
        />
        <motion.div
          animate={reduceMotion ? undefined : { x: [0, -80, 0], y: [0, 55, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-44 bottom-0 h-[34rem] w-[34rem] rounded-full bg-cyan-400/18 blur-[160px]"
        />
      </div>

      <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-cyan-100 transition group-hover:border-cyan-200/70">
            <Gem size={18} />
          </span>
          <span>
            <span className="brand-wordmark block text-[10px] font-bold uppercase tracking-[.24em]">GIGOLO INDIA</span>
            <span className="mt-0.5 block font-serif text-lg tracking-[.1em]">PRISM</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={openBoostPurchase}
            className="hidden rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-200 hover:text-mauve-950 sm:block"
          >
            <Zap size={13} className="mr-1 inline" /> Boost Credits
          </button>
          <MemberMenu member={member} />
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="inline-flex items-center gap-2 border-b border-cyan-200/50 pb-2 text-[10px] font-bold uppercase tracking-[.24em] text-cyan-100"
          >
            <BadgeCheck size={14} /> {t("premium", "memberLabel", { city: member.city })}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.08 }}
            className="mt-7 max-w-2xl font-serif text-5xl leading-[.9] tracking-[-.065em] sm:text-6xl lg:text-7xl"
          >
            {t("premium", "welcomeStart")}
            <br />
            <span className="bg-gradient-to-r from-fuchsia-200 via-amber-100 to-cyan-200 bg-clip-text text-transparent">{t("premium", "welcomeAccent", { firstName })}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.16 }}
            className="mt-6 max-w-xl text-base leading-7 text-violet-100/70"
          >
            {t("premium", "intro")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/browse" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100"><Sparkles size={16} /> {t("premium", "bookNow")}</Link>
            <a href="#concierge" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.045] px-4 py-3 text-xs font-semibold text-violet-100"><Crown size={15} className="text-amber-200" /> {t("premium", "concierge")}</a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, x: 26 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ ...transition, delay: 0.1 }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div id="profile" className="group relative min-h-[29rem] overflow-hidden border border-white/15 bg-[#151022] shadow-[0_35px_100px_rgba(0,0,0,.42)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(216,120,255,.48),transparent_32%),radial-gradient(circle_at_82%_76%,rgba(83,235,229,.4),transparent_36%),linear-gradient(135deg,#14081f_0%,#26113c_47%,#052a39_100%)]" />
            <motion.div
              animate={reduceMotion ? undefined : { rotate: [45, 50, 45], x: [0, 12, 0], y: [0, -10, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[16%] top-[13%] h-64 w-64 rotate-45 border border-fuchsia-100/50 bg-gradient-to-br from-fuchsia-300/25 via-violet-300/10 to-cyan-200/30 shadow-[0_0_80px_rgba(198,89,255,.34)]"
            />
            <motion.div
              animate={reduceMotion ? undefined : { rotate: [-32, -38, -32], x: [0, -10, 0], y: [0, 12, 0] }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[-12%] top-[20%] h-52 w-52 -rotate-[32deg] border border-cyan-100/40 bg-cyan-200/10 shadow-[0_0_80px_rgba(52,228,231,.22)]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(18,6,34,.46)_0%,transparent_52%,rgba(3,30,44,.5)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-100/80">PRISM / MEMBERS-ONLY ACCESS</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="font-serif text-5xl tracking-[-.08em]">Priority, quietly.</p>
                  <p className="mt-2 text-xs text-violet-100/75">The premium layer for plans made on your terms.</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center border border-amber-100/35 bg-amber-100/10 text-amber-100 backdrop-blur">
                  <Crown size={20} />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4 text-xs text-violet-100/80">
                <span className="flex items-center gap-1.5"><MapPin size={13} /> {member.city}</span>
                <span className="flex items-center gap-1.5"><LockKeyhole size={13} /> Private view</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[.025]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-16 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-100">{t("premium", "perks")}</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-.05em]">{t("premium", "perksTitle")}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                [LockKeyhole, "Private mode", "Browse privately when you want to keep a lower profile."],
                [ShieldCheck, "Priority support", "Get faster, dedicated help whenever you need it."],
                [Sparkles, "Early access", "Discover new companions and availability before everyone else."],
              ].map(([Icon, title, copy]) => {
                const Glyph = Icon as typeof LockKeyhole;
                return (
                  <article key={title as string} className="border border-white/12 bg-white/[.035] p-5">
                    <Glyph size={18} className="text-cyan-100" />
                    <h3 className="mt-5 text-sm font-semibold">{title as string}</h3>
                    <p className="mt-2 text-xs leading-5 text-violet-100/65">{copy as string}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <PrismBoostPanel />
        </div>
      </section>

      <section id="concierge" className="relative z-10 mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><div className="grid gap-8 rounded-[2rem] border border-white/12 bg-[#151022]/85 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl lg:grid-cols-[.8fr_1.2fr] sm:p-10"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100">CONCIERGE BOOKING</p><h2 className="mt-3 font-serif text-4xl tracking-[-.05em]">Tell us the plan.</h2><p className="mt-4 text-sm leading-6 text-violet-100/65">Share the city, date, and vibe. Your concierge will help you find the right fit, with clear expectations from the start.</p></div><form className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">City<input defaultValue={member.city} className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-white/[.035] px-3 text-sm font-normal outline-none focus:border-cyan-200" /></label><label className="text-sm font-semibold">Date<input type="date" className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-white/[.035] px-3 text-sm font-normal outline-none focus:border-cyan-200" /></label><label className="text-sm font-semibold">Vibe<input className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-white/[.035] px-3 text-sm font-normal outline-none focus:border-cyan-200" /></label><label className="text-sm font-semibold">Budget<input className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-white/[.035] px-3 text-sm font-normal outline-none focus:border-cyan-200" /></label><label className="sm:col-span-2 text-sm font-semibold">Notes<textarea rows={3} className="mt-2 w-full rounded-xl border border-white/12 bg-white/[.035] px-3 py-2 text-sm font-normal outline-none focus:border-cyan-200" /></label><Link href="/browse" className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100">Send concierge request</Link></form></div></section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-7 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-5 text-center text-[10px] font-semibold uppercase tracking-[.16em] text-violet-100/55 lg:flex-row lg:text-left">
            <span>GIGOLO INDIA / PRISM MEMBER SPACE</span>
            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Member footer">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/privacy#terms">Terms of Use</Link>
              <Link href="/privacy#guidelines">Community Guidelines</Link>
              <Link href="/privacy#safety">Support</Link>
            </nav>
            <LanguageSwitcher />
            <span>ADULTS 18+ ONLY</span>
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-violet-100/45">
            Users are responsible for complying with local laws. We do not tolerate coercion, trafficking, or exploitation of any kind.
          </p>
        </div>
      </footer>
    </main>
  );
}
