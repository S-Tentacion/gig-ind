"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Crown, MessageCircle, ReceiptText, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export type SessionMember = { id: number; name: string; city: string; kitPurchased: boolean; profileImages: string[] };

export function useSessionMember() {
  const [member, setMember] = useState<SessionMember | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { member: null })
      .then((data) => { if (active) setMember(data.member ?? null); })
      .catch(() => { if (active) setMember(null); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  return { member, loaded };
}

export function MemberMenu({ member }: { member: SessionMember | null }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!member) return <><Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">{t("common", "signIn")}</Link></Button><Button asChild size="sm"><Link href="/register">{t("common", "joinNow")}</Link></Button></>;

  const firstName = member.name.trim().split(/\s+/)[0] || member.name;
  const memberId = `PRISM-XXXX-${String(member.id).padStart(3, "0").slice(-3)}`;
  const copyMemberId = async () => {
    try {
      await navigator.clipboard.writeText(memberId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const signOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/");
  };
  return <div className="relative" ref={container} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="dialog" aria-label="Open member menu" className="grid h-10 w-10 place-items-center rounded-full border border-mauve-300 bg-mauve-50/80 text-mauve-800 shadow-sm transition hover:border-fuchsia-400 hover:text-fuchsia-600 dark:border-mauve-700 dark:bg-mauve-900/80 dark:text-mauve-100 dark:hover:text-cyan-100">
      <UserRound size={18} />
    </button>
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0, y: -8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .96 }} transition={{ duration: .18 }} role="dialog" className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-mauve-200 bg-mauve-50 p-3 shadow-2xl dark:border-mauve-700 dark:bg-mauve-900">
        <div className="rounded-xl bg-gradient-to-br from-fuchsia-100 via-mauve-100 to-cyan-100 p-3 dark:from-fuchsia-500/15 dark:via-mauve-800 dark:to-cyan-500/10"><p className="flex items-center gap-2 text-sm font-semibold"><UserRound size={15}/> {firstName}</p><div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-mauve-300/70 bg-white/40 px-2.5 py-2 dark:border-mauve-600 dark:bg-mauve-950/30"><span className="font-mono text-[11px] font-semibold tracking-[.1em] text-mauve-700 dark:text-mauve-200">{memberId}</span><button type="button" onClick={copyMemberId} className="grid h-6 w-6 place-items-center rounded-md text-mauve-600 transition hover:bg-mauve-200 hover:text-mauve-950 dark:text-mauve-300 dark:hover:bg-mauve-700 dark:hover:text-white" aria-label={t("common", "copyMemberId")} title={t("common", "copyMemberId")}>{copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}</button></div><span className="mt-3 inline-flex items-center gap-1 rounded-full bg-mauve-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-mauve-50 dark:bg-mauve-50 dark:text-mauve-950">{member.kitPurchased && <Crown size={11}/>} {member.kitPurchased ? "Premium member" : "Member"}</span></div>
        <div className="mt-2 grid gap-1">
          <Link onClick={() => setOpen(false)} href="/profile" className="rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800">{t("common", "myProfile")}</Link>
          <Link onClick={() => setOpen(false)} href="/messages" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800"><MessageCircle size={15} /> Messages</Link>
          <Link onClick={() => setOpen(false)} href="/kit-orders" className="rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800">{t("common", "myKitOrders")}</Link>
          <Link onClick={() => setOpen(false)} href="/boost-credits" className="rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800">{t("common", "boostCredits")}</Link>
          <Link onClick={() => setOpen(false)} href="/payments" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800"><ReceiptText size={15} /> {t("common", "payments")}</Link>
          <Link onClick={() => setOpen(false)} href="/privacy" className="rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800">{t("common", "privacySettings")}</Link>
          <Link onClick={() => setOpen(false)} href="/privacy#safety" className="rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800">{t("common", "helpSupport")}</Link>
        </div>
        <button disabled={signingOut} onClick={signOut} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-mauve-600 transition hover:bg-mauve-100 hover:text-rose-600 disabled:opacity-60 dark:text-mauve-300 dark:hover:bg-mauve-800 dark:hover:text-rose-300">{signingOut ? "Signing out…" : t("common", "signOut")}</button>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
