"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, KeyRound, LoaderCircle, MailCheck, ShieldCheck, UserRound, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSessionMember } from "@/components/member-menu";

type RazorpayPayment = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email: string }; theme: { color: string }; handler: (payment: RazorpayPayment) => void | Promise<void>; modal: { ondismiss: () => void } };
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void } } }

function loadCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RegisterPage() {
  const router = useRouter();
  const { member, loaded: sessionLoaded } = useSessionMember();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [profileImages, setProfileImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paid, setPaid] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  useEffect(() => { if (sessionLoaded && member) router.replace("/"); }, [member, router, sessionLoaded]);
  const updateImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    setProfileImages((current) => {
      const next = [...current, ...selected];
      if (next.length > 5) { setError("You can keep a maximum of 5 profile images."); return current; }
      setError("");
      return next;
    });
  };

  const completePayment = async (payment: RazorpayPayment) => {
    const verified = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payment, password }) });
    const result = await verified.json() as { error?: string };
    if (!verified.ok) throw new Error(result.error || "Payment verification failed.");
    setPaid(true);
    const imageForm = new FormData();
    imageForm.append("contact", email.trim().toLowerCase());
    imageForm.append("paymentId", payment.razorpay_payment_id);
    profileImages.forEach((image) => imageForm.append("images", image));
    const imageResponse = await fetch("/api/profile/images", { method: "POST", body: imageForm });
    const imageResult = await imageResponse.json() as { error?: string };
    if (!imageResponse.ok) throw new Error(imageResult.error || "Your payment was confirmed, but we could not save your profile images.");
    setNotice("Your payment is confirmed and your account is ready. Sign in with your email and password.");
  };

  const startCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(trimmedUsername)) { setError("Choose a username with 3 to 24 letters, numbers, or underscores."); return; }
    if (password.length < 8) { setError("Choose a password with at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Your password confirmation does not match."); return; }
    if (profileImages.length < 3 || profileImages.length > 5) { setError("Please add at least 3 and no more than 5 profile images before payment."); return; }
    setLoading(true);
    try {
      if (!await loadCheckout() || !window.Razorpay) throw new Error("We could not load the secure checkout. Check your connection and try again.");
      const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, username: trimmedUsername, city, contact: normalizedEmail }) });
      const order = await response.json() as { keyId?: string; amount?: number; currency?: string; orderId?: string; error?: string };
      if (response.status === 409) {
        setError(order.error || "This email or username is already in use.");
        if (order.error?.includes("email")) setAccountExists(true);
        setLoading(false);
        return;
      }
      if (!response.ok || !order.keyId || !order.amount || !order.currency || !order.orderId) throw new Error(order.error || "We could not create an order.");
      new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: "Gigolo India", description: "₹1,500 joining fee", order_id: order.orderId,
        prefill: { name, email: normalizedEmail }, theme: { color: "#675d70" }, modal: { ondismiss: () => setLoading(false) },
        handler: async (payment) => { try { await completePayment(payment); } catch (caught) { setError(caught instanceof Error ? caught.message : "Payment verification failed."); } finally { setLoading(false); } },
      }).open();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not start payment.");
      setLoading(false);
    }
  };

  if (!sessionLoaded || member) return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><LoaderCircle className="animate-spin" /></main>;
  const recoveryScreen = paid || accountExists;

  return <main className="min-h-screen bg-[#0d0918] px-5 py-5 text-white sm:p-8">
    <header className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="flex items-center gap-2.5"><span className="brand-glow grid h-9 w-9 place-items-center rounded-full text-sm font-semibold">G</span><span className="brand-wordmark font-serif text-lg">Gigolo India</span></Link></header>
    <section className="mx-auto grid max-w-6xl items-start gap-12 py-14 lg:grid-cols-2 lg:py-10">
      <div className="hidden lg:block"><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-100">Private member access</p><h1 className="mt-4 max-w-md font-serif text-6xl leading-[.98] tracking-tight">Clear from payment to sign-in.</h1><div className="mt-8 space-y-4">{[[ShieldCheck, "Your details stay private"], [UserRound, "Customers see your username, not your legal name"], [CheckCircle2, "Adults 18+ only"], [KeyRound, "Your password protects your account"]].map(([Icon, text]) => { const Glyph = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center gap-3 text-sm text-violet-100/70"><Glyph size={18} className="text-cyan-100" />{String(text)}</div>; })}</div></div>
      <div className="rounded-[2rem] border border-white/12 bg-[#151022] p-6 shadow-xl sm:p-9"><Link href="/" className="inline-flex items-center gap-2 text-xs text-violet-100/65 hover:text-cyan-100"><ArrowLeft size={14} /> Back to home</Link>
        {recoveryScreen ? <div className="mt-7"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-200/10 text-cyan-100"><MailCheck size={21} /></span><h2 className="mt-5 font-serif text-4xl">{paid ? "Payment confirmed." : "You already have an account."}</h2><p className="mt-4 text-sm leading-6 text-violet-100/70">{paid ? "Your account has been created. Sign in with the email address and password you chose during registration." : "This email already has a paid account. Sign in with your email address and password."}</p><div className="mt-7 grid gap-3"><Link href="/login" className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950">Sign In <ArrowRight size={16} /></Link></div>{error && <p role="alert" className="mt-5 rounded-xl border border-rose-200/25 bg-rose-200/10 p-4 text-sm text-rose-100">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl border border-cyan-200/25 bg-cyan-200/10 p-4 text-sm text-cyan-100">{notice}</p>}</div> : <form onSubmit={startCheckout} className="mt-7"><h2 className="font-serif text-4xl">Join Gigolo India</h2><p className="mt-3 text-sm text-violet-100/65">Create your password now. It becomes your secure sign-in after payment.</p><label className="mt-6 block text-sm font-semibold">First name (government ID)<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /><span className="mt-1.5 block text-xs font-normal leading-5 text-violet-100/60">Use your first name exactly as it appears on your government ID. It is kept private and is never shown to customers.</span></label><label className="mt-5 block text-sm font-semibold">Username<input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoCapitalize="none" value={username} onChange={(event) => setUsername(event.target.value.replace(/\s/g, ""))} placeholder="arjun_24" className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /><span className="mt-1.5 block text-xs font-normal leading-5 text-violet-100/60">Use 3–24 letters, numbers, or underscores. It must be unique. Customers only see this username, never your legal name.</span></label><label className="mt-5 block text-sm font-semibold">City<input required value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /></label><label className="mt-4 block text-sm font-semibold">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Create password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /></label><label className="block text-sm font-semibold">Confirm password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter password" className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /></label></div><div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/[.035] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Profile photos</p><p className="mt-1 text-xs leading-5 text-violet-100/65">Add 3 to 5 clear JPG, PNG, or WebP photos. Each must be under 5 MB.</p></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-mauve-950">{profileImages.length}/5</span></div><input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={updateImages} className="mt-4 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-mauve-950" />{profileImages.length > 0 && <div className="mt-4 grid grid-cols-5 gap-2">{profileImages.map((image, index) => <div key={`${image.name}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-white/10"><img src={URL.createObjectURL(image)} alt={`Selected profile photo ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => setProfileImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Remove profile photo ${index + 1}`} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-white"><X size={12} /></button></div>)}</div>}</div><div className="mt-4 flex items-center justify-between rounded-xl bg-white/[.06] px-4 py-3 text-sm"><span className="flex items-center gap-2"><CreditCard size={16} className="text-cyan-100" />Joining fee</span><strong>₹1,500</strong></div>{error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}<Button disabled={loading} type="submit" className="mt-6 w-full bg-white text-mauve-950 hover:bg-cyan-100">{loading ? <><LoaderCircle className="animate-spin" size={16} /> Opening checkout…</> : <>Pay ₹1,500 &amp; continue <ArrowRight size={16} /></>}</Button></form>}
        <p className="mt-7 text-center text-xs text-violet-100/55">Already a member? <Link href="/login" className="font-semibold text-cyan-100 hover:underline">Sign In</Link></p>
      </div>
    </section>
  </main>;
}
