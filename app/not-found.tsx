import Link from "next/link";
import { ArrowLeft, Compass, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0d0918] px-5 py-10 text-mauve-50">
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full bg-cyan-400/15 blur-[140px]" />

      <div className="relative w-full max-w-xl text-center">
        <Link href="/" className="mx-auto inline-flex items-center gap-2.5">
          <span className="brand-glow grid h-10 w-10 place-items-center rounded-xl text-sm font-bold">G</span>
          <span className="brand-wordmark font-serif text-xl">Gigolo India</span>
        </Link>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/15 bg-[#171024]/80 p-7 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-100"><Compass size={25}/></span>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[.25em] text-cyan-100">Error 404 · Route unavailable</p>
          <h1 className="mt-4 font-serif text-5xl leading-[.92] tracking-[-.065em] sm:text-6xl">That private path<br/>isn&apos;t here.</h1>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-violet-100/70">The page may have moved, expired, or never existed. Your account and private member space are unaffected.</p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100"><ArrowLeft size={16}/> Return home</Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[.045] px-5 py-3 text-sm font-semibold text-violet-100 transition hover:border-cyan-200/50 hover:text-white"><Sparkles size={16} className="text-cyan-100"/> Member sign in</Link>
          </div>

          <p className="mt-8 border-t border-white/10 pt-5 text-xs text-violet-100/50">Need to review the project policies? <Link href="/privacy" className="font-semibold text-cyan-100 transition hover:text-white">Open privacy &amp; policy</Link></p>
        </section>
      </div>
    </main>
  );
}
