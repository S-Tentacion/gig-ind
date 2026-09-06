"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useState } from "react";

type Message = { role: "assistant" | "user"; text: string };

const quickQuestions = ["What is the Gigolo Kit?", "Is ₹10,000 guaranteed to help me?", "How does privacy work?", "How do payments work?"];

function getAnswer(question: string) {
  const text = question.toLowerCase();
  if (text.includes("kit") || text.includes("10000") || text.includes("₹10")) return "The Gigolo Kit is presented in this college POC as a ₹10,000 premium package concept. It can describe features and support, but it does not guarantee rank, visibility, earnings, or any personal outcome.";
  if (text.includes("top") || text.includes("rank") || text.includes("guarantee") || text.includes("earn")) return "No package can guarantee top-percentile status, popularity, or earnings. Progress depends on many real-world factors, so the project does not make outcome promises.";
  if (text.includes("privacy") || text.includes("private")) return "Profiles are private by design in this POC. The public activity feed uses anonymous, simulated classroom events and never reveals member contact details.";
  if (text.includes("pay") || text.includes("razorpay") || text.includes("fee")) return "The joining checkout is wired to Razorpay’s project test environment. It demonstrates order creation and verification; no real money is collected in this POC.";
  return "I can help with the Gigolo Kit concept, account privacy, the joining flow, or project payments. What would you like to know?";
}

export function GigoloGuide() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi, I’m the Gigolo Guide. Ask about the Gigolo Kit, privacy, or payments." }]);

  function ask(question: string) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    setMessages((current) => [...current, { role: "user", text: cleanQuestion }, { role: "assistant", text: getAnswer(cleanQuestion) }]);
    setInput("");
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); ask(input); }

  return <div className="fixed bottom-5 right-5 z-40"><AnimatePresence>{open && <motion.section initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-16 right-0 flex h-[30rem] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-mauve-700 bg-mauve-900 text-mauve-50 shadow-2xl shadow-mauve-950/50"><header className="flex items-center justify-between border-b border-mauve-700 bg-gradient-to-r from-mauve-900 via-fuchsia-950 to-mauve-900 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-300 to-cyan-200 text-mauve-900"><Sparkles size={17}/></span><div><p className="text-sm font-semibold">Gigolo Guide</p><p className="text-[11px] text-mauve-300">Project assistant</p></div></div><button onClick={() => setOpen(false)} aria-label="Close Gigolo Guide" className="text-mauve-300 transition hover:text-mauve-50"><X size={18}/></button></header><div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">{messages.map((message, index) => <motion.div key={`${message.role}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-xs leading-5 ${message.role === "user" ? "ml-auto bg-fuchsia-500 text-white" : "bg-mauve-800 text-mauve-100"}`}>{message.text}</motion.div>)}<div className="flex flex-wrap gap-2">{quickQuestions.map((question) => <button key={question} onClick={() => ask(question)} className="rounded-full border border-mauve-700 px-3 py-1.5 text-left text-[11px] text-mauve-200 transition hover:border-fuchsia-400 hover:bg-mauve-800">{question}</button>)}</div></div><form onSubmit={submit} className="flex gap-2 border-t border-mauve-700 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Gigolo Guide…" aria-label="Ask Gigolo Guide" className="h-10 min-w-0 flex-1 rounded-xl border border-mauve-700 bg-mauve-800 px-3 text-xs text-mauve-50 outline-none placeholder:text-mauve-400 focus:border-fuchsia-400"/><button type="submit" className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white"><Send size={15}/></button></form><div className="flex items-center gap-2 border-t border-mauve-800 px-4 py-2 text-[10px] text-mauve-400"><ShieldCheck size={12}/> Informational project assistant — no outcome guarantees.</div></motion.section>}</AnimatePresence><motion.button onClick={() => setOpen((current) => !current)} whileHover={{ scale: 1.06 }} whileTap={{ scale: .94 }} aria-label="Open Gigolo Guide" className="button-shine flex h-12 items-center gap-2 rounded-full bg-mauve-900 px-4 text-sm font-semibold text-mauve-50 shadow-2xl shadow-mauve-950/40 dark:bg-mauve-50 dark:text-mauve-950"><MessageCircle size={18}/><span className="hidden sm:inline">Ask Gigolo Guide</span></motion.button></div>;
}
