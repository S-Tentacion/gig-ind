import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/current-member";
import { createSupabaseAdminClient } from "@/lib/paid-account";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompanionRow = {
  id: string;
  display_name: string;
  age: number;
  city: string;
  vibes: string[] | null;
  languages: string[] | null;
  availability: "available_now" | "this_week" | "unavailable";
  is_prism_exclusive: boolean;
  is_top_rated: boolean;
  is_fast_reply: boolean;
  is_concierge_favorite: boolean;
  response_time_minutes: number | null;
  meetup_count: number | null;
  rating: number | null;
  primary_photo_path: string | null;
  sort_rank: number;
  verified_at: string | null;
};

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function createSignedPhotoUrl(admin: ReturnType<typeof createSupabaseAdminClient>, path: string | null) {
  if (!path) return null;
  const { data, error } = await admin.storage.from("companion-profile-media").createSignedUrl(path, 60 * 15);
  return error ? null : data.signedUrl;
}

async function getDirectoryViewer(request: NextRequest, admin: ReturnType<typeof createSupabaseAdminClient>) {
  const localMember = await getCurrentMember().catch(() => undefined);
  if (localMember) return { authenticated: true, isPrismMember: localMember.kitPurchased };

  const accessToken = request.cookies.get("gigolo_india_access_token")?.value;
  if (!accessToken) return { authenticated: false, isPrismMember: false };
  const { data } = await createSupabaseAuthClient().auth.getUser(accessToken).catch(() => ({ data: { user: null } }));
  if (!data.user) return { authenticated: false, isPrismMember: false };

  // This is a server-side membership lookup. If the profile sync has not run
  // yet, default safely to Standard rather than exposing exclusive media.
  let profile: { membership_status?: string } | null = null;
  try {
    const result = await admin
      .from("member_profiles")
      .select("membership_status")
      .eq("id", data.user.id)
      .maybeSingle();
    profile = result.data;
  } catch {
    profile = null;
  }
  return { authenticated: true, isPrismMember: profile?.membership_status === "prism" };
}

export async function GET(request: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const viewer = await getDirectoryViewer(request, admin);
    const isPrismMember = viewer.isPrismMember;
    const city = request.nextUrl.searchParams.get("city")?.trim();
    let query = admin
      .from("companion_profiles")
      .select("id, display_name, age, city, vibes, languages, availability, is_prism_exclusive, is_top_rated, is_fast_reply, is_concierge_favorite, response_time_minutes, meetup_count, rating, primary_photo_path, sort_rank, verified_at")
      .eq("is_active", true)
      .order("sort_rank", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (city) query = query.eq("city", city);
    const { data, error } = await query;
    if (error) throw error;

    const companions = await Promise.all(((data ?? []) as CompanionRow[]).map(async (companion) => {
      // A non-PRISM response never receives an exclusive photo path or URL.
      // Standard members can receive standard profile media, which the client
      // deliberately renders blurred in the standard browsing experience.
      const canViewPhoto = viewer.authenticated && (!companion.is_prism_exclusive || isPrismMember);
      const canViewName = !companion.is_prism_exclusive || isPrismMember;
      return {
        id: companion.id,
        displayName: canViewName ? companion.display_name : "Private profile",
        age: companion.age,
        city: companion.city,
        vibes: stringList(companion.vibes),
        languages: stringList(companion.languages),
        availability: companion.availability,
        isPrismExclusive: companion.is_prism_exclusive,
        isTopRated: companion.is_top_rated,
        isFastReply: companion.is_fast_reply,
        isConciergeFavorite: companion.is_concierge_favorite,
        responseTimeMinutes: companion.response_time_minutes,
        meetupCount: companion.meetup_count,
        rating: companion.rating,
        verified: Boolean(companion.verified_at),
        primaryPhotoUrl: canViewPhoto ? await createSignedPhotoUrl(admin, companion.primary_photo_path) : null,
      };
    }));

    return NextResponse.json(
      { companions, viewer: { authenticated: viewer.authenticated, plan: isPrismMember ? "prism" : "standard" } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    // Do not expose storage, table, or service-role details to the browser.
    return NextResponse.json(
      { companions: [], viewer: { authenticated: false, plan: "standard" }, error: "The companion directory is unavailable right now." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
