"use client";

import { LanguageSwitcher, LocalizedLink as Link, useLocalizedRouter } from "@/components/localization-provider";
import { BadgeCheck, CheckCircle2, ChevronLeft, CircleAlert, Clock3, CreditCard, FileText, LoaderCircle, MapPin, ReceiptText, RefreshCw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MemberMenu, useSessionMember } from "@/components/member-menu";

type PaymentStatus = "created" | "verified" | "failed" | "refunded";
type PaymentType = "signup" | "kit" | "boost";

type Transaction = {
  id: string;
  paymentType: PaymentType;
  boostCredits: number;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  orderId: string;
  paymentId: string | null;
  createdAt: string;
  verifiedAt: string | null;
  refundedAt: string | null;
};

type Summary = { totalPaidPaise: number; accepted: number; pending: number; rejected: number; refunded: number };
type Filter = "all" | PaymentStatus;

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "verified", label: "Accepted" },
  { value: "created", label: "Pending" },
  { value: "failed", label: "Rejected" },
  { value: "refunded", label: "Refunded" },
];

const statusMeta: Record<PaymentStatus, { label: string; description: string; Icon: typeof Clock3; className: string }> = {
  verified: { label: "Accepted", description: "Payment verified", Icon: CheckCircle2, className: "border-emerald-200/30 bg-emerald-300/10 text-emerald-100" },
  created: { label: "Pending", description: "Awaiting confirmation", Icon: Clock3, className: "border-amber-100/30 bg-amber-100/10 text-amber-100" },
  failed: { label: "Rejected", description: "Payment was not accepted", Icon: XCircle, className: "border-rose-200/30 bg-rose-300/10 text-rose-100" },
  refunded: { label: "Refunded", description: "Payment returned", Icon: RefreshCw, className: "border-cyan-200/30 bg-cyan-200/10 text-cyan-100" },
};

const paymentTypeMeta: Record<PaymentType, { label: string; description: string; Icon: typeof CreditCard }> = {
  signup: { label: "Account access", description: "Registration payment", Icon: CreditCard },
  kit: { label: "PRISM Kit", description: "Kit payment", Icon: Sparkles },
  boost: { label: "Profile Boost", description: "Boost credits", Icon: BadgeCheck },
};

function formatMoney(amountPaise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 }).format(amountPaise / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function shortenedReference(value: string) {
  return value.length > 14 ? `…${value.slice(-12)}` : value;
}

export function PaymentHistoryModule() {
  const router = useLocalizedRouter();
  const { member, loaded } = useSessionMember();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loaded) return;
    if (!member) {
      router.replace("/login");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/payments/history", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, status: response.status, data: await response.json() as { transactions?: Transaction[]; summary?: Summary; error?: string } }))
      .then(({ ok, status, data }) => {
        if (!active) return;
        if (status === 401) {
          router.replace("/login");
          return;
        }
        if (!ok) throw new Error(data.error ?? "We could not load your payment history.");
        setTransactions(data.transactions ?? []);
        setSummary(data.summary ?? { totalPaidPaise: 0, accepted: 0, pending: 0, rejected: 0, refunded: 0 });
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "We could not load your payment history."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loaded, member, refreshIndex, router]);

  const visibleTransactions = useMemo(() => filter === "all" ? transactions : transactions.filter((transaction) => transaction.status === filter), [filter, transactions]);

  if (!loaded || !member) return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><LoaderCircle className="animate-spin" aria-label="Loading payments" /></main>;

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d0918] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[150px]" /><div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-[150px]" /></div>
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-cyan-100"><ShieldCheck size={18} /></span><span><span className="brand-wordmark block text-[10px] font-bold uppercase tracking-[.24em]">GIGOLO INDIA</span><span className="mt-0.5 block font-serif text-lg tracking-[.1em]">MEMBER</span></span></Link><div className="flex items-center gap-2"><LanguageSwitcher className="hidden sm:inline-flex" /><MemberMenu member={member} /></div></nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-9 lg:px-8 lg:pt-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-violet-100/65 transition hover:text-cyan-100"><ChevronLeft size={16} /> Back to home</Link>
        <div className="mt-7 overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_10%_10%,rgba(217,70,239,.18),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,.14),transparent_34%),#151022] p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><ReceiptText size={14} /> PAYMENT HISTORY</p><h1 className="mt-3 font-serif text-4xl tracking-[-.06em] sm:text-5xl">Your transactions, clearly tracked.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-violet-100/70">Review your account access, PRISM Kit, and Profile Boost payments in one private place.</p></div><button type="button" onClick={() => setRefreshIndex((current) => current + 1)} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-200 hover:text-mauve-950 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button></div>
          <div className="mt-7 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-cyan-100"><MapPin size={12} /> {member.city}</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-violet-100/65"><ShieldCheck size={12} /> Private payment record</span></div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/12 bg-white/[.035] p-5"><CreditCard size={19} className="text-cyan-100" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-violet-100/45">Total paid</p><p className="mt-2 font-serif text-3xl">{formatMoney(summary?.totalPaidPaise ?? 0, "INR")}</p><p className="mt-2 text-xs text-violet-100/60">Verified CoinGate total</p></article>
          <article className="rounded-2xl border border-emerald-200/20 bg-emerald-300/[.06] p-5"><CheckCircle2 size={19} className="text-emerald-100" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100/70">Accepted</p><p className="mt-2 font-serif text-3xl">{summary?.accepted ?? 0}</p><p className="mt-2 text-xs text-violet-100/60">Confirmed payments</p></article>
          <article className="rounded-2xl border border-amber-100/20 bg-amber-100/[.06] p-5"><Clock3 size={19} className="text-amber-100" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-amber-100/70">Pending</p><p className="mt-2 font-serif text-3xl">{summary?.pending ?? 0}</p><p className="mt-2 text-xs text-violet-100/60">Awaiting confirmation</p></article>
          <article className="rounded-2xl border border-rose-200/20 bg-rose-300/[.06] p-5"><CircleAlert size={19} className="text-rose-100" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-rose-100/70">Rejected</p><p className="mt-2 font-serif text-3xl">{summary?.rejected ?? 0}</p><p className="mt-2 text-xs text-violet-100/60">Unsuccessful payments</p></article>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/12 bg-[#151022]/85 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100">ALL TRANSACTIONS</p><h2 className="mt-2 font-serif text-3xl tracking-[-.045em]">Payment activity.</h2></div><div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">{filters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${filter === item.value ? "border-cyan-200 bg-cyan-200 text-mauve-950" : "border-white/12 bg-white/[.035] text-violet-100/70 hover:border-cyan-200/50 hover:text-cyan-100"}`}>{item.label}</button>)}</div></div>

          {loading ? <div className="grid min-h-64 place-items-center text-cyan-100"><span className="flex items-center gap-2 text-sm"><LoaderCircle size={16} className="animate-spin" /> Loading transactions…</span></div> : error ? <div className="grid min-h-64 place-items-center px-4 text-center"><div><CircleAlert size={24} className="mx-auto text-rose-100" /><h3 className="mt-4 font-serif text-2xl">Payment history is unavailable.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-violet-100/65">{error}</p><button type="button" onClick={() => setRefreshIndex((current) => current + 1)} className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-200 hover:text-mauve-950"><RefreshCw size={15} /> Try again</button></div></div> : visibleTransactions.length === 0 ? <div className="grid min-h-64 place-items-center px-4 text-center"><div><FileText size={25} className="mx-auto text-cyan-100" /><h3 className="mt-4 font-serif text-2xl">No transactions here yet.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-violet-100/65">Payments for account access, your PRISM Kit, and Profile Boost credits will appear here once they are created.</p></div></div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[48rem] text-left"><thead className="border-b border-white/10 text-[10px] font-bold uppercase tracking-[.14em] text-violet-100/45"><tr><th className="px-3 py-3">Transaction</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3 text-right">Amount</th></tr></thead><tbody>{visibleTransactions.map((transaction) => { const kind = paymentTypeMeta[transaction.paymentType]; const status = statusMeta[transaction.status]; const TypeIcon = kind.Icon; const StatusIcon = status.Icon; const boostSuffix = transaction.paymentType === "boost" && transaction.boostCredits > 0 ? ` · ${transaction.boostCredits} credit${transaction.boostCredits === 1 ? "" : "s"}` : ""; return <tr key={transaction.id} className="border-b border-white/8 last:border-0"><td className="px-3 py-4"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[.035] text-cyan-100"><TypeIcon size={17} /></span><span><strong className="block text-sm">{kind.label}{boostSuffix}</strong><span className="mt-1 block text-xs text-violet-100/55">{kind.description}</span></span></span></td><td className="px-3 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold ${status.className}`}><StatusIcon size={13} /> {status.label}</span><span className="mt-1.5 block text-[11px] text-violet-100/50">{status.description}</span></td><td className="px-3 py-4 text-sm text-violet-100/70">{formatDate(transaction.verifiedAt || transaction.refundedAt || transaction.createdAt)}</td><td className="px-3 py-4"><span title={transaction.orderId} className="font-mono text-xs text-violet-100/60">{shortenedReference(transaction.orderId)}</span></td><td className="px-3 py-4 text-right text-base font-bold">{formatMoney(transaction.amountPaise, transaction.currency)}</td></tr>; })}</tbody></table></div>}
          <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-5 text-xs leading-5 text-violet-100/55"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-cyan-100" />Payment status is set only after server-side verification. Your card or bank details are never displayed here.</p>
        </section>
      </section>
    </main>
  );
}
