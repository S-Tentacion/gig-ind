"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Message = { role: "assistant" | "user"; text: string };

function getAnswer(question: string, isMember: boolean) {
  const text = question.toLowerCase();
  if (isMember && text.includes("kit")) return "You can follow each Kit milestone in Order Tracking. If you need an update, Contact Support is available there too.";
  if (isMember && text.includes("boost")) return "Each Boost credit activates one hour of PRISM Boost. You can purchase credits or start a saved credit from your PRISM space.";
  if (text.includes("booking") || text.includes("book")) return "Message a companion, agree on the plan and boundaries, then confirm through the platform.";
  if (isMember && (text.includes("support") || text.includes("help"))) return "Contact Support is available from your member menu or the Order Tracking section.";
  if (text.includes("join") || text.includes("access")) return "Request access with your basic details and age verification. Every application is reviewed before member access is confirmed.";
  if (text.includes("verify")) return "Verification includes ID checks, photo matching, and a manual review. Profiles are visible only after a member is verified.";
  if (text.includes("privacy") || text.includes("data")) return "Your privacy comes first. You may use an alias, messaging is private, and your data is never sold.";
  if (text.includes("safe") || text.includes("tip")) return "For a first meeting, choose a public or trusted venue, share your plans with someone you trust, and keep boundaries clear and mutual.";
  return isMember ? "I can help with your plans, privacy, or your account. What would you like to know?" : "I can help with membership, verification, privacy, or how meetings work. What would you like to know?";
}

export function GigoloGuide() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);
  const [isPrismMember, setIsPrismMember] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi, I'm your PRISM guide. Ask me about membership, verification, privacy, or how meetings work." },
  ]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { member: null })
      .then((data: { member?: { name?: string; kitPurchased?: boolean } | null }) => {
        const name = data.member?.name?.trim();
        if (!active || !name) return;
        const memberFirstName = name.split(/\s+/)[0] || name;
        setFirstName(memberFirstName);
        setIsPrismMember(Boolean(data.member?.kitPurchased));
        setMessages([{ role: "assistant", text: data.member?.kitPurchased ? `Hi ${memberFirstName}, your concierge is here. Tell me the city, the date, and the vibe.` : `Hi ${memberFirstName}, want help finding someone tonight? Ask me anything.` }]);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const quickQuestions = firstName
    ? isPrismMember ? ["Talk to concierge", "How does private mode work?", "Is my data private?", "Contact support"] : ["Who's available tonight?", "How does booking work?", "What is PRISM?", "Is my data private?"]
    : ["How do I join?", "Is my data private?", "How does verification work?", "Safety tips"];

  function ask(question: string) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    setMessages((current) => [...current, { role: "user", text: cleanQuestion }, { role: "assistant", text: getAnswer(cleanQuestion, Boolean(firstName)) }]);
    setInput("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-16 right-0 flex h-[30rem] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-mauve-700 bg-mauve-900 text-mauve-50 shadow-2xl shadow-mauve-950/50"
          >
            <header className="flex items-center justify-between border-b border-mauve-700 bg-gradient-to-r from-mauve-900 via-fuchsia-950 to-mauve-900 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-300 to-cyan-200 text-mauve-900"><Sparkles size={17} /></span>
                <div><p className="text-sm font-semibold">Ask Gigolo Guide</p><p className="text-[11px] text-mauve-300">PRISM member support</p></div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close Gigolo Guide" className="text-mauve-300 transition hover:text-mauve-50"><X size={18} /></button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <motion.div key={`${message.role}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-xs leading-5 ${message.role === "user" ? "ml-auto bg-fuchsia-500 text-white" : "bg-mauve-800 text-mauve-100"}`}>{message.text}</motion.div>
              ))}
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question) => <button key={question} onClick={() => ask(question)} className="rounded-full border border-mauve-700 px-3 py-1.5 text-left text-[11px] text-mauve-200 transition hover:border-fuchsia-400 hover:bg-mauve-800">{question}</button>)}
              </div>
            </div>
            <form onSubmit={submit} className="flex gap-2 border-t border-mauve-700 p-3">
              <input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Ask Gigolo Guide" className="h-10 min-w-0 flex-1 rounded-xl border border-mauve-700 bg-mauve-800 px-3 text-xs text-mauve-50 outline-none focus:border-fuchsia-400" />
              <button type="submit" className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white"><Send size={15} /></button>
            </form>
            <div className="flex items-center gap-2 border-t border-mauve-800 px-4 py-2 text-[10px] text-mauve-400"><ShieldCheck size={12} /> Guidance for private, consent-first connections.</div>
          </motion.section>
        )}
      </AnimatePresence>
      <motion.button onClick={() => setOpen((current) => !current)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} aria-label="Open Gigolo Guide" className="button-shine flex h-12 items-center gap-2 rounded-full bg-mauve-900 px-4 text-sm font-semibold text-mauve-50 shadow-2xl shadow-mauve-950/40 dark:bg-mauve-50 dark:text-mauve-950">
        <MessageCircle size={18} /><span className="hidden sm:inline">Ask Gigolo Guide</span>
      </motion.button>
    </div>
  );
}
