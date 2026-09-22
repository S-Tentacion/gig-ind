"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    if (password !== confirmPassword) { setError("Your passwords do not match."); return; }
    setLoading(true);
    try { const response = await fetch("/api/auth/set-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); const data = await response.json() as { message?: string; error?: string }; if (!response.ok) throw new Error(data.error || "We could not set your password."); setMessage("You're in. Welcome back."); window.setTimeout(() => router.replace("/"), 900); } catch (caught) { setError(caught instanceof Error ? caught.message : "We could not set your password."); } finally { setLoading(false); }
  };
  return <main className="grid min-h-screen place-items-center bg-[#0d0918] px-5 text-white"><section className="w-full max-w-md rounded-[2rem] border border-white/12 bg-[#151022] p-7 shadow-2xl sm:p-9"><Link href="/" className="text-sm text-cyan-100">Back to home</Link><span className="mt-7 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-200/10 text-cyan-100"><KeyRound size={21} /></span><h1 className="mt-5 font-serif text-4xl">Set your password.</h1><p className="mt-3 text-sm leading-6 text-violet-100/65">Your payment is confirmed. Set your password to access your account.</p><form onSubmit={submit} className="mt-7"><label className="block text-sm font-semibold">New password<input required minLength={8} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /></label><label className="mt-5 block text-sm font-semibold">Confirm password<input required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none focus:border-cyan-200" /></label>{error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}{message && <p role="status" className="mt-4 text-sm text-cyan-100">{message}</p>}<button disabled={loading} type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100 disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}{loading ? "Saving…" : "Save password"}<ArrowRight size={16} /></button></form></section></main>;
}
