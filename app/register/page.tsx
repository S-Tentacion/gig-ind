"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/confetti-burst";
import { useSessionMember } from "@/components/member-menu";

type RazorpayPayment = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email?: string; contact?: string }; theme: { color: string }; handler: (payment: RazorpayPayment) => void | Promise<void>; modal: { ondismiss: () => void } };

declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void } } }

export default function RegisterPage() {
  const router = useRouter();
  const { member, loaded: sessionLoaded } = useSessionMember();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [contact, setContact] = useState("");
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");
  const [profileImages, setProfileImages] = useState<File[]>([]);

  useEffect(() => {
    if (sessionLoaded && member) router.replace("/");
  }, [member, router, sessionLoaded]);

  async function verifyPayment(payment: RazorpayPayment) {
    const response = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Payment verification failed.");
    const imageForm = new FormData();
    imageForm.append("contact", contact);
    imageForm.append("paymentId", payment.razorpay_payment_id);
    profileImages.forEach((image) => imageForm.append("images", image));
    const imageResponse = await fetch("/api/profile/images", { method: "POST", body: imageForm });
    const imageResult = await imageResponse.json();
    if (!imageResponse.ok) throw new Error(imageResult.error || "Your payment was verified, but we could not save your profile images.");
    const signupResponse = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact }) });
    const signupResult = await signupResponse.json();
    if (!signupResponse.ok) throw new Error(signupResult.error || "Your membership is ready, but we could not send the sign-in code.");
    setCreated(true);
  }

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (profileImages.length < 3 || profileImages.length > 5) { setError("Please add at least 3 and no more than 5 profile images before payment."); return; }
    if (!window.Razorpay || !scriptReady) { setError("The Razorpay test checkout is still loading. Please try again in a moment."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, city, contact }) });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error || "We could not create a Razorpay test order.");
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "Gigolo India", description: "₹1,500 joining fee · Project checkout", order_id: order.orderId, prefill: method === "email" ? { name, email: contact } : { name, contact }, theme: { color: "#675d70" }, modal: { ondismiss: () => setLoading(false) }, handler: async (payment) => { try { await verifyPayment(payment); } catch (caught) { setError(caught instanceof Error ? caught.message : "Payment verification failed."); } finally { setLoading(false); } } });
      checkout.open();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "We could not start the payment."); setLoading(false); }
  }

  if (!sessionLoaded || member) return <main className="grid min-h-screen place-items-center bg-mauve-950 text-mauve-50"><LoaderCircle className="animate-spin"/></main>;

  return <main className="min-h-screen px-5 py-5 sm:p-8"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} onError={() => setError("Razorpay Checkout could not load. Check your connection and try again.")}/><header className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="flex items-center gap-2.5"><span className="brand-glow grid h-9 w-9 place-items-center rounded-full bg-mauve-900 text-sm font-semibold text-mauve-50 dark:bg-mauve-100 dark:text-mauve-950">G</span><span className="brand-wordmark font-serif text-lg">Gigolo India</span></Link></header><section className="mx-auto grid max-w-6xl items-center gap-12 py-14 lg:min-h-[calc(100vh-100px)] lg:grid-cols-2 lg:py-0"><div className="order-2 lg:order-1"><p className="text-xs font-semibold uppercase tracking-[.18em] text-fuchsia-600 dark:text-fuchsia-300">A considered beginning</p><h1 className="mt-4 max-w-md font-serif text-5xl leading-[.98] tracking-tight sm:text-6xl">Make room for a little more possibility.</h1><div className="mt-8 space-y-4">{[[ShieldCheck,"Your details stay private"],[CheckCircle2,"Adults 18+ only"],[CheckCircle2,"Project payment checkout"]].map(([Icon, text]) => { const Glyph = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center gap-3 text-sm text-mauve-600 dark:text-mauve-300"><Glyph size={18} className="text-fuchsia-600 dark:text-fuchsia-300"/>{String(text)}</div>; })}</div><div className="mt-8 max-w-md rounded-2xl border border-mauve-300 bg-mauve-100/70 p-5 dark:border-mauve-700 dark:bg-mauve-900/60"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-200 to-cyan-100 text-mauve-800 dark:from-fuchsia-700 dark:to-cyan-800 dark:text-mauve-50"><ShieldCheck size={17}/></span><div><p className="text-sm font-semibold">Don’t worry about privacy.</p><p className="mt-1 text-sm leading-6 text-mauve-600 dark:text-mauve-300">Only you can see your profile—nobody else.</p></div></div></div></div><div className="order-1 rounded-[2rem] border bg-mauve-50 p-6 shadow-xl shadow-mauve-950/5 dark:bg-mauve-900/40 sm:p-9 lg:order-2"><Link href="/" className="inline-flex items-center gap-2 text-xs text-mauve-600 hover:text-mauve-900 dark:text-mauve-300 dark:hover:text-mauve-50"><ArrowLeft size={14}/> Back to home</Link><h2 className="mt-7 font-serif text-4xl">Join the circle</h2><p className="mt-2 text-sm text-mauve-600 dark:text-mauve-300">A one-time joining fee of <span className="font-semibold text-mauve-900 dark:text-mauve-50">₹1,500</span> is required.</p>{created ? <><ConfettiBurst/><div className="mt-8 rounded-2xl bg-mauve-100 p-5 dark:bg-mauve-800"><CheckCircle2 size={20} className="text-fuchsia-700 dark:text-fuchsia-200"/><p className="mt-3 font-medium">Payment verified. Your account is ready.</p><p className="mt-1 text-sm text-mauve-600 dark:text-mauve-300">Your ₹1,500 project payment was verified. Check your email for the secure sign-in link, or your phone for the verification code.</p><Button asChild className="button-shine mt-5"><Link href="/login">Continue to sign in <ArrowRight size={16}/></Link></Button></div></> : <form onSubmit={startCheckout} className="mt-8"><div className="flex rounded-xl bg-mauve-100 p-1 dark:bg-mauve-800"><button type="button" onClick={() => { setMethod("email"); setContact(""); }} className={`flex-1 rounded-lg py-2 text-sm transition ${method === "email" ? "bg-mauve-50 shadow-sm dark:bg-mauve-700" : "text-mauve-500"}`}>Email</button><button type="button" onClick={() => { setMethod("phone"); setContact(""); }} className={`flex-1 rounded-lg py-2 text-sm transition ${method === "phone" ? "bg-mauve-50 shadow-sm dark:bg-mauve-700" : "text-mauve-500"}`}>Phone</button></div><label className="mt-6 block text-sm font-medium">First name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your first name" className="mt-2 h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-300/50"/></label><label className="mt-4 block text-sm font-medium">City<input required value={city} onChange={(event) => setCity(event.target.value)} placeholder="Mumbai, Delhi, Bengaluru…" className="mt-2 h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-300/50"/></label><label className="mt-4 block text-sm font-medium">{method === "email" ? "Email address" : "Phone number"}<input required value={contact} onChange={(event) => setContact(event.target.value)} type={method === "email" ? "email" : "tel"} placeholder={method === "email" ? "you@example.com" : "+91 00000 00000"} className="mt-2 h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-300/50"/></label><div className="mt-5 rounded-2xl border border-dashed border-mauve-300 bg-mauve-100/50 p-4 dark:border-mauve-700 dark:bg-mauve-800/35"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Profile photos</p><p className="mt-1 text-xs leading-5 text-mauve-600 dark:text-mauve-300">Add 3 to 5 clear JPG, PNG, or WebP photos. Each must be under 5 MB.</p></div><span className="rounded-full bg-mauve-900 px-2 py-1 text-[10px] font-bold text-mauve-50 dark:bg-mauve-50 dark:text-mauve-950">{profileImages.length}/5</span></div><input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={(event) => { const selected = Array.from(event.currentTarget.files ?? []); setProfileImages((current) => { const next = [...current, ...selected]; if (next.length > 5) { setError("You can keep a maximum of 5 profile images."); return current; } setError(""); return next; }); event.currentTarget.value = ""; }} className="mt-4 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-mauve-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-mauve-50 dark:file:bg-mauve-50 dark:file:text-mauve-950"/>{profileImages.length > 0 && <div className="mt-4 grid grid-cols-5 gap-2">{profileImages.map((image, index) => <div key={`${image.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg bg-mauve-200 dark:bg-mauve-700"><img src={URL.createObjectURL(image)} alt={`Selected profile photo ${index + 1}`} className="h-full w-full object-cover"/><button type="button" onClick={() => setProfileImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Remove profile photo ${index + 1}`} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-mauve-950/85 text-mauve-50 shadow transition hover:scale-110 hover:bg-rose-600"><X size={12}/></button></div>)}</div>}<p className="mt-3 text-[11px] font-medium text-fuchsia-700 dark:text-fuchsia-200">At least 3 photos are required before checkout.</p></div><div className="mt-4 flex items-center justify-between rounded-xl bg-mauve-100 px-4 py-3 text-sm dark:bg-mauve-800"><span className="flex items-center gap-2"><CreditCard size={16} className="text-fuchsia-700 dark:text-fuchsia-300"/>Joining fee</span><strong>₹1,500</strong></div><label className="mt-4 flex items-start gap-2.5 text-xs leading-5 text-mauve-600 dark:text-mauve-300"><input required type="checkbox" className="mt-0.5 h-4 w-4 rounded border-mauve-400 accent-fuchsia-700"/>I confirm that I am at least 18 years old and agree to the community guidelines.</label>{error && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p>}<Button disabled={loading} type="submit" className="button-shine mt-6 w-full">{loading ? <><LoaderCircle className="animate-spin" size={16}/> Opening Razorpay</> : <>Pay ₹1,500 &amp; join <ArrowRight size={16}/></>}</Button><p className="mt-3 text-center text-[11px] text-mauve-500">Secure Razorpay Checkout · Project environment · No money is collected</p></form>}<p className="mt-7 text-center text-xs text-mauve-500">Already a member? <Link href="/login" className="font-semibold text-fuchsia-700 hover:underline dark:text-fuchsia-200">Sign in</Link></p></div></section></main>;
}









