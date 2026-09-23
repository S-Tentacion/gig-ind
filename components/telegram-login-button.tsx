"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TelegramLoginButton({ next = "/" }: { next?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/telegram/config", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { username?: string; state?: string };
        if (!response.ok || !data.username || !data.state) throw new Error("Telegram sign-in is unavailable.");
        if (!active || !container.current) return;
        container.current.replaceChildren();
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.dataset.telegramLogin = data.username;
        script.dataset.size = "large";
        script.dataset.radius = "12";
        script.dataset.userpic = "false";
        script.dataset.authUrl = `${window.location.origin}/api/auth/telegram?next=${encodeURIComponent(next)}&state=${encodeURIComponent(data.state)}`;
        script.onload = () => active && setState("ready");
        script.onerror = () => active && setState("error");
        container.current.appendChild(script);
      })
      .catch(() => active && setState("error"));
    return () => { active = false; };
  }, [next]);

  return (
    <div className="min-h-10">
      {state === "loading" && <span className="inline-flex items-center gap-2 text-xs text-inherit opacity-65"><LoaderCircle size={14} className="animate-spin" /> Loading Telegram…</span>}
      <div ref={container} className={state === "loading" ? "h-0 overflow-hidden" : "flex min-h-10 items-center"} />
      {state === "error" && <p className="text-xs text-rose-500">Telegram sign-in is unavailable. Please use email for now.</p>}
    </div>
  );
}
