import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/current-member";
import { getMemberByTelegramUserId, linkTelegramAccount, normaliseContact } from "@/lib/db";
import { createSupabaseAdminClient, ensurePaidAuthUser } from "@/lib/paid-account";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";
import { linkTelegramMemberProfile, recordSuccessfulSignIn } from "@/lib/supabase-payment-ledger";
import { verifyTelegramLogin } from "@/lib/telegram-auth";

export const runtime = "nodejs";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function redirectWithState(request: NextRequest, path: string, state: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("telegram", state);
  const response = NextResponse.redirect(url);
  response.cookies.delete("telegram_login_state");
  return response;
}

export async function GET(request: NextRequest) {
  const loginState = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get("telegram_login_state")?.value;
  if (!loginState || !stateCookie || loginState !== stateCookie) return redirectWithState(request, "/login", "invalid");
  const telegram = verifyTelegramLogin(request.nextUrl.searchParams);
  if (!telegram) return redirectWithState(request, "/login", "invalid");

  try {
    const signedInMember = await getCurrentMember();
    const existingLink = getMemberByTelegramUserId(telegram.id);

    if (signedInMember) {
      if (existingLink && existingLink.id !== signedInMember.id) return redirectWithState(request, "/profile", "conflict");
      linkTelegramAccount(signedInMember.id, telegram.id, telegram.username);
      await linkTelegramMemberProfile({ authUserId: signedInMember.authUserId, telegramUserId: telegram.id, telegramUsername: telegram.username });
      const admin = createSupabaseAdminClient();
      const { data } = await admin.auth.admin.getUserById(signedInMember.authUserId);
      if (data.user) {
        await admin.auth.admin.updateUserById(signedInMember.authUserId, {
          user_metadata: { ...data.user.user_metadata, telegram_user_id: telegram.id, telegram_username: telegram.username ?? null },
        });
      }
      return redirectWithState(request, safeNext(request.nextUrl.searchParams.get("next")), "linked");
    }

    const member = existingLink;
    if (!member) return redirectWithState(request, "/login", "unlinked");

    const authUser = await ensurePaidAuthUser(member);
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.updateUserById(authUser.id, {
      user_metadata: { ...authUser.user_metadata, telegram_user_id: telegram.id, telegram_username: telegram.username ?? null },
    });
    await linkTelegramMemberProfile({ authUserId: authUser.id, telegramUserId: telegram.id, telegramUsername: telegram.username });

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: normaliseContact(member.contact),
    });
    const tokenHash = link.properties?.hashed_token;
    if (linkError || !tokenHash) throw linkError ?? new Error("TELEGRAM_SESSION_LINK_FAILED");
    const { data: verified, error: verifyError } = await createSupabaseAuthClient().auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyError || !verified.session) throw verifyError ?? new Error("TELEGRAM_SESSION_FAILED");
    await recordSuccessfulSignIn({ authUserId: authUser.id, member }).catch(() => undefined);

    const response = NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url));
    response.cookies.delete("telegram_login_state");
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: verified.session.expires_in, path: "/" };
    response.cookies.set("gigolo_india_access_token", verified.session.access_token, options);
    response.cookies.set("gigolo_india_refresh_token", verified.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 14 });
    return response;
  } catch (error) {
    console.error("Telegram sign-in failed", error);
    return redirectWithState(request, "/login", "failed");
  }
}
