import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";
import { createSupabaseAdminClient } from "@/lib/paid-account";
import { markPasswordReady } from "@/lib/supabase-payment-ledger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json() as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  const token = (await cookies()).get("gigolo_india_access_token")?.value;
  if (!token) return NextResponse.json({ error: "Your secure link has expired. Request another password link." }, { status: 401 });
  try {
    const supabase = createSupabaseAuthClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Your secure link has expired. Request another password link." }, { status: 401 });
    const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(userData.user.id, { password });
    if (error) return NextResponse.json({ error: "We could not set your password. Request another secure link." }, { status: 400 });
    try {
      await markPasswordReady(userData.user.id);
    } catch {
      // The password is already securely set in Supabase Auth; do not block access on an audit update.
    }
    return NextResponse.json({ message: "You're in. Welcome back." });
  } catch {
    return NextResponse.json({ error: "We could not set your password. Request another secure link." }, { status: 500 });
  }
}
