"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown, Sparkles, Star } from "lucide-react";

export function KitPromo({ name }: { name: string }) {
  const reduceMotion = useReducedMotion();
  const words = ["COLORFUL PREMIUM HOME", "GIGOLO KIT", "MEMBER-ONLY LOOK", "₹10,000 PROJECT ACCESS"];
  return <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pt-2 lg:px-8">
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="relative overflow-hidden rounded-[2rem] border border-fuchsia-300/50 bg-mauve-950 px-6 py-8 text-mauve-50 shadow-2xl sm:px-10 sm:py-10">
      <motion.div animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[26px] border-cyan-300/25"/>
      <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.3, 1], x: [0, 24, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-fuchsia-500/40 blur-3xl"/>
      <div className="relative grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div className="min-w-0"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.17em] text-cyan-200"><Sparkles size={14}/> A brighter layer for {name}</p><h2 className="mt-3 max-w-2xl font-serif text-4xl tracking-tight sm:text-5xl">Unbox the colorful side of Gigolo India.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-mauve-200">The Gigolo Kit unlocks a new premium homepage, a vibrant identity, and an elevated visual experience for this college-project POC.</p></div><Link href="/buy" className="button-shine inline-flex w-fit items-center justify-center gap-2 rounded-full bg-mauve-50 px-5 py-3.5 text-sm font-semibold text-mauve-950 shadow-lg transition hover:scale-[1.02] lg:justify-self-end"><Crown size={16}/> Get the Kit · ₹10,000 <ArrowRight size={16}/></Link></div>
      <div className="relative mt-7 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-mauve-50/15 pt-4 text-[10px] font-semibold tracking-[.13em] text-fuchsia-200 sm:grid-cols-4">{words.map((word) => <span className="flex min-w-0 items-center gap-2 whitespace-nowrap" key={word}><Star size={12} className="shrink-0 text-cyan-200"/>{word}</span>)}</div>
    </motion.div>
  </section>;
}
