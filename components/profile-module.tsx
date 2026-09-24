"use client";

import { LocalizedLink as Link, useLocalizedRouter } from "@/components/localization-provider";
import { Check, ChevronLeft, Copy, ImagePlus, LoaderCircle, LockKeyhole, Mail, MapPin, Save, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { MemberMenu, type SessionMember } from "@/components/member-menu";

type Profile = SessionMember & {
  username: string;
  legalName: string;
  contact: string;
  bio: string;
  profileVisibility: "private" | "members";
  emailUpdates: boolean;
  createdAt: string;
};

function memberCode(id: number) {
  return `PRISM-XXXX-${String(id).padStart(3, "0").slice(-3)}`;
}

export function ProfileModule() {
  const router = useLocalizedRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", city: "", bio: "", profileVisibility: "private" as Profile["profileVisibility"], emailUpdates: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, status: response.status, data: await response.json() as { profile?: Profile; error?: string } }))
      .then(({ ok, status, data }) => {
        if (!active) return;
        if (status === 401) {
          router.replace("/login");
          return;
        }
        if (!ok || !data.profile) throw new Error(data.error ?? "We could not load your profile.");
        setProfile(data.profile);
        setForm({ name: data.profile.name, city: data.profile.city, bio: data.profile.bio, profileVisibility: data.profile.profileVisibility, emailUpdates: data.profile.emailUpdates });
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "We could not load your profile."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json() as { profile?: Profile; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error ?? "We could not save your profile.");
      setProfile(data.profile);
      setForm({ name: data.profile.name, city: data.profile.city, bio: data.profile.bio, profileVisibility: data.profile.profileVisibility, emailUpdates: data.profile.emailUpdates });
      setNotice("Your profile has been saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const savePhotos = async (retained: string[], additions: File[] = []) => {
    if (!profile) return;
    setSavingPhotos(true);
    setNotice("");
    setError("");
    try {
      const request = new FormData();
      request.append("retainedImages", JSON.stringify(retained));
      additions.forEach((image) => request.append("images", image));
      const response = await fetch("/api/profile/images", { method: "POST", body: request });
      const data = await response.json() as { profileImages?: string[]; error?: string };
      if (!response.ok || !data.profileImages) throw new Error(data.error ?? "We could not update your photos.");
      setProfile((current) => current ? { ...current, profileImages: data.profileImages ?? current.profileImages } : current);
      setNotice("Your profile photos have been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not update your photos.");
    } finally {
      setSavingPhotos(false);
    }
  };

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const additions = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    if (!profile || additions.length === 0) return;
    if (profile.profileImages.length + additions.length > 5) {
      setError("You can keep a maximum of 5 profile photos.");
      return;
    }
    void savePhotos(profile.profileImages, additions);
  };

  const removePhoto = (image: string) => {
    if (!profile || profile.profileImages.length <= 3) {
      setError("Keep at least 3 profile photos.");
      return;
    }
    void savePhotos(profile.profileImages.filter((current) => current !== image));
  };

  const copyMemberId = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(memberCode(profile.id));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("We could not copy your member ID.");
    }
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><LoaderCircle className="animate-spin" aria-label="Loading profile" /></main>;
  if (!profile) return <main className="grid min-h-screen place-items-center bg-[#0d0918] px-5 text-center text-white"><div><p className="font-serif text-3xl">Your profile is unavailable.</p><p className="mt-3 text-sm text-violet-100/65">{error || "Please return home and try again."}</p><Link href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-mauve-950">Return home</Link></div></main>;

  const firstName = profile.username;
  const completeFields = [profile.name, profile.city, profile.bio, ...profile.profileImages].filter(Boolean).length;
  const completion = Math.min(100, Math.round((completeFields / 8) * 100));

  return (
    <main className="min-h-screen bg-[#0d0918] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[150px]" /><div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-[150px]" /></div>
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-cyan-100"><ShieldCheck size={18} /></span><span><span className="brand-wordmark block text-[10px] font-bold uppercase tracking-[.24em]">GIGOLO INDIA</span><span className="mt-0.5 block font-serif text-lg tracking-[.1em]">PRISM</span></span></Link><MemberMenu member={{ ...profile, name: profile.username }} /></nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-9 lg:px-8 lg:pt-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-violet-100/65 transition hover:text-cyan-100"><ChevronLeft size={16} /> Back to PRISM</Link>
        <div className="mt-7 grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
          <aside className="rounded-[2rem] border border-white/12 bg-[#151022]/85 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100">MEMBER PROFILE</p><h1 className="mt-3 font-serif text-4xl tracking-[-.05em]">Hello, {firstName}.</h1></div><span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-100"><UserRound size={19} /></span></div>
            <div className="mt-7 grid grid-cols-3 gap-2">{profile.profileImages.slice(0, 3).map((image, index) => <img key={image} src={image} alt={`Profile photo ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />)}</div>
            <div className="mt-7 border-y border-white/10 py-5"><div className="flex items-center justify-between text-xs"><span className="text-violet-100/60">Profile completion</span><strong className="text-cyan-100">{completion}%</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 to-cyan-200" style={{ width: `${completion}%` }} /></div></div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-violet-100/50">MEMBER ID</p><div className="mt-2 flex items-center justify-between gap-3"><span className="font-mono text-sm font-semibold tracking-[.12em] text-cyan-100">{memberCode(profile.id)}</span><button type="button" onClick={copyMemberId} aria-label="Copy member ID" className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-violet-100/70 transition hover:border-cyan-200 hover:text-cyan-100">{copied ? <Check size={15} className="text-emerald-300" /> : <Copy size={15} />}</button></div></div>
            <div className="mt-5 flex items-center gap-2 text-sm text-violet-100/65"><MapPin size={15} className="text-cyan-100" /> {profile.city}</div><div className="mt-3 flex items-center gap-2 text-sm text-violet-100/65"><Mail size={15} className="text-cyan-100" /> {profile.contact}</div>
          </aside>

          <form onSubmit={saveProfile} className="rounded-[2rem] border border-white/12 bg-[#151022]/85 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100">YOUR DETAILS</p><h2 className="mt-2 font-serif text-3xl tracking-[-.045em]">Keep your profile current.</h2><p className="mt-2 text-sm text-violet-100/65">Your contact email is protected and cannot be changed here.</p></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-cyan-100"><ShieldCheck size={12} /> Verified member</span></div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Display name<input required maxLength={80} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none transition focus:border-cyan-200" /></label><label className="text-sm font-semibold">City<input required maxLength={80} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-white/[.035] px-4 text-sm font-normal outline-none transition focus:border-cyan-200" /></label></div>
            <label className="mt-5 block text-sm font-semibold">About you<textarea maxLength={500} rows={5} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className="mt-2 w-full resize-y rounded-xl border border-white/12 bg-white/[.035] px-4 py-3 text-sm font-normal leading-6 outline-none transition focus:border-cyan-200" /></label><p className="mt-2 text-right text-xs text-violet-100/50">{form.bio.length}/500</p>
            <section className="mt-7 border-t border-white/10 pt-7"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Privacy preference</p><p className="mt-1 text-xs text-violet-100/60">Choose how your profile is presented within PRISM.</p></div><div className="mt-3 flex rounded-xl border border-white/10 bg-white/[.035] p-1 sm:mt-0"><button type="button" onClick={() => setForm((current) => ({ ...current, profileVisibility: "private" }))} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${form.profileVisibility === "private" ? "bg-cyan-200 text-mauve-950" : "text-violet-100/65"}`}>Private</button><button type="button" onClick={() => setForm((current) => ({ ...current, profileVisibility: "members" }))} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${form.profileVisibility === "members" ? "bg-cyan-200 text-mauve-950" : "text-violet-100/65"}`}>Members</button></div></div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4"><input type="checkbox" checked={form.emailUpdates} onChange={(event) => setForm((current) => ({ ...current, emailUpdates: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-cyan-200" /><span><span className="block text-sm font-semibold">Account updates by email</span><span className="mt-1 block text-xs leading-5 text-violet-100/60">Receive important updates about your membership, privacy, and Kit.</span></span></label></section>
            {(notice || error) && <p role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm ${error ? "border border-rose-300/30 bg-rose-400/10 text-rose-100" : "border border-cyan-200/25 bg-cyan-200/10 text-cyan-100"}`}>{error || notice}</p>}
            <button disabled={saving} type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200 px-5 py-3.5 text-sm font-bold text-mauve-950 transition hover:brightness-110 disabled:opacity-60">{saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}{saving ? "Saving…" : "Save profile"}</button>
          </form>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/12 bg-[#151022]/85 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"><div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100">PROFILE PHOTOS</p><h2 className="mt-2 font-serif text-3xl tracking-[-.045em]">Your visual profile.</h2><p className="mt-2 text-sm text-violet-100/65">Keep 3 to 5 clear JPG, PNG, or WebP images. Each image can be up to 5 MB.</p></div><label className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold transition ${savingPhotos || profile.profileImages.length >= 5 ? "cursor-not-allowed border-white/10 text-violet-100/35" : "border-cyan-200/35 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200 hover:text-mauve-950"}`}><ImagePlus size={16} /> Add photos<input disabled={savingPhotos || profile.profileImages.length >= 5} onChange={addPhotos} accept="image/jpeg,image/png,image/webp" multiple type="file" className="sr-only" /></label></div>
          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">{profile.profileImages.map((image, index) => <article key={image} className="group relative aspect-[.82] overflow-hidden rounded-2xl border border-white/10 bg-white/[.035]"><img src={image} alt={`Profile photo ${index + 1}`} className="h-full w-full object-cover" /><span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">{String(index + 1).padStart(2, "0")}</span><button type="button" disabled={savingPhotos || profile.profileImages.length <= 3} onClick={() => removePhoto(image)} aria-label={`Remove profile photo ${index + 1}`} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white opacity-100 backdrop-blur transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={15} /></button></article>)}</div>
          {savingPhotos && <p className="mt-5 flex items-center gap-2 text-sm text-cyan-100"><LoaderCircle size={15} className="animate-spin" /> Updating profile photos…</p>}
          <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-xs leading-5 text-violet-100/60"><LockKeyhole size={14} className="shrink-0 text-cyan-100" /> Your photos remain part of your private member profile.</div>
        </section>
      </section>
    </main>
  );
}
