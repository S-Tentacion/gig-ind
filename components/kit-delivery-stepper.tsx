"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Box, Check, CheckCircle2, Circle, MapPin, PackageCheck, ShieldCheck, Truck } from "lucide-react";

const steps = [
  { title: "Order Placed", detail: "Payment and order details have been confirmed.", Icon: PackageCheck },
  { title: "Packed", detail: "Your Kit is prepared and ready for dispatch.", Icon: Box },
  { title: "Shipped / Out for Delivery", detail: "The courier or local driver picks up the package.", Icon: Truck },
  { title: "Delivered", detail: "The package reaches the selected destination.", Icon: CheckCircle2 },
];

export function KitDeliveryStepper({ city }: { city: string }) {
  const reduceMotion = useReducedMotion();
  const activeStep = 0;

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-10 lg:px-8 lg:pb-14">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#151022]/85 shadow-[0_24px_80px_rgba(0,0,0,.22)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100">Order tracking</p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-.045em]">Your Kit is being prepared.</h2>
            <p className="mt-2 text-xs text-violet-100/60">Follow each delivery milestone in one place.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-cyan-100"><MapPin size={12}/> {city}</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-violet-100/65"><ShieldCheck size={12}/> Payment confirmed</span></div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-cyan-200/25 bg-cyan-200/[.07] p-4 sm:max-w-[20rem]">
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-200 text-mauve-950"><Check size={18}/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-100">Current status</p><p className="mt-1 text-base font-semibold">Order placed</p><p className="mt-1 text-xs leading-5 text-violet-100/65">Payment verified and your order is recorded.</p></div></div><div className="mt-4 flex items-center justify-between border-t border-cyan-200/15 pt-3"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-violet-100/45">Next update</span><span className="text-xs font-semibold text-violet-100">Packing your Kit</span></div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <div className="relative hidden lg:block"><div className="absolute left-[7%] right-[7%] top-[1.3rem] h-px bg-white/12"/><motion.div initial={{ scaleX: 0 }} animate={{ scaleX: .14 }} transition={{ duration: reduceMotion ? 0 : .65, ease: "easeOut" }} className="absolute left-[7%] top-[1.3rem] h-px origin-left bg-cyan-200"/><div className="relative grid grid-cols-4 gap-7">{steps.map(({ title, detail, Icon }, index) => { const current = index === activeStep; return <article key={title} className="relative flex min-w-0 flex-col"><span className={`grid h-11 w-11 place-items-center rounded-full border ${current ? "border-cyan-200 bg-[#171024] text-cyan-100 shadow-[0_0_0_5px_rgba(103,232,249,.08),0_0_24px_rgba(103,232,249,.2)]" : "border-white/15 bg-[#171024] text-violet-100/45"}`}>{current ? <PackageCheck size={17}/> : <Icon size={17}/>}</span><p className={`mt-4 text-[10px] font-bold uppercase tracking-[.14em] ${current ? "text-cyan-100" : "text-violet-100/40"}`}>Step {index + 1}</p><h3 className={`mt-1 text-base font-semibold leading-5 ${current ? "text-white" : "text-violet-100/75"}`}>{title}</h3><p className="mt-2 max-w-[12rem] text-xs leading-5 text-violet-100/55">{detail}</p></article>; })}</div></div>
          <div className="space-y-3 lg:hidden">{steps.map(({ title, detail, Icon }, index) => { const current = index === activeStep; return <article key={title} className={`flex items-start gap-3 rounded-2xl border p-4 ${current ? "border-cyan-200/35 bg-cyan-200/[.07]" : "border-white/10 bg-white/[.025]"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${current ? "border-cyan-200 text-cyan-100" : "border-white/15 text-violet-100/45"}`}>{current ? <PackageCheck size={16}/> : <Icon size={16}/>}</span><div><p className={`text-[10px] font-bold uppercase tracking-[.14em] ${current ? "text-cyan-100" : "text-violet-100/40"}`}>Step {index + 1}</p><h3 className="mt-1 text-base font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-violet-100/60">{detail}</p></div>{current ? <Circle size={8} className="ml-auto mt-2 fill-cyan-200 text-cyan-200"/> : null}</article>; })}</div>
        </div>
      </div>
    </section>
  );
}
