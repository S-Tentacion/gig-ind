"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "@/components/localization-provider";

const consentKey = "gigolo-india-age-confirmed";

export function AgeGate({ children }: { children: ReactNode }) {
  const { tr } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => setConfirmed(window.localStorage.getItem(consentKey) === "true"), []);

  function enter() {
    window.localStorage.setItem(consentKey, "true");
    setConfirmed(true);
  }

  function leave() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("https://www.google.com");
  }

  return <>{children}{!confirmed && <div data-no-translate role="dialog" aria-modal="true" aria-labelledby="age-gate-title" className="fixed inset-0 z-[1000] grid place-items-center bg-mauve-950/95 p-5 text-mauve-50 backdrop-blur-xl"><motion.section initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .35, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-mauve-700 bg-mauve-900 p-7 shadow-2xl sm:p-9"><div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl"/><div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl"/><div className="relative"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-300 to-cyan-200 text-mauve-950"><ShieldCheck size={22}/></span><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-cyan-200">Gigolo India</p><h1 id="age-gate-title" className="mt-3 font-serif text-4xl tracking-[-.05em]">{tr("Adults Only (18+)")}</h1><p className="mt-5 text-base leading-7 text-mauve-200">{tr("Gigolo India is for adults aged 18 and above. By entering, you confirm you are 18+ and that this content is legal where you live.")}</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><button type="button" onClick={enter} className="button-shine rounded-full bg-mauve-50 px-5 py-3 text-sm font-bold text-mauve-950">{tr("I'm 18+ — Enter")}</button><button type="button" onClick={leave} className="rounded-full border border-mauve-600 px-5 py-3 text-sm font-semibold text-mauve-100 transition hover:border-cyan-200 hover:text-cyan-100">{tr("Leave")}</button></div></div></motion.section></div>}</>;
}
