"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Clock3, Crown, Gem,
  Glasses, Headphones, LoaderCircle, LockKeyhole, Plane, ShieldCheck, Sparkles,
  Star, UserRoundCheck, WandSparkles, X, XCircle, Zap,
} from "lucide-react";
import { useState } from "react";
import { LocalizedLink as Link, useLocalizedRouter, useTranslation } from "@/components/localization-provider";
import { MemberMenu, useSessionMember } from "@/components/member-menu";
import { SiteFooter } from "@/components/site-footer";
import { createCoinGateOrder, openCoinGateWindow, waitForCoinGatePayment } from "@/lib/coingate-checkout-client";
import { ROUTES } from "@/lib/routes";

const membershipPrice = 10_000;

const benefits = [
  [LockKeyhole, "benefitUnblurredTitle", "benefitUnblurredDescription"],
  [Zap, "benefitPriorityTitle", "benefitPriorityDescription"],
  [Gem, "benefitExclusiveTitle", "benefitExclusiveDescription"],
  [WandSparkles, "benefitConciergeTitle", "benefitConciergeDescription"],
  [Plane, "benefitTravelTitle", "benefitTravelDescription"],
  [Glasses, "benefitPrivateTitle", "benefitPrivateDescription"],
  [Headphones, "benefitSupportTitle", "benefitSupportDescription"],
  [Clock3, "benefitEarlyTitle", "benefitEarlyDescription"],
] as const;

const comparison = [
  ["comparisonBrowse", true], ["comparisonMessage", true], ["comparisonUnblurred", false],
  ["comparisonPriority", false], ["comparisonExclusive", false], ["comparisonConcierge", false],
  ["comparisonTravel", false], ["comparisonPrivate", false], ["comparisonSupport", false],
  ["comparisonEarly", false],
] as const;

const faqs = [
  ["faqOneTimeQuestion", "faqOneTimeAnswer"], ["faqRefundQuestion", "faqRefundAnswer"],
  ["faqAfterPayQuestion", "faqAfterPayAnswer"], ["faqReverifyQuestion", "faqReverifyAnswer"],
  ["faqDowngradeQuestion", "faqDowngradeAnswer"],
] as const;

const previews = [
  ["from-fuchsia-500/45 via-violet-950 to-cyan-400/30", "4.9", "8"],
  ["from-cyan-400/30 via-[#151022] to-fuchsia-500/35", "4.8", "11"],
  ["from-amber-200/20 via-fuchsia-700/40 to-cyan-300/25", "5.0", "6"],
  ["from-violet-500/40 via-[#161024] to-cyan-300/30", "4.9", "9"],
] as const;

type PaymentState = "default" | "loading" | "success" | "failed";

async function initiatePayment(input: { amount: number; source: "membership_page"; userId: number }) {
  // The server derives the authenticated member and CoinGate catalog price.
  // The input preserves the provider-agnostic checkout contract for a future provider.
  void input;
  const popup = openCoinGateWindow();
  const order = await createCoinGateOrder({ kind: "kit", source: "membership_page", returnPath: ROUTES.membership }, popup);
  const result = await waitForCoinGatePayment(order);
  popup?.close();
  return result;
}

export function MembershipPage() {
  const reduceMotion = useReducedMotion();
  const router = useLocalizedRouter();
  const { t } = useTranslation();
  const { member, loaded } = useSessionMember();
  const [paymentState, setPaymentState] = useState<PaymentState>("default");
  const [paymentError, setPaymentError] = useState("");
  const isPrism = Boolean(member?.kitPurchased);

  const startPayment = async () => {
    if (!member) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.membership)}`);
      return;
    }
    setPaymentState("loading");
    setPaymentError("");
    try {
      await initiatePayment({ amount: membershipPrice, source: "membership_page", userId: member.id });
      setPaymentState("success");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : t("membership", "paymentFailureBody"));
      setPaymentState("failed");
    }
  };

  const paymentButton = (
    <button type="button" disabled={!loaded || paymentState === "loading"} onClick={() => void startPayment()} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-100 via-[#f3cf85] to-cyan-100 px-6 py-3.5 text-sm font-bold text-mauve-950 shadow-lg shadow-amber-200/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
      {paymentState === "loading" ? <LoaderCircle size={17} className="animate-spin" /> : <Crown size={17} />}
      {paymentState === "loading" ? t("membership", "paymentLoading") : t("membership", "payCta")}
    </button>
  );

  return <main data-no-translate className="min-h-screen overflow-hidden bg-[#0d0918] text-white">
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" /><motion.div animate={reduceMotion ? undefined : { x: [0, 60, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[150px]" /><motion.div animate={reduceMotion ? undefined : { x: [0, -55, 0], y: [0, 40, 0] }} transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-[150px]" /></div>

    <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8"><Link href={ROUTES.home} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-amber-100"><Crown size={18} /></span><span className="brand-wordmark font-serif text-xl">Gigolo India</span></Link><MemberMenu member={member} /></nav>

    {paymentState === "failed" && <section role="alert" className="relative z-20 mx-auto mt-3 max-w-7xl px-5 lg:px-8"><div className="flex flex-col gap-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><XCircle size={22} className="mt-0.5 shrink-0 text-rose-200" /><div><h2 className="font-semibold text-rose-100">{t("membership", "paymentFailureTitle")}</h2><p className="mt-1 text-sm leading-6 text-rose-100/70">{paymentError || t("membership", "paymentFailureBody")}</p></div></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => void startPayment()} className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-mauve-950">{t("membership", "tryAgain")}</button><Link href={`${ROUTES.privacy}#safety`} className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold text-white">{t("membership", "contactSupport")}</Link></div></div></section>}

    <header className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-5 lg:px-8 lg:pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-violet-100/55"><nav aria-label={t("membership", "breadcrumbLabel")} className="flex items-center gap-2"><Link href={ROUTES.home} className="transition hover:text-cyan-100">{t("membership", "home")}</Link><ChevronRight size={12} /><span className="text-violet-100">{t("membership", "membership")}</span></nav><button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 transition hover:text-cyan-100"><ArrowLeft size={14} /> {t("membership", "back")}</button></div>
      <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
        {paymentState === "success" ? <div><span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-200/25 bg-emerald-300/10 text-emerald-200"><CheckCircle2 size={27} /></span><h1 className="mt-7 font-serif text-6xl tracking-[-.07em] sm:text-7xl">{t("membership", "paymentSuccessTitle")}</h1><p className="mt-5 max-w-xl text-base leading-7 text-violet-100/70">{t("membership", "paymentSuccessBody")}</p><Link href={ROUTES.home} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100">{t("membership", "explorePrism")} <ArrowRight size={16} /></Link></div> : isPrism ? <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-amber-100"><CheckCircle2 size={15} /> PRISM PREMIUM</p><h1 className="mt-5 font-serif text-6xl tracking-[-.07em] sm:text-7xl">{t("membership", "alreadyTitle")}</h1><p className="mt-5 max-w-xl text-base leading-7 text-violet-100/70">{t("membership", "alreadyBody")}</p><Link href={ROUTES.home} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100">{t("membership", "alreadyCta")} <ArrowRight size={16} /></Link></div> : <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-amber-100"><Crown size={15} /> PRISM PREMIUM</p><h1 className="mt-5 max-w-3xl font-serif text-6xl leading-[.9] tracking-[-.07em] sm:text-7xl">{t("membership", "heroTitle")}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-violet-100/70">{t("membership", "heroSubtitle")}</p><div className="mt-8 flex flex-wrap items-center gap-3">{paymentButton}<a href="#compare" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-sm font-bold text-white transition hover:border-amber-100 hover:text-amber-100">{t("membership", "compareCta")} <ArrowRight size={15} /></a></div><p className="mt-5 flex items-center gap-2 text-xs text-violet-100/55"><LockKeyhole size={13} /> {t("membership", "trustLine")}</p></div>}
        <div className="rounded-[2rem] border border-amber-100/30 bg-[radial-gradient(circle_at_15%_10%,rgba(251,191,36,.18),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(34,211,238,.15),transparent_35%),#181021] p-7 shadow-2xl shadow-black/30 sm:p-9"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-100/50">{t("membership", isPrism ? "yourMembership" : "lifetimeAccess")}</p><p className="mt-4 font-serif text-6xl tracking-[-.06em] text-amber-100">₹10,000</p><p className="mt-3 text-sm text-violet-100/65">{t("membership", "priceCaption")}</p><p className="mt-2 text-xs text-cyan-100/70">{t("membership", "coinGatePrice")}</p><div className="mt-7 grid gap-3 border-t border-white/10 pt-6 text-sm text-violet-100/75">{["instantUpgrade", "allBenefits", "noRecurringFee"].map((key) => <span key={key} className="flex items-center gap-2"><Check size={15} className="text-cyan-100" /> {t("membership", key)}</span>)}</div></div>
      </div>
    </header>

    <section className="relative z-10 border-y border-white/10 bg-white/[.025] px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-100">{t("membership", "benefitsLabel")}</p><h2 className="mt-4 max-w-3xl font-serif text-5xl tracking-[-.06em] sm:text-6xl">{t("membership", "benefitsTitle")}</h2><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([Icon, titleKey, descriptionKey]) => <article key={titleKey} className="rounded-[1.5rem] border border-white/12 bg-[#151022] p-6 transition hover:-translate-y-1 hover:border-amber-100/35"><span className="grid h-11 w-11 place-items-center rounded-xl border border-amber-100/20 bg-amber-100/10 text-amber-100"><Icon size={19} /></span><h3 className="mt-5 text-lg font-semibold">{t("membership", titleKey)}</h3><p className="mt-3 text-sm leading-6 text-violet-100/65">{t("membership", descriptionKey)}</p></article>)}</div></div></section>

    <section id="compare" className="relative z-10 mx-auto max-w-6xl scroll-mt-8 px-5 py-16 lg:px-8 lg:py-24"><p className="text-center text-xs font-bold uppercase tracking-[.22em] text-cyan-100">{t("membership", "compareCta")}</p><h2 className="mt-4 text-center font-serif text-5xl tracking-[-.06em]">{t("membership", "comparisonTitle")}</h2><div className="mt-10 overflow-x-auto rounded-[1.75rem] border border-white/12 bg-[#151022]"><table className="w-full min-w-[38rem] text-left text-sm"><thead className="border-b border-white/10 bg-white/[.04]"><tr><th className="px-6 py-5 font-semibold">{t("membership", "feature")}</th><th className="px-6 py-5 text-center font-semibold">{t("membership", "standard")}</th><th className="px-6 py-5 text-center font-semibold text-amber-100">PRISM</th></tr></thead><tbody>{comparison.map(([key, standard]) => <tr key={key} className="border-b border-white/10 last:border-0"><td className="px-6 py-4 text-violet-100/75">{t("membership", key)}</td><td className="px-6 py-4"><span className="mx-auto grid h-7 w-7 place-items-center">{standard ? <Check size={17} className="text-cyan-100" /> : <X size={17} className="text-violet-100/30" />}</span></td><td className="px-6 py-4"><span className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-amber-100/10"><Check size={17} className="text-amber-100" /></span></td></tr>)}</tbody></table></div></section>

    <section className="relative z-10 border-y border-amber-100/15 bg-[#151022]/75 px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-amber-100"><Sparkles size={14} /> PRISM ACCESS</p><h2 className="mt-4 font-serif text-5xl tracking-[-.06em]">{t("membership", "previewsTitle")}</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-violet-100/65">{t("membership", "previewsBody")}</p><div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">{previews.map(([shade, rating, minutes], index) => <article key={shade} className="overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#151022]"><div className={`relative aspect-[.92] overflow-hidden bg-gradient-to-br ${shade}`}><div className="absolute inset-x-[27%] top-[12%] h-[67%] scale-110 rounded-[45%] border border-white/25 bg-white/10 blur-xl" /><div className="absolute -right-8 top-5 h-32 w-32 rounded-full border-[15px] border-cyan-100/15 blur-lg" /><div className="absolute inset-0 grid place-items-center bg-[#0d0918]/20"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur"><LockKeyhole size={18} /><span className="sr-only">{t("membership", "lockedProfile", { number: index + 1 })}</span></span></div><span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-mauve-950">PRISM</span></div><div className="flex items-center justify-between gap-3 p-4 text-xs text-violet-100/65"><span className="inline-flex items-center gap-1 text-amber-100"><Star size={13} className="fill-amber-100" /> {rating}</span><span>{t("membership", "replyTime", { minutes })}</span></div></article>)}</div><p className="mt-5 flex items-center gap-2 text-xs text-violet-100/55"><UserRoundCheck size={14} className="text-cyan-100" /> {t("membership", "previewsNote")}</p></div></section>

    <section className="relative z-10 mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24"><p className="text-center text-xs font-bold uppercase tracking-[.22em] text-cyan-100">{t("membership", "faqLabel")}</p><h2 className="mt-4 text-center font-serif text-5xl tracking-[-.06em]">{t("membership", "faqTitle")}</h2><div className="mt-10 space-y-3">{faqs.map(([questionKey, answerKey]) => <details key={questionKey} className="group rounded-2xl border border-white/12 bg-white/[.035] p-5"><summary className="cursor-pointer list-none text-base font-semibold marker:hidden">{t("membership", questionKey)}<span className="float-right text-cyan-100 transition group-open:rotate-45">+</span></summary><p className="mt-3 pr-8 text-sm leading-6 text-violet-100/65">{t("membership", answerKey)}</p></details>)}</div></section>

    {!isPrism && paymentState !== "success" && <section className="relative z-10 px-5 pb-20 text-center lg:px-8 lg:pb-28"><div className="mx-auto max-w-5xl rounded-[2rem] border border-amber-100/25 bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,.18),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(34,211,238,.16),transparent_32%),#151022] p-8 sm:p-12"><ShieldCheck size={24} className="mx-auto text-amber-100" /><h2 className="mt-5 font-serif text-5xl tracking-[-.06em]">{t("membership", "finalTitle")}</h2><div className="mt-8 flex justify-center">{paymentButton}</div><p className="mt-5 text-[11px] leading-5 text-violet-100/50">{t("membership", "finePrint")}</p></div></section>}
    <SiteFooter />
  </main>;
}
