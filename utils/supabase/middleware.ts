import { NextResponse, type NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

export function createClient(request: NextRequest) {
  return refreshSupabaseSession(request, () => NextResponse.next({ request }));
}
