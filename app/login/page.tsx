"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, MailCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSessionMember } from "@/components/member-menu";

export default function LoginPage() {
  const router = useRouter();
  const { member, loaded: sessionLoaded } = useSessionMember();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionLoaded && member) router.replace("/");
  }, [member, router, sessionLoaded]);

  async function sendSignInRequest() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not start sign-in.");
      setVerificationSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not start sign-in.");
    } finally {
      setLoading(false);
    }
  }

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendSignInRequest();
  }

  async function verifyPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, token: code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not verify your code.");
      setMemberName(result.member.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not verify your code.");
    } finally {
      setLoading(false);
    }
  }

  function useDifferentContact() {
    setVerificationSent(false);
    setCode("");
    setError("");
  }

  if (!sessionLoaded || member) {
    return <main className="grid min-h-screen place-items-center bg-mauve-950 text-mauve-50"><LoaderCircle className="animate-spin"/></main>;
  }

  const emailLinkState = verificationSent && method === "email";
  const phoneCodeState = verificationSent && method === "phone";

  return (
    <main className="min-h-screen px-5 py-5 sm:p-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="brand-glow grid h-9 w-9 place-items-center rounded-full bg-mauve-900 text-sm font-semibold text-mauve-50 dark:bg-mauve-100 dark:text-mauve-950">G</span>
          <span className="brand-wordmark font-serif text-lg">Gigolo India</span>
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 py-14 lg:min-h-[calc(100vh-100px)] lg:grid-cols-2 lg:py-0">
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-600 dark:text-cyan-300">Welcome back</p>
          <h1 className="mt-4 max-w-md font-serif text-6xl leading-[.98] tracking-tight">The circle is waiting.</h1>
          <p className="mt-6 max-w-sm leading-7 text-mauve-600 dark:text-mauve-300">Sign in privately with an email link or a phone verification code.</p>
        </div>

        <div className="rounded-[2rem] border bg-mauve-50 p-6 shadow-xl shadow-mauve-950/5 dark:bg-mauve-900/40 sm:p-9">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-mauve-600 hover:text-mauve-900 dark:text-mauve-300 dark:hover:text-mauve-50"><ArrowLeft size={14}/> Back to home</Link>
          <h2 className="mt-7 font-serif text-4xl">Sign in</h2>
          <p className="mt-2 text-sm text-mauve-600 dark:text-mauve-300">Use the email address or phone number you registered with.</p>

          {memberName ? <div className="mt-8 rounded-2xl bg-mauve-100 p-5 dark:bg-mauve-800"><CheckCircle2 size={20} className="text-cyan-700 dark:text-cyan-200"/><p className="mt-3 font-medium">Welcome back, {memberName}.</p><p className="mt-1 text-sm text-mauve-600 dark:text-mauve-300">Your Supabase verification is complete.</p><Button asChild className="button-shine mt-5"><Link href="/">Explore the circle <ArrowRight size={16}/></Link></Button></div> : null}

          {!memberName && emailLinkState ? <div className="mt-8"><div className="rounded-2xl border border-cyan-500/25 bg-cyan-100/50 p-5 text-center dark:bg-cyan-300/10"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-600 text-white dark:bg-cyan-200 dark:text-mauve-950"><MailCheck size={22}/></span><h3 className="mt-4 font-serif text-2xl">Check your inbox</h3><p className="mt-2 text-sm leading-6 text-mauve-600 dark:text-mauve-300">We sent a secure sign-in link to <span className="font-semibold text-mauve-900 dark:text-mauve-50">{contact}</span>.</p><p className="mt-3 text-xs leading-5 text-mauve-500 dark:text-mauve-400">Open the email and click the link to return here signed in. There is no code to enter.</p></div>{error ? <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}<Button disabled={loading} type="button" onClick={sendSignInRequest} variant="outline" className="mt-5 w-full">{loading ? "Sending link…" : "Resend sign-in link"}<ArrowRight size={16}/></Button><button type="button" onClick={useDifferentContact} className="mt-4 w-full text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-200">Use a different email</button></div> : null}

          {!memberName && phoneCodeState ? <form onSubmit={verifyPhoneCode} className="mt-8"><label className="block text-sm font-medium">Verification code<input required autoFocus inputMode="numeric" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="Enter the code" className="mt-2 h-12 w-full rounded-xl border bg-transparent px-4 text-sm tracking-[.35em] outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/50"/></label><p className="mt-3 text-xs leading-5 text-mauve-500">We sent a code to {contact}. Check your phone.</p>{error ? <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}<Button disabled={loading} type="submit" className="button-shine mt-6 w-full">{loading ? "Verifying…" : "Verify and sign in"}<ArrowRight size={16}/></Button><button type="button" onClick={useDifferentContact} className="mt-4 w-full text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-200">Use a different contact</button></form> : null}

          {!memberName && !verificationSent ? <form onSubmit={requestCode} className="mt-8"><div className="flex rounded-xl bg-mauve-100 p-1 dark:bg-mauve-800"><button type="button" onClick={() => { setMethod("email"); setContact(""); }} className={`flex-1 rounded-lg py-2 text-sm transition ${method === "email" ? "bg-mauve-50 shadow-sm dark:bg-mauve-700" : "text-mauve-500"}`}>Email</button><button type="button" onClick={() => { setMethod("phone"); setContact(""); }} className={`flex-1 rounded-lg py-2 text-sm transition ${method === "phone" ? "bg-mauve-50 shadow-sm dark:bg-mauve-700" : "text-mauve-500"}`}>Phone</button></div><label className="mt-6 block text-sm font-medium">{method === "email" ? "Email address" : "Phone number"}<input required value={contact} onChange={(event) => setContact(event.target.value)} type={method === "email" ? "email" : "tel"} placeholder={method === "email" ? "you@example.com" : "+91 00000 00000"} className="mt-2 h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/50"/></label>{method === "phone" ? <p className="mt-2 text-xs text-mauve-500">Use country code, for example +91 98765 43210.</p> : null}{error ? <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}<Button disabled={loading} type="submit" className="button-shine mt-6 w-full">{loading ? "Sending…" : method === "email" ? "Send sign-in link" : "Send verification code"}<ArrowRight size={16}/></Button></form> : null}

          <div className="mt-6 flex gap-2 rounded-xl bg-mauve-100/80 p-3 text-xs leading-5 text-mauve-600 dark:bg-mauve-800/70 dark:text-mauve-300"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-300"/>Your sign-in is verified by Supabase Auth. No password or social sign-in is used.</div>
          <p className="mt-7 text-center text-xs text-mauve-500">New here? <Link href="/register" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-200">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}
