"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Option = { label: string; value: string };

export function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value)?.label ?? value;

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  return <div className="relative" ref={container}>
    <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="listbox" className={`inline-flex h-10 min-w-[8.5rem] items-center justify-between gap-3 rounded-xl border px-3 text-sm font-medium transition ${open ? "border-cyan-200 bg-cyan-200/10 text-cyan-100 shadow-[0_0_0_3px_rgba(103,232,249,.08)]" : "border-white/12 bg-[#171124] text-violet-100 hover:border-cyan-200/45 hover:bg-white/[.06]"}`}><span className="truncate">{selected}</span><ChevronDown size={15} className={`shrink-0 transition ${open ? "rotate-180" : ""}`} /></button>
    {open && <div role="listbox" aria-label={label} className="absolute left-0 top-[calc(100%+.5rem)] z-[70] min-w-full overflow-hidden rounded-xl border border-cyan-100/20 bg-[#171124] p-1.5 shadow-2xl shadow-black/50"><p className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-violet-100/45">{label}</p>{options.map((option) => <button key={option.value} role="option" aria-selected={option.value === value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full items-center justify-between gap-4 rounded-lg px-2.5 py-2.5 text-left text-sm transition ${option.value === value ? "bg-cyan-200 text-mauve-950" : "text-violet-100/80 hover:bg-white/[.07] hover:text-white"}`}><span>{option.label}</span>{option.value === value && <Check size={15} />}</button>)}</div>}
  </div>;
}
