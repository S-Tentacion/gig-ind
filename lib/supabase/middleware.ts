import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";

/** Refreshes Supabase auth cookies on a response that may already be a rewrite. */
export async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not replace this with getSession(): getUser validates the session with
  // Supabase and gives the SSR client a chance to rotate expiring cookies.
  await supabase.auth.getUser();
  return response;
}
