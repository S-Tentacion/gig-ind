"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Crown, Gem, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, X, XCircle, Zap } from "lucide-react";
import { useSessionMember, type SessionMember } from "@/components/member-menu";

type PaymentResult = { status: "success" | "failed" | "cancelled"; paymentId?: string };
type PaymentInput = { amount: number; source: string; userId: string };
type UpgradeModalContextValue = { openUpgradeModal: (source: string) => void; closeUpgradeModal: () => void };

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

/**
 * Temporary provider-neutral checkout stub.
 * TODO: integrate payment gateway here: create an order server-side, open the
 * provider checkout, verify its signature/status server-side, and never trust
 * a client-only success callback.
 */
export async function initiatePayment({ amount, source, userId }: PaymentInput): Promise<PaymentResult> {
  console.info("[prism-upgrade] payment attempt", { amount, source, userId });
  await new Promise((resolve) => window.setTimeout(resolve, 850));
  const result = process.env.NEXT_PUBLIC_PRISM_PAYMENT_MOCK_STATUS;
  if (result === "failed" || result === "cancelled") return { status: result };
  return { status: "success", paymentId: `mock_prism_${Date.now()}` };
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (!context) throw new Error("useUpgradeModal must be used inside PrismUpgradeProvider");
  return context;
}

const benefits = [
  [LockKeyhole, "Unblurred photo galleries", "See every profile, fully."],
  [Zap, "Priority booking", "Jump the queue on every request."],
  [Gem, "PRISM-exclusive companions", "Access top-rated profiles no one else sees."],
  [Crown, "Concierge booking", "We arrange the night for you."],
  [Sparkles, "Travel & event booking", "Book companions for trips and events."],
  [ShieldCheck, "Private mode", "Browse invisibly, no one sees you looking."],
  [ShieldCheck, "Priority 24/7 support", "Skip the queue when you need help."],
  [Zap, "Early access", "See new companions before Standard members."],
] as const;

function PrismUpgradeModal({ open, source, member, onClose }: { open: boolean; source: string; member: SessionMember | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"default" | "loading" | "success" | "failed">("default");

  useEffect(() => {
    if (!open) { setState("default"); return; }
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusFirst = () => dialogRef.current?.querySelector<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.setTimeout(focusFirst, 0);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  const completePayment = async () => {
    if (!member) { window.location.assign("/login"); return; }
    setState("loading");
    const result = await initiatePayment({ amount: 1000000, source, userId: String(member.id) });
    setState(result.status === "success" ? "success" : "failed");
  };

  return <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[100] flex items-end bg-[#090611]/80 p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-5">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="prism-upgrade-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[2rem] border border-amber-100/30 bg-[radial-gradient(circle_at_10%_0%,rgba(251,191,36,.18),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(34,211,238,.14),transparent_32%),#171021] p-5 shadow-2xl shadow-black/60 sm:max-w-[30rem] sm:rounded-[2rem] sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-amber-100"><Crown size={14} /> PRISM PREMIUM</p>{state === "default" && <><h2 id="prism-upgrade-title" className="mt-3 font-serif text-4xl tracking-[-.06em] text-white">Step into the inner circle.</h2><p className="mt-3 text-sm text-violet-100/70">Everything Standard has, plus total access.</p></>}</div><button type="button" onClick={onClose} aria-label="Close upgrade dialog" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-violet-100/70 transition hover:border-white/35 hover:bg-white/10 hover:text-white"><X size={17} /></button></div>
      {state === "default" && <><div className="mt-6 rounded-2xl border border-amber-100/25 bg-amber-100/[.07] px-5 py-4"><p className="font-serif text-4xl text-amber-100">₹10,000</p><p className="mt-1 text-xs font-medium text-violet-100/65">One-time payment · Lifetime PRISM access</p></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{benefits.map(([Icon, title, text]) => <div key={title} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><Icon size={16} className="text-amber-100" /><p className="mt-2 text-xs font-bold text-white">{title}</p><p className="mt-1 text-[11px] leading-4 text-violet-100/60">{text}</p></div>)}</div><div className="mt-6 border-t border-white/10 pt-5"><button type="button" onClick={() => void completePayment()} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-100 via-[#f3cf85] to-cyan-100 px-5 py-3.5 text-sm font-bold text-mauve-950 transition hover:brightness-110"><Crown size={17} /> Pay ₹10,000 &amp; Unlock PRISM</button><button type="button" onClick={onClose} className="mt-3 w-full text-sm font-semibold text-violet-100/65 transition hover:text-white">Maybe later</button><p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-violet-100/60"><LockKeyhole size={12} /> Secure payment · Discreet billing descriptor</p><p className="mt-2 text-center text-[10px] leading-4 text-violet-100/45">Payments are non-refundable except as required by law. See Terms for details.</p></div></>}
      {state === "loading" && <div className="grid min-h-72 place-items-center text-center"><div><LoaderCircle size={34} className="mx-auto animate-spin text-amber-100" /><p className="mt-5 text-sm font-semibold text-white">Opening secure checkout…</p></div></div>}
      {state === "success" && <div className="grid min-h-72 place-items-center text-center"><div><CheckCircle2 size={42} className="mx-auto text-emerald-300" /><h2 id="prism-upgrade-title" className="mt-5 font-serif text-4xl text-white">Welcome to PRISM.</h2><p className="mt-3 text-sm leading-6 text-violet-100/70">Your payment is confirmed. Unblurring everything now.</p><button type="button" onClick={() => window.location.assign("/")} className="mt-7 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100">Explore PRISM</button></div></div>}
      {state === "failed" && <div className="grid min-h-72 place-items-center text-center"><div><XCircle size={42} className="mx-auto text-rose-300" /><h2 id="prism-upgrade-title" className="mt-5 font-serif text-4xl text-white">Payment didn&apos;t go through.</h2><p className="mt-3 text-sm leading-6 text-violet-100/70">No amount was deducted, or it will be refunded automatically if it was.</p><div className="mt-7 flex justify-center gap-3"><button type="button" onClick={() => setState("default")} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100">Try Again</button><a href="/privacy#safety" className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-200 hover:text-cyan-100">Contact Support</a></div></div></div>}
    </div>
  </div>;
}

export function PrismUpgradeProvider({ children }: { children: ReactNode }) {
  const { member } = useSessionMember();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const closeUpgradeModal = useCallback(() => setOpen(false), []);
  const openUpgradeModal = useCallback((nextSource: string) => {
    if (member?.kitPurchased) { window.location.assign("/"); return; }
    setSource(nextSource);
    setOpen(true);
  }, [member?.kitPurchased]);
  useEffect(() => {
    const interceptUpgradeLinks = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const trigger = target?.closest<HTMLElement>("[data-prism-upgrade-source], a, button");
      if (!trigger) return;
      const copy = trigger.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const explicitSource = trigger.dataset.prismUpgradeSource;
      const isUpgradeControl = Boolean(explicitSource) || /^(Upgrade to PRISM|Unlock with PRISM|Upgrade PRISM|Unlock PRISM(?: · See What Changes)?)$/i.test(copy);
      if (!isUpgradeControl) return;
      event.preventDefault();
      const source = explicitSource || `${window.location.pathname.replaceAll("/", "_").replace(/^_+/, "") || "home"}_${copy.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
      openUpgradeModal(source);
    };
    document.addEventListener("click", interceptUpgradeLinks);
    return () => document.removeEventListener("click", interceptUpgradeLinks);
  }, [openUpgradeModal]);
  return <UpgradeModalContext.Provider value={{ openUpgradeModal, closeUpgradeModal }}>{children}<PrismUpgradeModal open={open} source={source} member={member} onClose={closeUpgradeModal} /></UpgradeModalContext.Provider>;
}
