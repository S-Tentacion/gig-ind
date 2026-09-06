"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Check, Clock3, LoaderCircle, Minus, Plus, Rocket, Sparkles, TimerReset, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ConfettiBurst } from "@/components/confetti-burst";

const oneHour = 60 * 60 * 1000;
const creditPrice = 1000;

function timeRemaining(expiresAt: string | null) {
  if (!expiresAt) return 0;
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return [Math.floor(totalSeconds / 3600), Math.floor((totalSeconds % 3600) / 60), totalSeconds % 60].map((value) => String(value).padStart(2, "0")).join(":");
}

export function PrismBoostPanel() {
  const reduceMotion = useReducedMotion();
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState(1);
  const [message, setMessage] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [randomBurst, setRandomBurst] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => { setPortalReady(true); }, []);

  useEffect(() => {
    let activeRequest = true;
    fetch("/api/profile/boost", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() as { boostExpiresAt?: string | null; boostCredits?: number; error?: string } }))
      .then(({ ok, data }) => {
        if (!activeRequest) return;
        if (!ok) setMessage(data.error ?? "Profile Boost is unavailable right now.");
        setExpiresAt(data.boostExpiresAt ?? null);
        setCredits(data.boostCredits ?? 0);
        setRemaining(timeRemaining(data.boostExpiresAt ?? null));
      })
      .catch(() => { if (activeRequest) setMessage("Profile Boost is unavailable right now."); })
      .finally(() => { if (activeRequest) setLoading(false); });
    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    const tick = () => setRemaining(timeRemaining(expiresAt));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (!purchaseOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processingPurchase) setPurchaseOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [processingPurchase, purchaseOpen]);

  const active = remaining > 0;
  const progress = useMemo(() => active ? Math.max(0.04, remaining / oneHour) : 0, [active, remaining]);

  useEffect(() => {
    if (!active || reduceMotion) return;
    let timeout: number;
    const schedule = () => {
      timeout = window.setTimeout(() => {
        setRandomBurst(true);
        window.setTimeout(() => setRandomBurst(false), 1600);
        schedule();
      }, 25000 + Math.random() * 25000);
    };
    schedule();
    return () => window.clearTimeout(timeout);
  }, [active, reduceMotion]);

  const activate = async () => {
    setActivating(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/boost", { method: "POST" });
      const data = await response.json() as { boostExpiresAt?: string | null; boostCredits?: number; error?: string };
      if (!response.ok || !data.boostExpiresAt) throw new Error(data.error ?? "Could not activate Profile Boost.");
      setExpiresAt(data.boostExpiresAt);
      setCredits(data.boostCredits ?? Math.max(0, credits - 1));
      setRemaining(timeRemaining(data.boostExpiresAt));
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not activate Profile Boost.");
    } finally {
      setActivating(false);
    }
  };

  const loadCheckout = () => new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const buyCredits = async () => {
    setProcessingPurchase(true);
    setMessage("");
    try {
      if (!await loadCheckout()) throw new Error("We could not load the checkout window. Please try again.");
      const orderResponse = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "boost", boostPack: selectedCredits }),
      });
      const order = await orderResponse.json() as { keyId?: string; amount?: number; currency?: string; orderId?: string; error?: string };
      if (!orderResponse.ok || !order.keyId || !order.amount || !order.currency || !order.orderId) throw new Error(order.error ?? "We could not start checkout.");
      if (!window.Razorpay) throw new Error("Checkout is unavailable. Please try again.");
      const Checkout = window.Razorpay as unknown as new (options: Record<string, unknown>) => { open: () => void };
      const purchasedCredits = selectedCredits;
      const checkout = new Checkout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Gigolo India",
        description: `Profile Boost · ${purchasedCredits} ${purchasedCredits === 1 ? "credit" : "credits"}`,
        order_id: order.orderId,
        theme: { color: "#675d70" },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
          const verified = await verifyResponse.json() as { member?: { boostCredits?: number }; error?: string };
          if (!verifyResponse.ok) {
            setMessage(verified.error ?? "Verification failed. Please try again.");
            setProcessingPurchase(false);
            return;
          }
          setCredits(verified.member?.boostCredits ?? credits + purchasedCredits);
          setPurchaseSuccess(true);
          setCelebrate(true);
          window.setTimeout(() => setCelebrate(false), 1700);
          setProcessingPurchase(false);
        },
        modal: { ondismiss: () => setProcessingPurchase(false) },
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setProcessingPurchase(false);
    }
  };

  const openPurchase = () => {
    setPurchaseSuccess(false);
    setSelectedCredits(1);
    setMessage("");
    setPurchaseOpen(true);
  };

  useEffect(() => {
    const openFromPremiumCta = () => openPurchase();
    window.addEventListener("gigolo-india:open-boost-purchase", openFromPremiumCta);
    return () => window.removeEventListener("gigolo-india:open-boost-purchase", openFromPremiumCta);
  }, []);

  const startPurchasedBoost = () => {
    setPurchaseOpen(false);
    void activate();
  };

  const boostClock = active && portalReady ? createPortal(
    <motion.div initial={{ opacity: 0, x: -18, scale: .95 }} animate={{ opacity: 1, x: 0, scale: 1 }} className="fixed left-5 top-5 z-[100] flex items-center gap-3 rounded-2xl border border-cyan-200/30 bg-[#171024]/95 px-3 py-2.5 shadow-2xl shadow-black/50 backdrop-blur-xl" aria-live="polite">
      <div className="relative grid h-11 w-11 place-items-center"><svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2"/><motion.circle cx="22" cy="22" r="18" fill="none" stroke="url(#boost-clock-gradient)" strokeWidth="2.5" strokeLinecap="round" pathLength="1" initial={{ pathLength: 0 }} animate={{ pathLength: progress }} transition={{ duration: .7, ease: "easeOut" }}/><defs><linearGradient id="boost-clock-gradient" x1="0" y1="0" x2="44" y2="44"><stop stopColor="#67e8f9"/><stop offset=".5" stopColor="#f0abfc"/><stop offset="1" stopColor="#fde68a"/></linearGradient></defs></svg><Clock3 size={16} className="text-amber-200"/></div>
      <div><p className="text-[9px] font-bold uppercase tracking-[.17em] text-cyan-100/75">Profile Boost active</p><p className="mt-0.5 font-mono text-sm font-bold tracking-wide text-white">{formatCountdown(remaining)}</p></div><motion.span animate={reduceMotion ? undefined : { opacity: [.35, 1, .35] }} transition={{ duration: 1.8, repeat: Infinity }} className="ml-1 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_#67e8f9]"/>
    </motion.div>, document.body,
  ) : null;

  return <aside className="lg:sticky lg:top-6 lg:self-start">
    {celebrate && <ConfettiBurst/>}{randomBurst && <ConfettiBurst/>}{boostClock}
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-[1.75rem] border border-cyan-200/25 bg-mauve-950/55 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
      <p className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200"><Rocket size={14}/> Profile Boost</p>
      <h3 className="relative mt-2 font-serif text-[1.7rem] leading-none">One hour, in PRISM.</h3>
      <p className="relative mt-2 text-xs leading-5 text-violet-100/70">A purchased credit powers your private visual state.</p>
      <div className="relative mx-auto mt-4 grid h-36 w-36 place-items-center"><svg viewBox="0 0 144 144" className="absolute inset-0 -rotate-90"><circle cx="72" cy="72" r="61" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3"/><motion.circle cx="72" cy="72" r="61" fill="none" stroke="url(#boost-panel-gradient)" strokeWidth="4" strokeLinecap="round" pathLength="1" initial={{ pathLength: 0 }} animate={{ pathLength: progress }} transition={{ duration: .8, ease: "easeOut" }}/><defs><linearGradient id="boost-panel-gradient" x1="0" y1="0" x2="144" y2="144"><stop stopColor="#67e8f9"/><stop offset=".55" stopColor="#f0abfc"/><stop offset="1" stopColor="#fde68a"/></linearGradient></defs></svg><div className="grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-[#1a1031]/80 text-center shadow-inner shadow-fuchsia-400/20"><Clock3 size={19} className={active ? "text-amber-200" : "text-violet-200"}/><p className="-mt-1 font-mono text-lg font-bold tracking-tight">{loading ? "--:--:--" : active ? formatCountdown(remaining) : "00:00:00"}</p><span className="-mt-1 text-[8px] font-bold uppercase tracking-[.14em] text-cyan-100">{active ? "active" : "one hour"}</span></div></div>
      <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-violet-100"><span className="font-semibold">Available credits</span><span className="rounded-full bg-cyan-200 px-2 py-1 font-bold text-mauve-950">{loading ? "—" : credits}</span></div>
      <div className="relative mt-3 grid gap-2">
        {active ? <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-2.5 text-xs text-fuchsia-100"><span className="inline-flex items-center gap-1.5 font-semibold"><Sparkles size={13}/> Color trail active</span><span className="mt-1 block text-fuchsia-100/70">Your saved Boost state ends when the clock reaches zero.</span></div> : null}
        {!active && credits > 0 ? <button disabled={loading || activating} onClick={activate} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200 px-4 py-3 text-sm font-bold text-mauve-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{activating ? <LoaderCircle size={16} className="animate-spin"/> : <TimerReset size={16}/>} {activating ? "Activating…" : "Start 1h Boost"}</button> : null}
        <button disabled={loading} onClick={openPurchase} className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${active || credits > 0 ? "border border-cyan-200/35 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/15" : "bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200 text-mauve-950 hover:brightness-110"}`}><Zap size={16}/>{active || credits > 0 ? "Buy more Boost credits" : "Buy a Boost credit"}</button>
      </div>
      {message && <p role="status" className="relative mt-3 text-xs text-rose-200">{message}</p>}
      <p className="relative mt-5 text-[10px] leading-4 text-violet-100/50">POC visual feature only. It does not guarantee placement, visibility, bookings, income, or any outcome.</p>
    </motion.div>

    {portalReady ? createPortal(<AnimatePresence>{purchaseOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] grid place-items-center bg-[#090511]/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="boost-purchase-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !processingPurchase) setPurchaseOpen(false); }}><motion.div initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: .98 }} transition={{ duration: .25, ease: [0.22, 1, .36, 1] }} className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-[#171024] p-6 shadow-[0_30px_100px_rgba(0,0,0,.65)] sm:p-7">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl"/><div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl"/>
      {!purchaseSuccess ? <div className="relative"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><Zap size={14}/> Profile Boost</p><h2 id="boost-purchase-title" className="mt-3 font-serif text-3xl tracking-[-.05em]">Choose your hours.</h2></div><button type="button" aria-label="Close purchase dialog" disabled={processingPurchase} onClick={() => setPurchaseOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/12 text-violet-100/65 transition hover:border-white/30 hover:text-white disabled:opacity-40"><X size={17}/></button></div>
        <p className="mt-3 text-xs leading-5 text-violet-100/65">Each credit gives you one hour of PRISM Boost. Select from ₹1,000 up to ₹10,000.</p>
        <div className="mt-7 rounded-3xl border border-white/10 bg-white/[.045] p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-violet-100/45">Your selection</p><p className="mt-1 font-serif text-5xl tracking-[-.07em]">₹{(selectedCredits * creditPrice).toLocaleString("en-IN")}</p></div><span className="rounded-2xl border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-right"><strong className="block text-lg text-cyan-100">{selectedCredits}</strong><span className="block text-[9px] font-bold uppercase tracking-[.13em] text-cyan-100/75">{selectedCredits === 1 ? "credit" : "credits"}</span></span></div>
          <input aria-label="Number of Boost credits" type="range" min="1" max="10" step="1" value={selectedCredits} onChange={(event) => setSelectedCredits(Number(event.target.value))} className="mt-7 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-200"/>
          <div className="mt-3 flex justify-between text-[10px] font-bold tracking-[.1em] text-violet-100/40"><span>₹1,000</span><span>₹10,000</span></div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#120d22]/70 px-3 py-2.5"><button type="button" aria-label="Remove a credit" onClick={() => setSelectedCredits((current) => Math.max(1, current - 1))} disabled={selectedCredits === 1} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-violet-100 transition hover:border-cyan-200 hover:text-cyan-100 disabled:opacity-30"><Minus size={15}/></button><span className="text-xs font-semibold text-violet-100">{selectedCredits} {selectedCredits === 1 ? "hour" : "hours"} of Boost</span><button type="button" aria-label="Add a credit" onClick={() => setSelectedCredits((current) => Math.min(10, current + 1))} disabled={selectedCredits === 10} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-violet-100 transition hover:border-cyan-200 hover:text-cyan-100 disabled:opacity-30"><Plus size={15}/></button></div>
        </div>
        <button type="button" disabled={processingPurchase} onClick={buyCredits} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200 px-5 py-3.5 text-sm font-bold text-mauve-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{processingPurchase ? <LoaderCircle size={17} className="animate-spin"/> : <Zap size={17}/>} {processingPurchase ? "Opening test checkout…" : `Continue · ₹${(selectedCredits * creditPrice).toLocaleString("en-IN")}`}</button><p className="mt-4 text-center text-[10px] leading-4 text-violet-100/45">Razorpay test checkout only. No real payment is processed in this POC.</p></div> : <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative py-3 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-cyan-200/35 bg-cyan-200/10 text-cyan-100 shadow-[0_0_40px_rgba(103,232,249,.2)]"><Check size={34}/></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.22em] text-cyan-100">Credits secured</p><h2 id="boost-purchase-title" className="mt-3 font-serif text-4xl tracking-[-.06em]">Ready when you are.</h2><p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-violet-100/65">{selectedCredits} {selectedCredits === 1 ? "Boost credit is" : "Boost credits are"} now available. Start one hour of visual PRISM Boost now, or keep your credits for later.</p><div className="mt-7 grid gap-3"><button type="button" disabled={activating} onClick={startPurchasedBoost} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200 px-5 py-3.5 text-sm font-bold text-mauve-950 transition hover:brightness-110 disabled:opacity-60">{activating ? <LoaderCircle size={17} className="animate-spin"/> : <Rocket size={17}/>} {activating ? "Starting…" : "Start the Boost"}</button><button type="button" onClick={() => setPurchaseOpen(false)} className="text-xs font-semibold text-violet-100/60 transition hover:text-white">Keep credits for later</button></div><p className="mt-5 text-[10px] text-violet-100/40">Available credits: {credits}</p></motion.div>}</motion.div></motion.div>}</AnimatePresence>, document.body) : null}
  </aside>;
}
