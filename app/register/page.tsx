"use client";

import { LocalizedLink as Link, useLocalizedRouter } from "@/components/localization-provider";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, KeyRound, LoaderCircle, MailCheck, ShieldCheck, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSessionMember } from "@/components/member-menu";
import { supportedCities } from "@/lib/supported-cities";
import { createCoinGateOrder, openCoinGateWindow, waitForCoinGatePayment, type CoinGateCheckoutOrder } from "@/lib/coingate-checkout-client";

type Field = "name" | "username" | "city" | "email" | "password" | "confirmPassword" | "images" | "consent";

export default function RegisterPage() {
  const router = useLocalizedRouter();
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
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [photoError, setPhotoError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const validation: Record<Field, string> = {
    name: name.trim().length >= 2 && name.trim().length <= 80 ? "" : "Enter your first name (2–80 characters).",
    username: /^[a-zA-Z0-9_]{3,24}$/.test(username.trim()) ? "" : "Username must be 3–24 letters, numbers, or underscores.",
    city: supportedCities.some((supported) => supported === city) ? "" : "Choose a supported city.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "" : "Enter a valid email address.",
    password: password.length >= 8 && password.length <= 128 ? "" : "Use 8–128 characters for your password.",
    confirmPassword: confirmPassword && password === confirmPassword ? "" : "Passwords must match.",
    images: profileImages.length >= 3 && profileImages.length <= 5 ? "" : "Add 3 to 5 profile photos before payment.",
    consent: consent ? "" : "Confirm your age and agreement before continuing.",
  };
  const fieldError = (field: Field) => touched[field] ? validation[field] : "";
  const touch = (field: Field) => setTouched((current) => ({ ...current, [field]: true }));
  const inputProps = (field: Field) => ({ id: field, name: field, onBlur: () => touch(field), "aria-invalid": Boolean(fieldError(field)), "aria-describedby": `${["name", "username", "password"].includes(field) ? `${field}-help ` : ""}${field}-error`, className: `mt-2 h-12 w-full rounded-xl border bg-white/[.035] px-4 text-sm font-normal outline-none focus:ring-2 focus:ring-cyan-200/40 ${fieldError(field) ? "border-rose-300" : "border-white/12 focus:border-cyan-200"}` });
  const errorMessage = (field: Field) => <p id={`${field}-error`} aria-live="polite" className="mt-1.5 text-xs font-normal text-rose-200">{fieldError(field)}</p>;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((pattern) => pattern.test(password)).length;
  const strength = password.length < 8 ? 1 : password.length >= 12 && variety >= 3 ? 3 : variety >= 2 ? 2 : 1;

  useEffect(() => {
    const urls = profileImages.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [profileImages]);

  useEffect(() => { if (sessionLoaded && member) router.replace("/"); }, [member, router, sessionLoaded]);
  const updateImages = (selected: File[]) => {
    if (loading || !selected.length) return;
    touch("images");
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) { setPhotoError("Use JPG, PNG, or WebP images only."); return; }
    if (selected.some((file) => file.size === 0 || file.size > 5 * 1024 * 1024)) { setPhotoError("Each photo must be non-empty and no larger than 5 MB."); return; }
    if (profileImages.length + selected.length > 5) { setPhotoError("You can keep a maximum of 5 profile photos. Remove one before adding more."); return; }
    setPhotoError("");
    setProfileImages((current) => [...current, ...selected]);
  };

  const completePayment = async (order: CoinGateCheckoutOrder) => {
    await waitForCoinGatePayment(order);
    const verified = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.orderId, checkoutSecret: order.checkoutSecret, password }) });
    const result = await verified.json() as { error?: string; paymentId?: string };
    if (!verified.ok) throw new Error(result.error || "Payment verification failed.");
    if (!result.paymentId) throw new Error("CoinGate confirmed payment, but the receipt reference is unavailable.");
    setPaid(true);
    const imageForm = new FormData();
    imageForm.append("contact", email.trim().toLowerCase());
    imageForm.append("paymentId", result.paymentId);
    profileImages.forEach((image) => imageForm.append("images", image));
    const imageResponse = await fetch("/api/profile/images", { method: "POST", body: imageForm });
    const imageResult = await imageResponse.json() as { error?: string };
    if (!imageResponse.ok) throw new Error(imageResult.error || "Your payment was confirmed, but we could not save your profile images.");
    setNotice("Your payment is confirmed and your account is ready. Sign in with your email and password.");
  };

  const startCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setNotice("");
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();
    const fields = Object.keys(validation) as Field[];
    setTouched(Object.fromEntries(fields.map((field) => [field, true])));
    const invalidField = fields.find((field) => validation[field]);
    if (invalidField) { formRef.current?.querySelector<HTMLElement>(`#${invalidField}`)?.focus(); return; }
    setLoading(true);
    try {
      const popup = openCoinGateWindow();
      const order = await createCoinGateOrder({ name, username: trimmedUsername, city, contact: normalizedEmail, source: "registration", returnPath: "/register" }, popup);
      await completePayment(order);
      popup?.close();
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
      <div className="hidden lg:block"><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-100">Private member access</p><h1 className="mt-4 max-w-md font-serif text-6xl leading-[.98] tracking-tight">Join in minutes.</h1><p className="mt-5 max-w-sm text-base leading-7 text-violet-100/65">Create your account, then complete payment to activate it.</p><div className="mt-8 space-y-4">{[[ShieldCheck, "Your details stay private"], [UserRound, "Customers see your username, not your legal name"], [CheckCircle2, "Adults 18+ only"], [KeyRound, "Your password protects your account"]].map(([Icon, text]) => { const Glyph = Icon as typeof ShieldCheck; return <div key={String(text)} className="flex items-center gap-3 text-sm text-violet-100/70"><Glyph size={18} className="text-cyan-100" />{String(text)}</div>; })}</div><div className="mt-12 max-w-md rounded-2xl border border-white/10 bg-white/[.025] p-6"><h2 className="font-serif text-2xl">How it works</h2><ol className="mt-6 space-y-6">{[["Make it yours", "Choose your username, add your details, and upload 3–5 photos."], ["Activate your membership", "Complete the ₹1,500 Standard membership payment through CoinGate."], ["Sign in and get started", "Use your email and password. Add PRISM Premium later if you choose."]].map(([title, detail], index) => <li key={title} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-100/20 text-xs text-cyan-100">{index + 1}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-violet-100/60">{detail}</p></div></li>)}</ol></div></div>
      <div className="rounded-[2rem] border border-white/12 bg-[#151022] p-6 shadow-xl sm:p-9"><Link href="/" className="inline-flex items-center gap-2 text-xs text-violet-100/65 hover:text-cyan-100"><ArrowLeft size={14} /> Back to home</Link>
        {recoveryScreen ? <div className="mt-7"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-200/10 text-cyan-100"><MailCheck size={21} /></span><h2 className="mt-5 font-serif text-4xl">{paid ? "Payment confirmed." : "You already have an account."}</h2><p className="mt-4 text-sm leading-6 text-violet-100/70">{paid ? "Your account has been created. Sign in with the email address and password you chose during registration." : "This email already has a paid account. Sign in with your email address and password."}</p><div className="mt-7 grid gap-3"><Link href="/login" className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950">Sign In <ArrowRight size={16} /></Link></div>{error && <p role="alert" className="mt-5 rounded-xl border border-rose-200/25 bg-rose-200/10 p-4 text-sm text-rose-100">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl border border-cyan-200/25 bg-cyan-200/10 p-4 text-sm text-cyan-100">{notice}</p>}</div> : <form ref={formRef} onSubmit={startCheckout} noValidate className="mt-7">
  <ol aria-label="Registration progress" className="mb-7 flex items-center gap-3 text-xs sm:text-sm">
    <li aria-current={!loading ? "step" : undefined} className={!loading ? "font-semibold text-cyan-100" : "text-violet-100/60"}>Step 1: Your Details</li>
    <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-violet-100/40" />
    <li aria-current={loading ? "step" : undefined} className={loading ? "font-semibold text-cyan-100" : "text-violet-100/50"}>Step 2: CoinGate Payment</li>
  </ol>
  <h2 className="font-serif text-4xl">Join in minutes.</h2>
  <p className="mt-3 text-sm leading-6 text-violet-100/65">Create your account, then complete payment to activate it.</p>
  <fieldset disabled={loading} className="min-w-0">
    <legend className="sr-only">Your membership details</legend>
    <div className="mt-6"><label htmlFor="name" className="text-sm font-semibold">First name (government ID)</label>
      <input {...inputProps("name")} required minLength={2} maxLength={80} autoComplete="given-name" value={name} onChange={(event) => setName(event.target.value)} />
      <p id="name-help" className="mt-1.5 text-xs leading-5 text-violet-100/60">Use your first name exactly as it appears on your government ID. It is kept private and is never shown to customers.</p>{errorMessage("name")}
    </div>
    <div className="mt-5"><label htmlFor="username" className="text-sm font-semibold">Username</label>
      <input {...inputProps("username")} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="arjun_24" />
      <p id="username-help" className="mt-1.5 text-xs leading-5 text-violet-100/60">Use 3–24 letters, numbers, or underscores. It must be unique. Customers only see this username, never your legal name.</p>{errorMessage("username")}
    </div>
    <div className="mt-5"><label htmlFor="city" className="text-sm font-semibold">City</label>
      <select {...inputProps("city")} required value={city} onChange={(event) => setCity(event.target.value)}><option value="" className="bg-[#151022]">Select your city</option>{supportedCities.map((supported) => <option key={supported} value={supported} className="bg-[#151022]">{supported}</option>)}</select>{errorMessage("city")}
    </div>
    <div className="mt-4"><label htmlFor="email" className="text-sm font-semibold">Email address</label>
      <input {...inputProps("email")} required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />{errorMessage("email")}
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="password" className="text-sm font-semibold">Create password</label>
        <input {...inputProps("password")} required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
        <div id="password-help" className="mt-2"><div aria-hidden="true" className="flex gap-1">{[1, 2, 3].map((level) => <span key={level} className={"h-1 flex-1 rounded-full " + (password && level <= strength ? strength === 1 ? "bg-rose-300" : strength === 2 ? "bg-amber-200" : "bg-cyan-200" : "bg-white/10")} />)}</div><p aria-live="polite" className="mt-1.5 text-xs text-violet-100/65">{password ? "Password strength: " + ["Weak", "Medium", "Strong"][strength - 1] : "Use 8+ characters; longer is stronger."}</p></div>{errorMessage("password")}
      </div>
      <div><label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm password</label>
        <input {...inputProps("confirmPassword")} required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter password" />{errorMessage("confirmPassword")}
      </div>
    </div>
    <div onDragOver={(event) => { event.preventDefault(); if (!loading) setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); updateImages(Array.from(event.dataTransfer.files)); }} className={"mt-5 rounded-2xl border border-dashed p-4 transition-colors " + (photoError || fieldError("images") ? "border-rose-300" : dragging ? "border-cyan-200 bg-cyan-200/10" : "border-white/20 bg-white/[.035]")}>
      <div className="flex items-start justify-between gap-4"><div><label htmlFor="images" className="text-sm font-semibold">Profile photos</label><p id="images-help" className="mt-1 text-xs leading-5 text-violet-100/65">Drag and drop here, or choose photos below. Add 3 to 5 JPG, PNG, or WebP images, up to 5 MB each.</p></div><span aria-live="polite" className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-mauve-950">{profileImages.length}/5</span></div>
      <input id="images" name="images" accept="image/jpeg,image/png,image/webp" multiple type="file" aria-invalid={Boolean(photoError || fieldError("images"))} aria-describedby="images-help images-error photo-error" onBlur={() => touch("images")} onChange={(event) => { updateImages(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} className="mt-4 block w-full rounded-lg text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-mauve-950" />
      <p id="photo-error" role="alert" className="mt-2 text-xs text-rose-200">{photoError}</p>{errorMessage("images")}
      {profileImages.length > 0 && <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">{profileImages.map((image, index) => <div key={image.name + index} className="relative aspect-square rounded-lg bg-white/10">{previews[index] && <img src={previews[index]} alt={"Selected profile photo " + (index + 1)} className="h-full w-full rounded-lg object-cover" />}<button type="button" onClick={() => { setProfileImages((current) => current.filter((_, imageIndex) => imageIndex !== index)); setPhotoError(""); touch("images"); }} aria-label={"Remove profile photo " + (index + 1)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><X size={14} /></button></div>)}</div>}
    </div>
    <div className="mt-5 rounded-xl bg-white/[.06] px-4 py-4"><div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><CreditCard size={16} aria-hidden="true" className="shrink-0 text-cyan-100" />Membership fee (Standard)</span><strong className="shrink-0">₹1,500</strong></div><p className="mt-2 text-xs leading-5 text-violet-100/60">Paid securely through CoinGate. This is separate from PRISM Premium, which you can add later from your account.</p></div>
    <div className="mt-5"><div className="flex items-start gap-3"><input id="consent" name="consent" required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} onBlur={() => touch("consent")} aria-invalid={Boolean(fieldError("consent"))} aria-describedby="consent-error" className="mt-1 h-4 w-4 shrink-0 accent-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200" /><label htmlFor="consent" className="text-xs leading-6 text-violet-100/75">I confirm I am 18 or older and agree to the <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-100 underline underline-offset-2">Terms of Use<span className="sr-only"> (opens in a new tab)</span></Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-100 underline underline-offset-2">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></Link>.</label></div>{errorMessage("consent")}</div>
  </fieldset>
  {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
  <Button disabled={loading || !consent} type="submit" className="mt-6 w-full bg-white text-mauve-950 hover:bg-cyan-100 disabled:opacity-40">{loading ? <><LoaderCircle className="animate-spin" size={16} /> Waiting for CoinGate…</> : <>Pay ₹1,500 with CoinGate <ArrowRight size={16} /></>}</Button>
</form>}
        <p className="mt-7 text-center text-xs text-violet-100/55">Already a member? <Link href="/login" className="font-semibold text-cyan-100 hover:underline">Sign In</Link></p>
      </div>
    </section>
  </main>;
}
