"use client";

import { LanguageSwitcher, LocalizedLink as Link, useLocalizedRouter } from "@/components/localization-provider";
import { ArrowLeft, CheckCheck, ChevronLeft, CircleAlert, Inbox, LoaderCircle, MapPin, MessageCircle, RefreshCw, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MemberMenu, useSessionMember } from "@/components/member-menu";

type InboxItem = {
  id: string;
  client: { id: string; displayName: string; username: string | null; city: string | null };
  lastMessagePreview: string | null;
  lastSenderKind: "member" | "client" | "system" | null;
  lastMessageAt: string;
  unread: boolean;
};

type ChatMessage = {
  id: string;
  senderKind: "member" | "client" | "system";
  body: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  client: InboxItem["client"];
  messages: ChatMessage[];
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatInboxTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("en-IN", isToday ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
}

function clientInitials(client: InboxItem["client"]) {
  return client.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
}

function previewFor(item: InboxItem) {
  if (!item.lastMessagePreview) return "A private conversation is ready.";
  return item.lastSenderKind === "member" ? `You: ${item.lastMessagePreview}` : item.lastMessagePreview;
}

export function MessagesModule() {
  const router = useLocalizedRouter();
  const { member, loaded } = useSessionMember();
  const [conversations, setConversations] = useState<InboxItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const selectConversation = useCallback(async (conversationId: string) => {
    const requestId = ++requestSequence.current;
    setSelectedId(conversationId);
    setConversation(null);
    setConversationLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/messages/${conversationId}`, { cache: "no-store" });
      const payload = await response.json() as { conversation?: Conversation; error?: string };
      if (requestId !== requestSequence.current) return;
      if (!response.ok || !payload.conversation) throw new Error(payload.error || "We could not load this conversation.");
      setConversation(payload.conversation);
      setConversations((current) => current.map((item) => item.id === conversationId ? { ...item, unread: false } : item));
      void fetch(`/api/messages/${conversationId}`, { method: "PATCH" });
    } catch (caught) {
      if (requestId === requestSequence.current) setError(caught instanceof Error ? caught.message : "We could not load this conversation.");
    } finally {
      if (requestId === requestSequence.current) setConversationLoading(false);
    }
  }, [conversations]);

  const loadInbox = useCallback(async (preserveSelection = true) => {
    setInboxLoading(true);
    setError("");
    try {
      const response = await fetch("/api/messages", { cache: "no-store" });
      const payload = await response.json() as { conversations?: InboxItem[]; unreadCount?: number; error?: string };
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "We could not load your messages.");
      const nextConversations = payload.conversations ?? [];
      setConversations(nextConversations);
      const nextSelected = preserveSelection && selectedId && nextConversations.some((item) => item.id === selectedId) ? selectedId : nextConversations[0]?.id ?? null;
      if (nextSelected) void selectConversation(nextSelected);
      else {
        setSelectedId(null);
        setConversation(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not load your messages.");
    } finally {
      setInboxLoading(false);
    }
  }, [router, selectedId, selectConversation]);

  useEffect(() => {
    if (!loaded) return;
    if (!member) {
      router.replace("/login");
      return;
    }
    void loadInbox(false);
  }, [loaded, member, router]); // loadInbox intentionally runs when session becomes available

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !message.trim() || sending) return;
    const body = message.trim();
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/messages/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await response.json() as { message?: ChatMessage; error?: string };
      const sentMessage = payload.message;
      if (!response.ok || !sentMessage) throw new Error(payload.error || "We could not send your message.");
      setConversation((current) => current && current.id === selectedId ? { ...current, messages: [...current.messages, sentMessage] } : current);
      setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, lastMessagePreview: sentMessage.body, lastMessageAt: sentMessage.createdAt, lastSenderKind: "member", unread: false } : item));
      setMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not send your message.");
    } finally {
      setSending(false);
    }
  }

  if (!loaded || !member) {
    return <main className="grid min-h-screen place-items-center bg-[#0d0918] text-cyan-100"><LoaderCircle className="animate-spin" aria-label="Loading messages" /></main>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d0918] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(208,201,213,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(208,201,213,.055)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[150px]" /><div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-[150px]" /></div>
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/[.06] text-cyan-100"><MessageCircle size={18} /></span><span><span className="brand-wordmark block text-[10px] font-bold uppercase tracking-[.24em]">GIGOLO INDIA</span><span className="mt-0.5 block font-serif text-lg tracking-[.1em]">MESSAGES</span></span></Link><div className="flex items-center gap-2"><LanguageSwitcher className="hidden sm:inline-flex" /><MemberMenu member={member} /></div></nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-6 lg:px-8 lg:pb-20 lg:pt-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-violet-100/65 transition hover:text-cyan-100"><ChevronLeft size={16} /> Back to home</Link>
        <div className="mt-6 rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_12%_12%,rgba(217,70,239,.2),transparent_35%),radial-gradient(circle_at_88%_85%,rgba(34,211,238,.15),transparent_32%),#151022] p-6 shadow-2xl shadow-black/20 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><ShieldCheck size={14} /> PRIVATE MESSAGES</p><h1 className="mt-3 font-serif text-4xl tracking-[-.06em] sm:text-5xl">Your conversations.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100/70">Only clients securely associated with your member account appear here.</p></div><div className="flex items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3.5 py-2 text-xs font-bold text-cyan-100"><Inbox size={14} /> {conversations.filter((item) => item.unread).length} unread</span><button type="button" onClick={() => void loadInbox()} disabled={inboxLoading} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.04] px-3.5 py-2 text-xs font-bold text-violet-100 transition hover:border-cyan-200 hover:text-cyan-100 disabled:opacity-50"><RefreshCw size={14} className={inboxLoading ? "animate-spin" : ""} /> Refresh</button></div></div></div>

        {error && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200/20 bg-rose-300/10 p-4 text-sm text-rose-100"><CircleAlert size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

        <section className="mt-6 grid min-h-[36rem] overflow-hidden rounded-[2rem] border border-white/12 bg-[#151022]/90 shadow-2xl shadow-black/20 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className={`border-b border-white/10 lg:border-b-0 lg:border-r ${selectedId ? "hidden lg:block" : "block"}`} aria-label="Conversations">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-100">INBOX</p><h2 className="mt-1 font-serif text-2xl">Connected clients</h2></div><span className="grid h-7 min-w-7 place-items-center rounded-full bg-cyan-200 px-1 text-xs font-bold text-mauve-950">{conversations.length}</span></div>
            {inboxLoading ? <div className="grid min-h-64 place-items-center text-cyan-100"><LoaderCircle size={18} className="animate-spin" /></div> : conversations.length === 0 ? <div className="px-5 py-10 text-center"><Inbox size={24} className="mx-auto text-cyan-100" /><h3 className="mt-4 font-serif text-2xl">No clients yet.</h3><p className="mt-3 text-sm leading-6 text-violet-100/65">When an administrator connects a client to your member ID, the private conversation will appear here.</p></div> : <div className="max-h-[38rem] overflow-y-auto p-2 [scrollbar-width:thin]">{conversations.map((item) => <button key={item.id} type="button" onClick={() => void selectConversation(item.id)} className={`relative w-full rounded-2xl p-3 text-left transition ${selectedId === item.id ? "bg-cyan-200/10 ring-1 ring-cyan-200/35" : "hover:bg-white/[.045]"}`}><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-fuchsia-300/30 to-cyan-200/20 text-xs font-bold text-cyan-100">{clientInitials(item.client)}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{item.client.displayName}</strong><time className="shrink-0 text-[10px] text-violet-100/45">{formatInboxTime(item.lastMessageAt)}</time></span><span className="mt-1 flex items-center gap-2"><span className={`block truncate text-xs ${item.unread ? "font-semibold text-white" : "text-violet-100/55"}`}>{previewFor(item)}</span>{item.unread && <i aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-cyan-200" />}</span></span></div></button>)}</div>}
          </aside>

          <div className={`${selectedId ? "block" : "hidden lg:grid"} min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]`}>
            {!selectedId ? <div className="grid min-h-80 place-items-center px-6 text-center"><div><MessageCircle size={28} className="mx-auto text-cyan-100" /><h2 className="mt-4 font-serif text-3xl">Choose a conversation.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-violet-100/65">Your connected client conversations will stay private to this account.</p></div></div> : conversationLoading || !conversation ? <div className="grid min-h-80 place-items-center text-cyan-100"><LoaderCircle size={20} className="animate-spin" /></div> : <><header className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6"><button type="button" onClick={() => { setSelectedId(null); setConversation(null); }} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cyan-100 transition hover:bg-white/[.06] lg:hidden" aria-label="Back to conversations"><ArrowLeft size={16} /></button><span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-fuchsia-300/30 to-cyan-200/20 text-xs font-bold text-cyan-100">{clientInitials(conversation.client)}</span><span className="min-w-0"><h2 className="truncate text-base font-bold">{conversation.client.displayName}</h2><span className="mt-1 flex items-center gap-1.5 text-xs text-violet-100/55">{conversation.client.city && <><MapPin size={12} /> {conversation.client.city}</>} {conversation.client.username && <span className="font-mono text-[10px]">@{conversation.client.username}</span>}</span></span><span className="ml-auto hidden items-center gap-1.5 rounded-full border border-white/12 bg-white/[.035] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-violet-100/60 sm:inline-flex"><ShieldCheck size={12} className="text-cyan-100" /> private</span></header>
              <div className="min-h-[21rem] overflow-y-auto px-5 py-6 sm:px-7 [scrollbar-width:thin]"><div className="mx-auto max-w-2xl space-y-4">{conversation.messages.map((item) => { const own = item.senderKind === "member"; const system = item.senderKind === "system"; if (system) return <p key={item.id} className="mx-auto max-w-md rounded-xl border border-white/10 bg-white/[.035] px-4 py-2.5 text-center text-xs leading-5 text-violet-100/65">{item.body}</p>; return <div key={item.id} className={`flex ${own ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${own ? "rounded-br-md bg-cyan-200 text-mauve-950" : "rounded-bl-md border border-white/12 bg-white/[.045] text-white"}`}><p className="text-sm leading-6">{item.body}</p><span className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${own ? "text-mauve-950/65" : "text-violet-100/45"}`}>{formatTime(item.createdAt)} {own && <CheckCheck size={12} />}</span></div></div>; })}<div ref={messagesEnd} /></div></div>
              <form onSubmit={sendMessage} className="border-t border-white/10 p-4 sm:p-5"><div className="flex items-end gap-3 rounded-2xl border border-white/12 bg-white/[.035] p-2 focus-within:border-cyan-200/60"><label className="sr-only" htmlFor="message-body">Message</label><textarea id="message-body" value={message} onChange={(event) => setMessage(event.target.value)} rows={1} maxLength={2000} placeholder="Write a private message…" className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-violet-100/35" /><button type="submit" disabled={!message.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-200 text-mauve-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45" aria-label="Send message">{sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}</button></div><p className="mt-2 flex items-center gap-1.5 px-2 text-[11px] text-violet-100/45"><ShieldCheck size={12} className="text-cyan-100" /> Share only what is needed. Keep conversations respectful and privacy-first.</p></form>
            </>}
          </div>
        </section>

        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-violet-100/50"><Sparkles size={14} className="mt-0.5 shrink-0 text-cyan-100" />Client profiles and conversations are sourced from your private Supabase association. No unconnected client is shown here.</p>
      </section>
    </main>
  );
}
