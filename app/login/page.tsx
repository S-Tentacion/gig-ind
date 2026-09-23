"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSessionMember } from "@/components/member-menu";
import { TelegramLoginButton } from "@/components/telegram-login-button";

export default function LoginPage() {
  const router = useRouter();
  const { member, loaded: sessionLoaded } = useSessionMember();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionLoaded && member) router.replace("/");
  }, [member, router, sessionLoaded]);

  useEffect(() => {
    const state = new URLSearchParams(window.location.search).get("telegram");
    if (state === "unlinked") setError("This Telegram account is not linked to a paid membership. Sign in with email first, then link Telegram from your profile.");
    else if (state === "invalid") setError("Telegram could not verify this sign-in. Please try again.");
    else if (state === "failed") setError("Telegram sign-in could not be completed. Please use email or try again.");
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not sign you in.");
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not sign you in.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionLoaded || member) {
    return <main className="grid min-h-screen place-items-center bg-mauve-950 text-mauve-50"><LoaderCircle className="animate-spin" /></main>;
  }

  return <main className="min-h-screen px-5 py-5 sm:p-8">
    <header className="mx-auto flex max-w-6xl items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="brand-glow grid h-9 w-9 place-items-center rounded-full bg-mauve-900 text-sm font-semibold text-mauve-50 dark:bg-mauve-100 dark:text-mauve-950">G</span>
        <span className="brand-wordmark font-serif text-lg">Gigolo India</span>
      </Link>
    </header>
    <section className="mx-auto grid max-w-6xl items-center gap-12 py-14 lg:min-h-[calc(100vh-100px)] lg:grid-cols-2 lg:py-0">
      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-600 dark:text-cyan-300">Welcome back</p>
        <h1 className="mt-4 max-w-md font-serif text-6xl leading-[.98] tracking-tight">Your private space is waiting.</h1>
        <p className="mt-6 max-w-sm text-base leading-7 text-mauve-600 dark:text-mauve-300">Sign in with the email address and password you chose when your payment was confirmed.</p>
      </div>
      <div className="rounded-[2rem] border bg-mauve-50 p-6 shadow-xl shadow-mauve-950/5 dark:bg-mauve-900/40 sm:p-9">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-mauve-600 hover:text-mauve-900 dark:text-mauve-300 dark:hover:text-mauve-50"><ArrowLeft size={14} /> Back to home</Link>
        <h2 className="mt-7 font-serif text-4xl">Sign In</h2>
        <p className="mt-2 text-sm text-mauve-600 dark:text-mauve-300">Use your email address and password.</p>
        <form onSubmit={signIn} className="mt-8">
          <label className="block text-sm font-medium">Email address
            <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/50" />
          </label>
          <label className="mt-5 block text-sm font-medium">Password
            <input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="mt-2 h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/50" />
          </label>
          {error && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <Button disabled={loading} type="submit" className="button-shine mt-6 w-full">
            {loading ? <><LoaderCircle className="animate-spin" size={16} /> Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
          </Button>
        </form>
        <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.16em] text-mauve-400"><span className="h-px flex-1 bg-mauve-200 dark:bg-mauve-700" />or continue with<span className="h-px flex-1 bg-mauve-200 dark:bg-mauve-700" /></div>
        <div className="flex justify-center"><TelegramLoginButton /></div>
        <p className="mt-3 text-center text-xs leading-5 text-mauve-500">Telegram sign-in works after your Telegram account is linked through payment or from your profile.</p>
        <div className="mt-6 flex gap-2 rounded-xl bg-mauve-100/80 p-3 text-xs leading-5 text-mauve-600 dark:bg-mauve-800/70 dark:text-mauve-300"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-300" />Your account is available after payment confirmation. No email sign-in links are used.</div>
        <p className="mt-7 text-center text-xs text-mauve-500">New here? <Link href="/register" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-200">Request access</Link></p>
      </div>
    </section>
  </main>;
}
