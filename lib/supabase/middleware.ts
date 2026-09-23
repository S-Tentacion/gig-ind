import { createServerClient } from "@supabase/ssr";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";
import { type NextRequest, type NextResponse } from "next/server";

/** Refreshes Supabase auth cookies on a response that may already be a rewrite. */
export async function refreshSupabaseSession(request: NextRequest, createResponse: () => NextResponse) {
  let response = createResponse();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  // Existing login routes use HTTP-only cookies instead of SSR cookie chunks.
  // Keep those sessions refreshed while the SSR helpers serve newer callers.
  const accessToken = request.cookies.get("gigolo_india_access_token")?.value;
  const refreshToken = request.cookies.get("gigolo_india_refresh_token")?.value;
  if (refreshToken) {
    const auth = createSupabaseAuthClient();
    const userResult = accessToken ? await auth.auth.getUser(accessToken) : null;
    if (!userResult || (userResult.error && [400, 401, 403].includes(userResult.error.status ?? 0))) {
      const { data, error } = await auth.auth.refreshSession({ refresh_token: refreshToken });
      if (!error && data.session) {
        const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
        request.cookies.set("gigolo_india_access_token", data.session.access_token);
        request.cookies.set("gigolo_india_refresh_token", data.session.refresh_token);
        response = createResponse();
        response.cookies.set("gigolo_india_access_token", data.session.access_token, { ...options, maxAge: data.session.expires_in });
        response.cookies.set("gigolo_india_refresh_token", data.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 14 });
        response.headers.set("Cache-Control", "private, no-store");
      }
    }
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = response.cookies.getAll();
        response = createResponse();
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  // Do not replace this with getSession(): getUser validates the session with
  // Supabase and gives the SSR client a chance to rotate expiring cookies.
  await supabase.auth.getUser();
  return response;
}
