"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Sparkles, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const classroomActivity = [
  { label: "Gigolo Kit · Mumbai", kind: "kit" as const },
  { label: "New member · Delhi", kind: "join" as const },
  { label: "Gigolo Kit · Bengaluru", kind: "kit" as const },
  { label: "New member · Goa", kind: "join" as const },
];
type Toast = { id: number; heading: string; label: string; kind: "kit" | "join" | "live" };

export function GlobalActivityToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const activityIndex = useRef(0);
  const latestEvent = useRef(0);
  const initialised = useRef(false);
  const toastId = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts((current) => [{ ...toast, id }, ...current].slice(0, 3));
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 6000);
  }, []);

  useEffect(() => {
    const showClassroomActivity = () => {
      const activity = classroomActivity[activityIndex.current];
      addToast({ heading: "Classroom activity simulation", label: activity.label, kind: activity.kind });
      activityIndex.current = (activityIndex.current + 1) % classroomActivity.length;
    };
    const timer = window.setInterval(showClassroomActivity, 15000);
    return () => window.clearInterval(timer);
  }, [addToast]);

  useEffect(() => {
    let active = true;
    async function pollForLiveSignups() {
      try {
        const response = await fetch(`/api/activity?after=${latestEvent.current}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { events: Array<{ id: number }> };
        if (!active) return;
        if (data.events.length === 0) { initialised.current = true; return; }
        latestEvent.current = data.events[data.events.length - 1].id;
        if (initialised.current) addToast({ heading: "Live project update", label: "New private member joined", kind: "live" });
        initialised.current = true;
      } catch { /* The visual POC remains usable if its local activity route is unavailable. */ }
    }
    void pollForLiveSignups();
    const timer = window.setInterval(() => void pollForLiveSignups(), 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [addToast]);

  return <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:right-5 sm:top-5">
    <AnimatePresence initial={false} mode="popLayout">
      {toasts.map((toast) => <motion.div layout key={toast.id} initial={{ opacity: 0, x: 36, scale: .82 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 26, scale: .88 }} transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }} className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border border-mauve-700 bg-mauve-900/95 py-1.5 pl-2 pr-2.5 text-mauve-50 shadow-xl shadow-mauve-950/35 backdrop-blur-xl">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${toast.kind === "live" ? "bg-cyan-200 text-mauve-900" : toast.kind === "join" ? "bg-gradient-to-br from-cyan-200 to-fuchsia-200 text-mauve-900" : "bg-gradient-to-br from-fuchsia-300 to-amber-200 text-mauve-900"}`}>{toast.kind === "live" ? <Sparkles size={14}/> : toast.kind === "join" ? <UserPlus size={14}/> : <ShoppingBag size={14}/>}</span>
        <span className="min-w-0 pr-1"><span className="block truncate text-[9px] font-semibold uppercase tracking-[.13em] text-mauve-400">{toast.heading}</span><span className="block truncate text-xs font-semibold">{toast.label}</span></span>
        <button onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label={`Dismiss ${toast.label}`} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-mauve-400 transition hover:bg-mauve-800 hover:text-mauve-50"><X size={13}/></button>
      </motion.div>)}
    </AnimatePresence>
  </div>;
}
