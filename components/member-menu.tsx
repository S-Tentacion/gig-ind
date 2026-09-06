"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Crown, MapPin, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!member) return <><Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button><Button asChild size="sm"><Link href="/register">Join</Link></Button></>;

  const initial = member.name.trim().charAt(0).toUpperCase() || "G";
  const signOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/");
  };
  return <div className="relative" ref={container}>
    <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="dialog" className="flex items-center gap-2 rounded-full border border-mauve-300 bg-mauve-50/80 py-1 pl-1 pr-2.5 text-left text-sm shadow-sm transition hover:border-fuchsia-400 dark:border-mauve-700 dark:bg-mauve-900/80">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 via-violet-400 to-cyan-300 font-serif text-sm text-mauve-950">{initial}</span>
      <span className="hidden max-w-24 truncate font-medium sm:block">{member.name}</span><ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"}/>
    </button>
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0, y: -8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .96 }} transition={{ duration: .18 }} role="dialog" className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-mauve-200 bg-mauve-50 p-3 shadow-2xl dark:border-mauve-700 dark:bg-mauve-900">
        <div className="rounded-xl bg-gradient-to-br from-fuchsia-100 via-mauve-100 to-cyan-100 p-3 dark:from-fuchsia-500/15 dark:via-mauve-800 dark:to-cyan-500/10"><p className="flex items-center gap-2 text-sm font-semibold"><UserRound size={15}/> {member.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-mauve-600 dark:text-mauve-300"><MapPin size={12}/> {member.city}</p><span className="mt-3 inline-flex items-center gap-1 rounded-full bg-mauve-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-mauve-50 dark:bg-mauve-50 dark:text-mauve-950">{member.kitPurchased && <Crown size={11}/>} {member.kitPurchased ? "Premium member" : "Member"}</span></div>
        <Link onClick={() => setOpen(false)} href={member.kitPurchased ? "/" : "/buy"} className="mt-2 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-mauve-100 dark:hover:bg-mauve-800">{member.kitPurchased ? "Open premium home" : "Explore Gigolo Kit"}<span aria-hidden>→</span></Link>
        <button disabled={signingOut} onClick={signOut} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-mauve-600 transition hover:bg-mauve-100 hover:text-rose-600 disabled:opacity-60 dark:text-mauve-300 dark:hover:bg-mauve-800 dark:hover:text-rose-300">{signingOut ? "Signing out…" : "Sign out"}</button>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
