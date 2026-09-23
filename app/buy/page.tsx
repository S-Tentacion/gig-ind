"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Crown, Gem, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSessionMember } from "@/components/member-menu";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/confetti-burst";
import { createTelegramOrder, openTelegramWindow, waitForTelegramPayment } from "@/lib/telegram-checkout-client";

export default function BuyPage() {
  const router = useRouter();
  const { member, loaded } = useSessionMember();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  const buyKit = async () => {
    setProcessing(true);
    setMessage("");
    const popup = openTelegramWindow();
    try {
      const order = await createTelegramOrder({ kind: "kit" }, popup);
      await waitForTelegramPayment(order);
      setComplete(true);
      window.setTimeout(() => router.push("/"), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!loaded) return <main className="grid min-h-screen place-items-center bg-mauve-950 text-mauve-50"><LoaderCircle className="animate-spin" /></main>;
  if (!member) return <main className="grid min-h-screen place-items-center bg-mauve-950 px-5 text-center text-mauve-50"><div><Crown className="mx-auto text-fuchsia-300" size={34} /><h1 className="mt-5 font-serif text-4xl">Sign in to get the Kit.</h1><p className="mt-3 text-sm text-mauve-300">PRISM access is linked to your member account.</p><Button asChild className="mt-7"><Link href="/login">Sign In</Link></Button></div></main>;
  if (member.kitPurchased || complete) return <main className="grid min-h-screen place-items-center overflow-hidden bg-mauve-950 px-5 text-center text-mauve-50">{complete && <ConfettiBurst />}<motion.div initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-md rounded-[2rem] border border-cyan-200/30 bg-gradient-to-br from-fuchsia-500/25 via-mauve-900 to-cyan-400/20 p-10 shadow-2xl"><CheckCircle2 className="mx-auto text-cyan-200" size={45} /><h1 className="mt-5 font-serif text-4xl">PRISM is unlocked.</h1><p className="mt-3 text-sm leading-6 text-mauve-200">Your private member experience is ready, {member.name}.</p><Button asChild className="mt-7 bg-mauve-50 text-mauve-950 hover:bg-white"><Link href="/">Open PRISM</Link></Button></motion.div></main>;

  return <main className="min-h-screen overflow-hidden bg-mauve-950 text-mauve-50">
    <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link href="/" className="flex items-center gap-2 text-sm text-mauve-200 hover:text-white"><ArrowLeft size={16} /> Back home</Link></nav>
    <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1fr_.8fr] lg:items-center lg:pt-20">
      <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="relative">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <p className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-cyan-200"><Sparkles size={14} /> Member experience</p>
        <h1 className="relative mt-5 max-w-2xl font-serif text-6xl leading-[.9] tracking-[-.05em]">Meet your<br /><span className="bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200 bg-clip-text text-transparent">private PRISM.</span></h1>
        <p className="relative mt-6 max-w-xl text-base leading-7 text-mauve-200">Gigolo Kit opens a distinct PRISM member space designed around privacy, clarity, and considered connection.</p>
        <div className="relative mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-mauve-200"><span className="flex items-center gap-2"><Gem size={16} className="text-fuchsia-300" /> Distinct member identity</span><span className="flex items-center gap-2"><Crown size={16} className="text-amber-200" /> Private home view</span><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-cyan-200" /> Verified access</span></div>
      </motion.div>
      <motion.aside initial={{ opacity: 0, x: 24, scale: .96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: .1 }} className="relative overflow-hidden rounded-[2rem] border border-mauve-700 bg-mauve-900/80 p-7 shadow-2xl backdrop-blur">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="relative flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.17em] text-fuchsia-300">Gigolo Kit</p><h2 className="mt-2 font-serif text-4xl">⭐ 8,750</h2><p className="mt-1 text-xs text-mauve-400">Paid in Telegram Stars</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-cyan-300 text-mauve-950"><Crown size={20} /></span></div>
        <div className="relative mt-7 space-y-3 border-y border-mauve-700 py-5 text-sm text-mauve-200"><p>✓ PRISM private member home</p><p>✓ Distinct visual identity</p><p>✓ Member access after verified checkout</p></div>
        <Button onClick={buyKit} disabled={processing} className="button-shine relative mt-7 w-full bg-mauve-50 text-mauve-950 hover:bg-white">{processing ? <><LoaderCircle className="animate-spin" size={16} /> Waiting for Telegram…</> : <><Crown size={16} /> Pay ⭐ 8,750 in Telegram</>}</Button>
        <p className="relative mt-4 text-center text-xs leading-5 text-mauve-400">Telegram confirms payment before PRISM access is activated.</p>
        {message && <p className="relative mt-4 rounded-xl bg-rose-500/15 p-3 text-xs text-rose-100">{message}</p>}
      </motion.aside>
    </div>
  </main>;
}
