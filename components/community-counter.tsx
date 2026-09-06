"use client";

import { motion, useReducedMotion } from "framer-motion";
import { UsersRound, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";

function useAnimatedCount(target: number) {
  const [count, setCount] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setCount(target);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 1500, 1);
      setCount(Math.round(target * (1 - Math.pow(1 - progress, 4))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, target]);

  return count;
}

export function CommunityCounter({ variant = "default" }: { variant?: "default" | "prism" }) {
  const activeGigolos = useAnimatedCount(20_000);
  const customers = useAnimatedCount(100_000);
  const prism = variant === "prism";
  const shell = prism ? "border-y border-white/10 bg-[linear-gradient(115deg,#110d18_0%,#17141b_52%,#101b20_100%)] text-white" : "border-y border-mauve-200 bg-mauve-100/70 dark:border-mauve-800 dark:bg-mauve-900/35";
  const panel = prism ? "border-white/12 bg-[#151022]/85" : "border-mauve-200 bg-mauve-50/85 dark:border-mauve-700 dark:bg-mauve-950/55";

  return <section className={`relative z-10 isolate overflow-hidden py-9 lg:py-12 ${shell}`} aria-label="Project demo activity counter"><div className={`pointer-events-none absolute inset-0 opacity-45 ${prism ? "bg-[radial-gradient(circle_at_18%_10%,rgba(217,70,239,.08),transparent_30%),radial-gradient(circle_at_84%_90%,rgba(34,211,238,.07),transparent_34%)]" : "bg-[radial-gradient(circle_at_18%_10%,rgba(217,70,239,.1),transparent_30%),radial-gradient(circle_at_84%_90%,rgba(6,182,212,.08),transparent_34%)]"}`}/><div className="relative mx-auto max-w-7xl px-5 lg:px-8"><div className={`overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_20px_65px_rgba(0,0,0,.14)] backdrop-blur-xl sm:p-7 ${panel}`}><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className={`text-[10px] font-bold uppercase tracking-[.2em] ${prism ? "text-cyan-100" : "text-cyan-700 dark:text-cyan-300"}`}>Project demo activity</p><h2 className="mt-2 font-serif text-3xl tracking-[-.04em]">A community view in motion.</h2><p className={`mt-2 text-xs ${prism ? "text-violet-100/65" : "text-mauve-600 dark:text-mauve-300"}`}>Animated test figures for this college-project interface.</p></div><p className={`max-w-xs text-xs leading-5 sm:text-right ${prism ? "text-violet-100/55" : "text-mauve-500 dark:text-mauve-400"}`}>These figures are simulated for animation testing and are not live platform activity.</p></div><div className={`mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2 ${prism ? "border-white/10" : "border-mauve-200 dark:border-mauve-800"}`}><motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`flex items-center gap-4 rounded-2xl border p-4 ${prism ? "border-cyan-200/20 bg-cyan-200/[.06]" : "border-cyan-300/35 bg-cyan-100/45 dark:border-cyan-800/50 dark:bg-cyan-900/15"}`}><span className={`grid h-11 w-11 place-items-center rounded-xl ${prism ? "bg-cyan-200 text-mauve-950" : "bg-cyan-600 text-white dark:bg-cyan-200 dark:text-mauve-950"}`}><UserRoundCheck size={20}/></span><div><p className={`font-serif text-3xl tracking-[-.05em] ${prism ? "text-cyan-100" : "text-mauve-900 dark:text-mauve-50"}`}>{activeGigolos.toLocaleString("en-IN")}</p><p className={`mt-1 text-xs font-semibold ${prism ? "text-violet-100/70" : "text-mauve-600 dark:text-mauve-300"}`}>Active Gigolo profiles</p></div></motion.div><motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .1 }} className={`flex items-center gap-4 rounded-2xl border p-4 ${prism ? "border-fuchsia-200/20 bg-fuchsia-300/[.06]" : "border-fuchsia-300/35 bg-fuchsia-100/45 dark:border-fuchsia-800/50 dark:bg-fuchsia-900/15"}`}><span className={`grid h-11 w-11 place-items-center rounded-xl ${prism ? "bg-fuchsia-200 text-mauve-950" : "bg-fuchsia-600 text-white dark:bg-fuchsia-200 dark:text-mauve-950"}`}><UsersRound size={20}/></span><div><p className={`font-serif text-3xl tracking-[-.05em] ${prism ? "text-fuchsia-100" : "text-mauve-900 dark:text-mauve-50"}`}>{customers.toLocaleString("en-IN")}</p><p className={`mt-1 text-xs font-semibold ${prism ? "text-violet-100/70" : "text-mauve-600 dark:text-mauve-300"}`}>Customers in the demo</p></div></motion.div></div></div></div></section>;
}
