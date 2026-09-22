"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Crown,
  Filter,
  Grid2X2,
  List,
  LockKeyhole,
  MapPin,
  MessageCircle,
  SearchX,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/locale-provider";
import { MemberMenu, useSessionMember } from "@/components/member-menu";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

type Availability = "available_now" | "this_week" | "unavailable";
type ViewMode = "grid" | "list";

type Companion = {
  id: string;
  displayName: string;
  age: number;
  city: string;
  vibes: string[];
  languages: string[];
  availability: Availability;
  isPrismExclusive: boolean;
  isTopRated: boolean;
  isFastReply: boolean;
  isConciergeFavorite: boolean;
  responseTimeMinutes: number | null;
  meetupCount: number | null;
  rating: number | null;
  verified: boolean;
  primaryPhotoUrl: string | null;
};

type DirectoryResponse = {
  companions: Companion[];
  viewer: { authenticated: boolean; plan: "standard" | "prism" };
  error?: string;
};

const cityOptions = ["All cities", "Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Pune", "Goa", "Chennai", "Kolkata"];
const vibeOptions = ["All vibes", "Gentleman", "Athlete", "Party Starter", "Silent Type", "Traveller", "Wingman"];
const availabilityOptions: Array<[string, Availability | "all"]> = [["Any time", "all"], ["Available now", "available_now"], ["This week", "this_week"]];
const languageOptions = ["All languages", "English", "Hindi", "Hinglish", "Marathi", "Tamil", "Telugu", "Bengali"];
const ageRanges = [
  ["Any age", 18, 100],
  ["18–24", 18, 24],
  ["25–29", 25, 29],
  ["30–34", 30, 34],
  ["35–40", 35, 40],
  ["40+", 40, 100],
] as const;

function availabilityLabel(value: Availability) {
  if (value === "available_now") return "Available now";
  if (value === "this_week") return "This week";
  return "Currently unavailable";
}

function artClass(id: string) {
  const palettes = [
    "from-fuchsia-500/45 via-violet-950 to-cyan-400/30",
    "from-cyan-400/30 via-[#151022] to-fuchsia-500/35",
    "from-amber-200/20 via-fuchsia-700/40 to-cyan-300/25",
    "from-violet-500/40 via-[#161024] to-cyan-300/30",
    "from-cyan-300/35 via-violet-950 to-amber-200/25",
  ];
  const total = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  return palettes[total % palettes.length];
}

function CompanionArt({ companion, blurred, compact = false }: { companion: Companion; blurred: boolean; compact?: boolean }) {
  const hiddenAlt = "Profile photo hidden — verify or upgrade to view";
  return <div className={cn("relative isolate overflow-hidden bg-gradient-to-br", compact ? "aspect-square" : "aspect-[1.08]", artClass(companion.id))}>
    {companion.primaryPhotoUrl ? <img src={companion.primaryPhotoUrl} alt={blurred ? hiddenAlt : `${companion.displayName}'s verified profile photo`} className={cn("absolute inset-0 h-full w-full object-cover transition duration-500", blurred && "scale-110 blur-xl")} /> : <>
      <div className={cn("absolute inset-x-[28%] top-[12%] h-[66%] rounded-[45%] border border-white/25 bg-white/10", blurred ? "scale-110 blur-xl" : "blur-[1px]")} />
      <div className={cn("absolute -right-8 top-5 h-32 w-32 rounded-full border-[15px] border-cyan-100/15", blurred && "blur-lg")} />
      <div className={cn("absolute -bottom-12 -left-8 h-36 w-36 rounded-full border-[18px] border-fuchsia-100/10", blurred && "blur-lg")} />
      <span className="sr-only">{blurred ? hiddenAlt : "Abstract companion profile artwork"}</span>
    </>}
    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#100a1c]/90 to-transparent" />
    {blurred && <div className="absolute inset-0 grid place-items-center bg-[#0d0918]/15"><span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/45 text-white shadow-xl backdrop-blur"><LockKeyhole size={17} /></span></div>}
  </div>;
}

function DirectorySkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => <article key={index} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#151022]">
      <div className="directory-skeleton aspect-[1.08]" />
      <div className="space-y-3 p-5"><div className="directory-skeleton h-7 w-2/3 rounded-lg" /><div className="directory-skeleton h-4 w-1/3 rounded-lg" /><div className="directory-skeleton h-4 w-4/5 rounded-lg" /><div className="directory-skeleton h-10 w-full rounded-full" /></div>
    </article>)}
  </div>;
}

function MiniPreview({ index, locked }: { index: number; locked?: boolean }) {
  return <div className={cn("relative aspect-[.9] overflow-hidden rounded-xl border", locked ? "border-white/10" : "border-amber-100/40", `bg-gradient-to-br ${artClass(`preview-${index}`)}`)}>
    <div className={cn("absolute inset-x-[28%] top-[13%] h-[65%] rounded-[45%] border border-white/25 bg-white/10", locked && "scale-110 blur-md")} />
    {locked ? <span className="absolute inset-0 grid place-items-center bg-[#0d0918]/25"><LockKeyhole size={15} className="text-white/80" /></span> : <span className="absolute right-0 top-0 rounded-bl-lg bg-amber-100 px-2 py-1 text-[8px] font-black tracking-[.14em] text-mauve-950">PRISM</span>}
  </div>;
}

function PrismBanner({ onDismiss }: { onDismiss: () => void }) {
  return <section className="relative overflow-hidden rounded-[1.8rem] border border-amber-100/25 bg-[radial-gradient(circle_at_12%_15%,rgba(251,191,36,.16),transparent_34%),radial-gradient(circle_at_92%_85%,rgba(34,211,238,.14),transparent_34%),#181021] p-5 shadow-2xl shadow-black/10 sm:p-7">
    <button type="button" onClick={onDismiss} aria-label="Dismiss PRISM preview" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/20 text-violet-100/70 transition hover:bg-white/10 hover:text-white"><X size={15} /></button>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
      <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-amber-100"><Crown size={14} /> PRISM PREMIUM</p><h2 className="mt-3 max-w-2xl font-serif text-3xl tracking-[-.045em] sm:text-4xl">You&apos;re seeing the standard view. PRISM sees everything.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-violet-100/75">Unblurred photos, exclusive top-tier companions, priority replies, and concierge booking. This is what the top profiles actually look like:</p><Link href="/membership" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-amber-100"><Crown size={16} /> Unlock PRISM · See What Changes <ArrowRight size={15} /></Link></div>
      <div className="grid grid-cols-6 gap-2" aria-label="PRISM visibility comparison">
        {[0, 1, 2].map((index) => <MiniPreview key={`open-${index}`} index={index} />)}
        {[3, 4, 5].map((index) => <MiniPreview key={`locked-${index}`} index={index} locked />)}
      </div>
    </div>
  </section>;
}

function TopTierCallout() {
  const features = [
    ["Groomed & photographed", "Professional photos, not selfies."],
    ["Fast replies", "Under 15-minute average response time."],
    ["5-star etiquette", "Trained in conversation, dress code, and discretion."],
    ["Concierge-booked", "We help arrange details with care."],
  ];
  return <section className="col-span-full overflow-hidden rounded-[1.8rem] border border-amber-100/20 bg-[radial-gradient(circle_at_92%_14%,rgba(251,191,36,.12),transparent_35%),#151022] p-6 sm:p-8">
    <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-amber-100"><Crown size={14} /> PRISM ACCESS</p><h2 className="mt-3 font-serif text-3xl tracking-[-.045em] sm:text-4xl">This is what a top-tier companion brings.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-violet-100/70">PRISM&apos;s highest-rated companions aren&apos;t just verified, they&apos;re vetted for presence, conversation, and reliability.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{features.map(([title, copy]) => <div key={title} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><Star size={15} className="text-amber-100" /><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-violet-100/60">{copy}</p></div>)}</div><Link href="/membership" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-100 transition hover:text-white">See Full PRISM Roster <ArrowRight size={15} /></Link></div>
      <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((index) => <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-black/15"><MiniPreview index={index + 8} locked /><div className="p-3 text-[11px] leading-5 text-violet-100/65">★ 4.9 · Avg reply 8 min · 120+ meetups</div></div>)}</div>
    </div>
  </section>;
}

function CompanionCard({ companion, isPrismMember, viewMode, onOpen }: { companion: Companion; isPrismMember: boolean; viewMode: ViewMode; onOpen: (companion: Companion) => void }) {
  const locked = companion.isPrismExclusive && !isPrismMember;
  const blurred = !isPrismMember || locked;
  const tags = companion.vibes.slice(0, 2);
  const available = companion.availability === "available_now";

  return <article className={cn("group min-w-0 overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#151022] shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-cyan-200/35", viewMode === "list" && "sm:grid sm:grid-cols-[15rem_minmax(0,1fr)]") }>
    <div className={cn("relative", viewMode === "list" && "sm:h-full sm:min-h-[17rem]")}><CompanionArt companion={companion} blurred={blurred} />
      {companion.isPrismExclusive && <span className="absolute left-0 top-4 rounded-r-full bg-amber-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-mauve-950">PRISM Exclusive</span>}
      {available && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-100 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#86efac]" /> Available now</span>}
      {companion.verified && <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100/35 bg-[#100a1c]/75 text-cyan-100 backdrop-blur" aria-label="Verified companion"><BadgeCheck size={16} /></span>}
    </div>
    <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className={cn("font-serif text-3xl leading-none", locked && "blur-[5px]")}>{companion.displayName}, {companion.age}</h2><p className="mt-2 flex items-center gap-1 text-sm text-violet-100/65"><MapPin size={14} /> {companion.city}</p></div>{companion.verified && <BadgeCheck size={18} className="mt-1 shrink-0 text-cyan-100 sm:hidden" aria-label="Verified companion" />}</div>
      <div className="mt-4 flex flex-wrap gap-1.5">{tags.map((tag) => <span key={tag} className="rounded-full border border-white/12 bg-white/[.035] px-2.5 py-1 text-xs text-violet-100/70">{tag}</span>)}</div>
      {companion.isPrismExclusive ? <p className="mt-4 text-sm text-amber-100/80">{isPrismMember ? "Top-rated · private access included." : "Top-rated · only visible to PRISM members."}</p> : <p className="mt-4 text-sm text-violet-100/65">{availabilityLabel(companion.availability)} · Verified adult companion</p>}
      {locked ? <Link href="/membership" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-100 px-4 py-2.5 text-sm font-bold text-mauve-950 transition hover:bg-white"><LockKeyhole size={15} /> Unlock with PRISM</Link> : <button type="button" onClick={() => onOpen(companion)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-200 hover:text-mauve-950">{isPrismMember && companion.isPrismExclusive ? "Book via Concierge" : "View Profile"} <ArrowRight size={15} /></button>}
    </div>
  </article>;
}

function CompanionDialog({ companion, onClose }: { companion: Companion; onClose: () => void }) {
  if (!companion) return null;
  return <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[80] grid place-items-end bg-[#0d0918]/80 p-3 backdrop-blur-sm sm:place-items-center sm:p-5"><section role="dialog" aria-modal="true" aria-label={`${companion.displayName} profile`} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#151022] shadow-2xl shadow-black/50"><div className="relative"><CompanionArt companion={companion} blurred={false} /><button type="button" onClick={onClose} aria-label="Close profile" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-[#100a1c]/75 text-white backdrop-blur transition hover:bg-white hover:text-mauve-950"><X size={17} /></button></div><div className="p-6"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-100"><BadgeCheck size={14} /> Verified companion</p><h2 className="mt-3 font-serif text-4xl">{companion.displayName}, {companion.age}</h2><p className="mt-3 flex items-center gap-1 text-sm text-violet-100/70"><MapPin size={14} /> {companion.city}</p><div className="mt-5 flex flex-wrap gap-2">{companion.vibes.map((tag) => <span key={tag} className="rounded-full border border-white/12 bg-white/[.035] px-3 py-1.5 text-xs text-violet-100/75">{tag}</span>)}</div><p className="mt-5 text-sm leading-6 text-violet-100/70">Profile details are shared privately once a conversation begins. Keep every plan respectful, clear, and consent-first.</p><div className="mt-7 flex flex-wrap gap-3"><Link href={`/messages?companion=${encodeURIComponent(companion.id)}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100"><MessageCircle size={16} /> Start a conversation</Link><button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-200 hover:text-cyan-100">Continue browsing</button></div></div></section></div>;
}

export function BrowseCompanionsPage() {
  const { member } = useSessionMember();
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("All cities");
  const [vibe, setVibe] = useState("All vibes");
  const [ageRangeIndex, setAgeRangeIndex] = useState(0);
  const [availability, setAvailability] = useState<Availability | "all">("all");
  const [language, setLanguage] = useState("All languages");
  const [sort, setSort] = useState("recommended");
  const [prismOnly, setPrismOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [dismissedPrism, setDismissedPrism] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [selected, setSelected] = useState<Companion | null>(null);
  const filtersRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const requestedCity = new URLSearchParams(window.location.search).get("city");
    if (requestedCity && cityOptions.includes(requestedCity)) setCity(requestedCity);
    let active = true;
    fetch("/api/companions", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() as DirectoryResponse }))
      .then(({ data }) => { if (active) setDirectory(data); })
      .catch(() => { if (active) setDirectory({ companions: [], viewer: { authenticated: false, plan: "standard" }, error: "The companion directory is unavailable right now." }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!dismissedPrism) return;
    const restorePreview = () => { if (window.scrollY > 900) setDismissedPrism(false); };
    window.addEventListener("scroll", restorePreview, { passive: true });
    return () => window.removeEventListener("scroll", restorePreview);
  }, [dismissedPrism]);

  const isPrismMember = directory?.viewer.plan === "prism";
  const isStandardMember = !isPrismMember;
  const activeRange = ageRanges[ageRangeIndex];
  const activeFilterCount = [city !== "All cities", vibe !== "All vibes", ageRangeIndex !== 0, availability !== "all", language !== "All languages", prismOnly].filter(Boolean).length;
  const companions = directory?.companions ?? [];
  const filteredCompanions = useMemo(() => {
    const matches = companions.filter((companion) => {
      if (city !== "All cities" && companion.city !== city) return false;
      if (vibe !== "All vibes" && !companion.vibes.some((item) => item.toLowerCase() === vibe.toLowerCase())) return false;
      if (companion.age < activeRange[1] || companion.age > activeRange[2]) return false;
      if (availability !== "all" && companion.availability !== availability) return false;
      if (language !== "All languages" && !companion.languages.some((item) => item.toLowerCase() === language.toLowerCase())) return false;
      if (prismOnly && !companion.isPrismExclusive) return false;
      return true;
    });
    return [...matches].sort((left, right) => {
      if (sort === "popular") return Number(right.isTopRated) - Number(left.isTopRated) || Number(right.rating ?? 0) - Number(left.rating ?? 0);
      if (sort === "newest") return left.displayName.localeCompare(right.displayName);
      return Number(right.availability === "available_now") - Number(left.availability === "available_now") || Number(right.isTopRated) - Number(left.isTopRated);
    });
  }, [activeRange, availability, city, companions, language, prismOnly, sort, vibe]);
  const displayedCompanions = filteredCompanions.slice(0, visibleCount);

  const clearFilters = () => {
    setCity("All cities"); setVibe("All vibes"); setAgeRangeIndex(0); setAvailability("all"); setLanguage("All languages"); setSort("recommended"); setPrismOnly(false); setVisibleCount(12);
  };
  const setFilterCity = (nextCity: string) => { setCity(nextCity); setVisibleCount(12); };
  const showFilters = () => filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <main className="min-h-screen overflow-hidden bg-[#0d0918] text-white">
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(208,201,213,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.05)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="absolute -left-40 top-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-[150px]" /><div className="absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-[160px]" /></div>
    <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8"><Link href="/" className="flex shrink-0 items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-cyan-100"><Sparkles size={18} /></span><span><span className="brand-wordmark block text-[10px] font-bold uppercase tracking-[.24em]">GIGOLO INDIA</span><span className="mt-0.5 block font-serif text-lg tracking-[.1em]">BROWSE</span></span></Link><div className="hidden items-center gap-5 text-sm text-violet-100/70 lg:flex"><Link href="/browse" className="text-cyan-100">Browse</Link><Link href="/messages" className="transition hover:text-cyan-100">Messages</Link><Link href="/membership" className="transition hover:text-cyan-100">Membership</Link></div><div className="flex items-center gap-2"><LanguageSwitcher /><MemberMenu member={member} /></div></nav>

    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-8 pt-7 lg:px-8 lg:pb-10 lg:pt-12"><nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-violet-100/60"><Link href="/" className="transition hover:text-cyan-100">Home</Link><span aria-hidden>/</span><span className="text-violet-100/85">Browse</span></nav><div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-100">VERIFIED DIRECTORY</p><h1 className="mt-3 font-serif text-5xl tracking-[-.065em] sm:text-6xl">Companions in <span className="bg-gradient-to-r from-fuchsia-200 via-amber-100 to-cyan-200 bg-clip-text text-transparent">{city === "All cities" ? "India" : city}</span></h1><p className="mt-4 text-base text-violet-100/70">{filteredCompanions.length} verified companions · {filteredCompanions.filter((companion) => companion.availability === "available_now").length} available now</p></div><div className="flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor="directory-city">Choose a city</label><div className="relative"><MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100" /><select id="directory-city" value={city} onChange={(event) => setFilterCity(event.target.value)} className="appearance-none rounded-full border border-white/15 bg-[#151022] py-2.5 pl-9 pr-9 text-sm font-semibold text-white outline-none transition focus:border-cyan-200"><option>All cities</option>{cityOptions.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-violet-100/60" /></div><div className="inline-flex rounded-full border border-white/15 bg-[#151022] p-1" aria-label="Choose page view"><button type="button" onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"} className={cn("grid h-9 w-9 place-items-center rounded-full transition", viewMode === "grid" ? "bg-cyan-200 text-mauve-950" : "text-violet-100/70 hover:text-white")} title="Grid view"><Grid2X2 size={16} /></button><button type="button" onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"} className={cn("grid h-9 w-9 place-items-center rounded-full transition", viewMode === "list" ? "bg-cyan-200 text-mauve-950" : "text-violet-100/70 hover:text-white")} title="List view"><List size={16} /></button></div></div></div></section>

    <section ref={filtersRef} aria-label="Companion directory filters" className="sticky top-0 z-30 border-y border-white/10 bg-[#0d0918]/95 px-5 py-3 backdrop-blur-xl lg:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5"><div className="mr-1 flex items-center gap-2 text-sm font-bold text-cyan-100"><Filter size={16} /> Filters {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-200 px-1 text-xs leading-none text-mauve-950">{activeFilterCount}</span>}</div><label className="sr-only" htmlFor="filter-vibe">Filter by vibe</label><select id="filter-vibe" value={vibe} onChange={(event) => { setVibe(event.target.value); setVisibleCount(12); }} className="rounded-full border border-white/15 bg-[#151022] px-3 py-2 text-sm text-violet-100 outline-none focus:border-cyan-200">{vibeOptions.map((item) => <option key={item}>{item}</option>)}</select><label className="sr-only" htmlFor="filter-age">Filter by age</label><select id="filter-age" value={ageRangeIndex} onChange={(event) => { setAgeRangeIndex(Number(event.target.value)); setVisibleCount(12); }} className="rounded-full border border-white/15 bg-[#151022] px-3 py-2 text-sm text-violet-100 outline-none focus:border-cyan-200">{ageRanges.map(([label], index) => <option key={label} value={index}>{label}</option>)}</select><label className="sr-only" htmlFor="filter-availability">Filter by availability</label><select id="filter-availability" value={availability} onChange={(event) => { setAvailability(event.target.value as Availability | "all"); setVisibleCount(12); }} className="rounded-full border border-white/15 bg-[#151022] px-3 py-2 text-sm text-violet-100 outline-none focus:border-cyan-200">{availabilityOptions.map(([label, value]) => <option key={value} value={value}>{label}</option>)}</select><label className="sr-only" htmlFor="filter-language">Filter by language</label><select id="filter-language" value={language} onChange={(event) => { setLanguage(event.target.value); setVisibleCount(12); }} className="rounded-full border border-white/15 bg-[#151022] px-3 py-2 text-sm text-violet-100 outline-none focus:border-cyan-200">{languageOptions.map((item) => <option key={item}>{item}</option>)}</select><label className="sr-only" htmlFor="filter-sort">Sort companions</label><select id="filter-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full border border-white/15 bg-[#151022] px-3 py-2 text-sm text-violet-100 outline-none focus:border-cyan-200"><option value="recommended">Recommended</option><option value="newest">Newest</option><option value="popular">Most popular</option></select><button type="button" onClick={() => { if (isPrismMember) { setPrismOnly((value) => !value); setVisibleCount(12); } }} aria-pressed={prismOnly} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition", prismOnly ? "border-amber-100 bg-amber-100 text-mauve-950" : "border-amber-100/30 bg-amber-100/[.06] text-amber-100", !isPrismMember && "cursor-pointer")} title={isPrismMember ? "Show PRISM-exclusive companions" : "PRISM unlocks exclusive companions"}><Sparkles size={14} /> PRISM Only</button>{activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="ml-auto text-sm font-semibold text-violet-100/65 underline-offset-4 transition hover:text-cyan-100 hover:underline">Clear filters</button>}</div></section>

    <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><div className="space-y-7">{isStandardMember && !dismissedPrism && <PrismBanner onDismiss={() => setDismissedPrism(true)} />}
      {loading ? <><DirectorySkeleton /><p className="text-center text-sm text-violet-100/65">Finding your match…</p></> : filteredCompanions.length === 0 ? <section className="grid min-h-[28rem] place-items-center rounded-[2rem] border border-white/12 bg-[#151022]/80 p-7 text-center"><div className="max-w-md"><div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] border border-cyan-200/25 bg-cyan-200/10 text-cyan-100"><SearchX size={32} /></div><h2 className="mt-7 font-serif text-4xl tracking-[-.05em]">No one matches yet.</h2><p className="mt-4 text-base leading-7 text-violet-100/70">{directory?.error ?? "Try a different vibe, widen your age range, or check another city."}</p><button type="button" onClick={clearFilters} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-cyan-100"><ArrowLeft size={15} /> Clear Filters</button></div></section> : <><div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", viewMode === "list" && "xl:grid-cols-1")}>{displayedCompanions.map((companion, index) => <Fragment key={companion.id}><CompanionCard companion={companion} isPrismMember={Boolean(isPrismMember)} viewMode={viewMode} onOpen={setSelected} />{isStandardMember && index === 11 && <TopTierCallout />}</Fragment>)}</div>{displayedCompanions.length < filteredCompanions.length && <div className="pt-2 text-center"><button type="button" onClick={() => setVisibleCount((value) => value + 12)} className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-200 hover:text-mauve-950">Load more companions <ArrowRight size={15} /></button><p className="mt-3 text-sm text-violet-100/60">Finding your match…</p></div>}</>}</div></section>

    {isStandardMember && <section className="relative z-10 border-y border-amber-100/15 bg-[#151022]/90 px-5 py-14 lg:px-8 lg:py-20"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] border border-amber-100/25 bg-[radial-gradient(circle_at_12%_15%,rgba(251,191,36,.15),transparent_35%),radial-gradient(circle_at_88%_80%,rgba(34,211,238,.13),transparent_35%),#181021] p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-amber-100"><Crown size={14} /> PRISM PREMIUM</p><h2 className="mt-3 font-serif text-4xl tracking-[-.055em] sm:text-5xl">Still scrolling blurred? PRISM removes the blur.</h2><p className="mt-5 text-base leading-7 text-violet-100/75">Unlock every profile, book the top-rated companions, and let concierge handle the rest.</p></div><div className="shrink-0"><Link href="/membership" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950 transition hover:bg-amber-100"><Crown size={16} /> Upgrade to PRISM</Link><p className="mt-3 text-sm text-violet-100/55">Cancel anytime. Discreet billing.</p></div></div></section>}
    <SiteFooter />
    {selected && <CompanionDialog companion={selected} onClose={() => setSelected(null)} />}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d0918]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-lg gap-3"><button type="button" onClick={showFilters} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/18 bg-white/[.04] px-4 py-3 text-sm font-bold text-white"><Filter size={16} /> Filter {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1 text-xs leading-none">{activeFilterCount}</span>}</button>{isStandardMember ? <Link href="/membership" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-100 via-[#f3cf85] to-cyan-100 px-4 py-3 text-sm font-bold text-mauve-950"><Crown size={16} /> Upgrade PRISM</Link> : <Link href="/messages" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cyan-200 px-4 py-3 text-sm font-bold text-mauve-950"><MessageCircle size={16} /> Messages</Link>}</div></div>
  </main>;
}
