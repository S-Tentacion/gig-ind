"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, List, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatQuestion = { q: string; a: string };
type ChatCategory = { id: string; icon: string; label: string; intro: string; questions: ChatQuestion[] };
type Message = { id: string; role: "guide" | "user"; text: string };
type NavigationState =
  | { level: 1 }
  | { level: 2; categoryId: string }
  | { level: 3; categoryId: string; questionIndex: number };

export const chatCategories: ChatCategory[] = [
  {
    id: "membership",
    icon: "💎",
    label: "Membership & PRISM",
    intro: "Here's what members usually ask about membership and PRISM:",
    questions: [
      { q: "How do I join?", a: "Create your account, confirm you're 18 or older, and complete the Standard membership payment. Your account activates after Telegram confirms the payment." },
      { q: "What is PRISM?", a: "PRISM is our premium membership experience. It unlocks the full PRISM interface, premium browsing features, Kit tracking, Boost credits, and priority support." },
      { q: "How much is PRISM?", a: "PRISM costs 8,750 Telegram Stars as a one-time upgrade. You can upgrade later from your member homepage or membership page." },
      { q: "Can I cancel PRISM?", a: "PRISM is a one-time upgrade rather than a recurring subscription, so there is no automatic renewal to cancel. Contact support if you have a payment concern." },
    ],
  },
  {
    id: "kit",
    icon: "📦",
    label: "Kit & Orders",
    intro: "Questions about your Kit and orders:",
    questions: [
      { q: "Where is my Kit?", a: "You can track your Kit's status — Order Placed, Packed, Shipped, and Delivered — from your member homepage under Order Tracking." },
      { q: "How long does the Kit take to arrive?", a: "Delivery timelines vary by city. Once shipped, you'll see the latest available status on your homepage." },
      { q: "What's inside the Kit?", a: "Your welcome Kit contains the materials prepared for your verified PRISM membership experience. The order page shows the current Kit description." },
      { q: "My Kit hasn't moved in days. What do I do?", a: "Courier delays can happen. Open Order Tracking, keep your order reference ready, and contact support so the team can follow up." },
    ],
  },
  {
    id: "boost",
    icon: "⚡",
    label: "Boost Credits",
    intro: "Everything about Boost credits:",
    questions: [
      { q: "How does Boost work?", a: "One Boost credit activates the PRISM Boost visual state for one hour. It does not promise placement, visibility, bookings, income, or any other outcome." },
      { q: "How do I buy a Boost credit?", a: "Open Boost Credits from your member area, choose a quantity, and complete the Telegram Stars payment. Verified credits appear in your saved balance." },
      { q: "Do Boost credits expire?", a: "Unused Boost credits stay in your saved balance. Once you activate one, that Boost remains active for exactly one hour." },
      { q: "Where can I see my credits?", a: "Your available balance and active Boost timer appear in the PRISM Boost panel on your member homepage." },
    ],
  },
  {
    id: "privacy",
    icon: "🔒",
    label: "Privacy & Safety",
    intro: "Privacy and safety, answered:",
    questions: [
      { q: "Is my data private?", a: "Your account information supports private member access and safety. Profiles are not made public simply because an account is created, and the platform does not sell personal data." },
      { q: "How is verification done?", a: "Registration checks the required account details, age confirmation, and profile photos before paid access is completed. Additional reviews may be requested for safety." },
      { q: "What if I feel unsafe?", a: "Stop the conversation or meeting, move to a safe place, and report the concern through the platform. If anyone is in immediate danger, contact local emergency services." },
      { q: "Safety tips", a: "Meet in a public or trusted place first, tell someone you trust about your plans, keep consent clear and ongoing, and never share financial credentials." },
    ],
  },
  {
    id: "bookings",
    icon: "💬",
    label: "Bookings & Messaging",
    intro: "How bookings and messaging work:",
    questions: [
      { q: "How do I book someone?", a: "Message a companion, agree on availability, the plan, and boundaries, then confirm the details through the platform." },
      { q: "Can I change a plan?", a: "Discuss changes in the conversation before anything is confirmed. Everyone involved must agree to the updated plan and boundaries." },
      { q: "Why can't I message someone?", a: "Messaging may depend on your membership access, whether you are signed in, and the companion's current availability settings." },
      { q: "Someone stopped replying", a: "Give them space and do not pressure them for a response. Every member may choose whether to continue a conversation." },
    ],
  },
  {
    id: "account",
    icon: "💳",
    label: "Account & Billing",
    intro: "Account and billing help:",
    questions: [
      { q: "How do payments work?", a: "Digital membership purchases use Telegram Stars. The website opens a Telegram invoice and activates the purchase only after Telegram confirms it." },
      { q: "Where is my payment history?", a: "Open Payment History from your member menu to review your verified membership, PRISM, Kit, and Boost transactions." },
      { q: "How do I update my profile?", a: "Open Profile from your member menu to update your display name, city, introduction, privacy preference, and profile photos." },
      { q: "How do I delete my account?", a: "Use the privacy and support options to request deletion. Your request will be handled according to the Privacy Policy." },
    ],
  },
  {
    id: "telegram",
    icon: "✈️",
    label: "Telegram & Sign-in",
    intro: "Help with Telegram payments and account access:",
    questions: [
      { q: "How do I sign in with Telegram?", a: "Link Telegram from your profile or complete a Stars payment with the same account. You can then choose Telegram on the sign-in page." },
      { q: "Why isn't Telegram sign-in working?", a: "Make sure you use the Telegram account linked to your membership. Otherwise, sign in with email first and link Telegram from your profile." },
      { q: "My Stars payment is pending", a: "Return to Telegram and complete the invoice. The website activates your purchase only after Telegram sends a verified payment confirmation." },
      { q: "Where do payment alerts go?", a: "Payment confirmations are sent through the Telegram bot used for checkout. Open the bot and press Start so it can message you." },
    ],
  },
];

const GREETING: Message = {
  id: "greeting",
  role: "guide",
  text: "Hi, I'm your PRISM guide. Choose a topic below or type a question and I'll help you find the right answer.",
};
const FALLBACK_REPLY = "Thanks for reaching out. We'll get back to you on the email or phone number linked to your registration within a short while.";
const STORAGE = {
  messages: "gigolo-guide-messages-v2",
  navigation: "gigolo-guide-navigation-v2",
  cooldown: "gigolo-guide-cooldown-v1",
  scroll: "gigolo-guide-scroll-v2",
};

function messageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function isStoredMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Message>;
  return typeof item.id === "string" && (item.role === "guide" || item.role === "user") && typeof item.text === "string";
}

function parseNavigation(value: string | null): NavigationState {
  try {
    const parsed = JSON.parse(value || "null") as { level?: number; categoryId?: unknown; questionIndex?: unknown } | null;
    if (!parsed || parsed.level === 1) return { level: 1 };
    if (typeof parsed.categoryId !== "string") return { level: 1 };
    const category = chatCategories.find((item) => item.id === parsed.categoryId);
    if (!category) return { level: 1 };
    if (parsed.level === 2) return { level: 2, categoryId: category.id };
    if (parsed.level === 3 && Number.isInteger(parsed.questionIndex) && Number(parsed.questionIndex) >= 0 && Number(parsed.questionIndex) < category.questions.length) {
      return { level: 3, categoryId: category.id, questionIndex: Number(parsed.questionIndex) };
    }
  } catch {
    // Invalid session data falls back to the category list.
  }
  return { level: 1 };
}

export function GigoloGuide() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [navigation, setNavigation] = useState<NavigationState>({ level: 1 });
  const [typing, setTyping] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const scrollArea = useRef<HTMLDivElement>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategoryId = navigation.level === 1 ? undefined : navigation.categoryId;
  const activeCategory = activeCategoryId ? chatCategories.find((item) => item.id === activeCategoryId) : undefined;
  const coolingDown = cooldownEnd > Date.now();
  const latestGuideMessage = [...messages].reverse().find((message) => message.role === "guide")?.text || "";

  useEffect(() => {
    try {
      const storedMessages = JSON.parse(sessionStorage.getItem(STORAGE.messages) || "null") as unknown;
      if (Array.isArray(storedMessages) && storedMessages.length > 0 && storedMessages.every(isStoredMessage)) setMessages(storedMessages);
      setNavigation(parseNavigation(sessionStorage.getItem(STORAGE.navigation)));
      const storedCooldown = Number(sessionStorage.getItem(STORAGE.cooldown));
      if (Number.isFinite(storedCooldown) && storedCooldown > Date.now()) {
        setCooldownEnd(storedCooldown);
        setRemaining(Math.ceil((storedCooldown - Date.now()) / 1000));
      }
    } catch {
      sessionStorage.removeItem(STORAGE.messages);
      sessionStorage.removeItem(STORAGE.navigation);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE.messages, JSON.stringify(messages));
    sessionStorage.setItem(STORAGE.navigation, JSON.stringify(navigation));
    if (cooldownEnd > Date.now()) sessionStorage.setItem(STORAGE.cooldown, String(cooldownEnd));
    else sessionStorage.removeItem(STORAGE.cooldown);
  }, [cooldownEnd, hydrated, messages, navigation]);

  useEffect(() => {
    if (!cooldownEnd) {
      setRemaining(0);
      return;
    }
    const update = () => {
      const seconds = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) setCooldownEnd(0);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownEnd]);

  useEffect(() => {
    if (!open || !scrollArea.current) return;
    const frame = requestAnimationFrame(() => {
      if (!scrollArea.current) return;
      scrollArea.current.scrollTop = Number(sessionStorage.getItem(STORAGE.scroll)) || scrollArea.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!hydrated || !open) return;
    const frame = requestAnimationFrame(() => scrollArea.current?.scrollTo({ top: scrollArea.current.scrollHeight, behavior: "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [hydrated, messages, navigation, open, typing]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => () => {
    if (responseTimer.current) clearTimeout(responseTimer.current);
  }, []);

  function queueGuideReply(text: string, nextNavigation?: NavigationState) {
    setTyping(true);
    responseTimer.current = setTimeout(() => {
      setMessages((current) => [...current, { id: messageId(), role: "guide", text }]);
      if (nextNavigation) setNavigation(nextNavigation);
      setTyping(false);
      responseTimer.current = null;
    }, 600 + Math.floor(Math.random() * 301));
  }

  function chooseCategory(category: ChatCategory) {
    if (typing) return;
    setMessages((current) => [...current, { id: messageId(), role: "user", text: `${category.icon} ${category.label}` }]);
    queueGuideReply(category.intro, { level: 2, categoryId: category.id });
  }

  function chooseQuestion(category: ChatCategory, question: ChatQuestion, questionIndex: number) {
    if (typing) return;
    setMessages((current) => [...current, { id: messageId(), role: "user", text: question.q }]);
    queueGuideReply(question.a, { level: 3, categoryId: category.id, questionIndex });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || coolingDown || typing) return;
    setMessages((current) => [...current, { id: messageId(), role: "user", text: question }]);
    setInput("");
    const end = Date.now() + 90_000;
    setCooldownEnd(end);
    setRemaining(90);
    sessionStorage.setItem(STORAGE.cooldown, String(end));
    queueGuideReply(FALLBACK_REPLY);
  }

  function clearConversation() {
    if (responseTimer.current) clearTimeout(responseTimer.current);
    responseTimer.current = null;
    setTyping(false);
    setMessages([GREETING]);
    setNavigation({ level: 1 });
    setInput("");
    sessionStorage.removeItem(STORAGE.messages);
    sessionStorage.removeItem(STORAGE.navigation);
    sessionStorage.removeItem(STORAGE.scroll);
  }

  function navigationRows() {
    if (navigation.level === 1) {
      return (
        <section aria-label="Support categories" className="space-y-2">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[.15em] text-cyan-200">Choose a topic</p>
          {chatCategories.map((category) => (
            <button type="button" key={category.id} disabled={typing} onClick={() => chooseCategory(category)} className="group flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 p-3 text-left transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-45">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauve-700/70 text-lg">{category.icon}</span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-mauve-50">{category.label}</span><span className="mt-0.5 block text-[10px] text-mauve-400">{category.questions.length} questions</span></span>
              <ChevronRight aria-hidden="true" size={15} className="shrink-0 text-mauve-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" />
            </button>
          ))}
        </section>
      );
    }

    if (!activeCategory) return null;
    if (navigation.level === 2) {
      return (
        <section aria-label={`${activeCategory.label} questions`} className="space-y-2">
          <button type="button" disabled={typing} onClick={() => setNavigation({ level: 1 })} aria-label="Back to categories" className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[11px] font-semibold text-cyan-200 transition hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:opacity-45"><ChevronLeft size={14} /> Back to categories</button>
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[.15em] text-mauve-400"><span aria-hidden="true">{activeCategory.icon}</span> {activeCategory.label}</p>
          {activeCategory.questions.map((question, index) => (
            <button type="button" key={question.q} disabled={typing} onClick={() => chooseQuestion(activeCategory, question, index)} className="group flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 px-4 py-3 text-left text-xs leading-5 text-mauve-100 transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-45"><span className="min-w-0 flex-1">{question.q}</span><ChevronRight aria-hidden="true" size={15} className="shrink-0 text-mauve-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" /></button>
          ))}
        </section>
      );
    }

    return (
      <section aria-label="Answer follow-up navigation" className="space-y-2">
        <button type="button" onClick={() => setNavigation({ level: 2, categoryId: activeCategory.id })} aria-label={`More questions in ${activeCategory.label}`} className="flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 px-4 py-3 text-left text-xs font-semibold text-mauve-100 transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><ChevronLeft aria-hidden="true" size={15} className="text-cyan-200" /><span className="flex-1">More questions in this category</span></button>
        <button type="button" onClick={() => setNavigation({ level: 1 })} aria-label="See all categories" className="flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 px-4 py-3 text-left text-xs font-semibold text-mauve-100 transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><List aria-hidden="true" size={15} className="text-cyan-200" /><span className="flex-1">See all categories</span></button>
      </section>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[90] sm:bottom-5 sm:right-5">
      <AnimatePresence>
        {open && (
          <motion.section role="dialog" aria-modal="true" aria-labelledby="gigolo-guide-title" initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 28, scale: 0.98 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-x-0 bottom-0 flex h-[min(86dvh,44rem)] flex-col overflow-hidden rounded-t-[2rem] border border-mauve-700 bg-mauve-900 text-mauve-50 shadow-2xl shadow-mauve-950/60 sm:absolute sm:inset-x-auto sm:bottom-16 sm:right-0 sm:h-[36rem] sm:w-[24rem] sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-mauve-700 bg-gradient-to-r from-mauve-900 via-fuchsia-950 to-mauve-900 px-5 py-4">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-300 to-cyan-200 text-mauve-900"><Sparkles size={17} /></span><div><p id="gigolo-guide-title" className="text-sm font-semibold">Ask Gigolo Guide</p><p className="text-[11px] text-mauve-300">PRISM member support</p></div></div>
              <div className="flex items-center gap-1"><button type="button" onClick={clearConversation} aria-label="Clear conversation" title="Clear conversation" className="grid h-9 w-9 place-items-center rounded-lg text-mauve-300 transition hover:bg-white/5 hover:text-mauve-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><RotateCcw size={16} /></button><button type="button" onClick={() => setOpen(false)} aria-label="Close Gigolo Guide" className="grid h-9 w-9 place-items-center rounded-lg text-mauve-300 transition hover:bg-white/5 hover:text-mauve-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><X size={18} /></button></div>
            </header>

            <p className="sr-only" aria-live="polite" aria-atomic="true">{latestGuideMessage}</p>
            <div ref={scrollArea} onScroll={(event) => sessionStorage.setItem(STORAGE.scroll, String(event.currentTarget.scrollTop))} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="space-y-3">
                {messages.map((message) => <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-xs leading-5 ${message.role === "user" ? "ml-auto rounded-br-md bg-fuchsia-500 text-white" : "rounded-bl-md bg-mauve-800 text-mauve-100"}`}>{message.text}</motion.div>)}
                {typing && <div role="status" aria-label="Gigolo Guide is typing" className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-mauve-800 px-4 py-3"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.3s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.15s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200" /></div>}
              </div>
              {!typing && navigationRows()}
            </div>

            <form onSubmit={submit} className="border-t border-mauve-700 p-3">
              <div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} disabled={coolingDown} aria-label="Ask Gigolo Guide" aria-describedby={coolingDown ? "gigolo-guide-cooldown" : undefined} placeholder={coolingDown ? `You can send another message in ${remaining}s` : "Type your question…"} className="h-10 min-w-0 flex-1 rounded-xl border border-mauve-700 bg-mauve-800 px-3 text-xs text-mauve-50 outline-none transition placeholder:text-mauve-400 focus:border-fuchsia-400 disabled:cursor-not-allowed disabled:bg-mauve-950 disabled:text-mauve-500" /><button type="submit" disabled={!input.trim() || coolingDown || typing} aria-label="Send message" className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-40"><Send size={15} /></button></div>
              {coolingDown && <p id="gigolo-guide-cooldown" role="status" aria-live="polite" className="mt-2 text-[10px] text-mauve-400">Please wait {remaining} seconds before sending another message.</p>}
            </form>
            <div className="flex items-center gap-2 border-t border-mauve-800 px-4 py-2 text-[10px] text-mauve-400"><ShieldCheck size={12} /> Guidance for private, consent-first connections.</div>
          </motion.section>
        )}
      </AnimatePresence>
      <motion.button type="button" onClick={() => setOpen((current) => !current)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} aria-label={open ? "Close Gigolo Guide" : "Open Gigolo Guide"} aria-expanded={open} className="button-shine flex h-12 items-center gap-2 rounded-full bg-mauve-900 px-4 text-sm font-semibold text-mauve-50 shadow-2xl shadow-mauve-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 dark:bg-mauve-50 dark:text-mauve-950">{open ? <X size={18} /> : <MessageCircle size={18} />}<span className="hidden sm:inline">Ask Gigolo Guide</span></motion.button>
    </div>
  );
}
