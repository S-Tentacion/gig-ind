"use client";

import { useEffect } from "react";

export function AuthHashSession() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;
    const expiresIn = Number(params.get("expires_in"));
    void fetch("/api/auth/session-from-hash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken, refreshToken, expiresIn }) })
      .then((response) => {
        if (!response.ok) throw new Error("SESSION_HANDOFF_FAILED");
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        window.location.replace(`${window.location.pathname}${window.location.search}` || "/");
      })
      .catch(() => undefined);
  }, []);

  return null;
}
