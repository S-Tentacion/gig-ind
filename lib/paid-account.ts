import { createClient } from "@supabase/supabase-js";
import { linkPaymentToAuthUser, normaliseContact, type Member } from "@/lib/db";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_NOT_CONFIGURED");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function ensurePaidAuthUser(member: Member, password?: string) {
  const email = normaliseContact(member.contact);
  if (!email.includes("@")) throw new Error("PAID_ACCOUNT_REQUIRES_EMAIL");
  const admin = createSupabaseAdminClient();
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = listed.users.find((user) => user.email?.trim().toLowerCase() === email);
  if (existing) {
    if (!password) return existing;
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { ...existing.user_metadata, username: member.username, city: member.city },
    });
    if (error || !data.user) throw error ?? new Error("AUTH_PASSWORD_UPDATE_FAILED");
    return data.user;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    ...(password ? { password } : {}),
    user_metadata: { username: member.username, city: member.city },
  });
  if (error || !data.user) throw error ?? new Error("AUTH_USER_CREATION_FAILED");
  return data.user;
}

export async function linkPaidOrderToAuth(member: Member, orderId: string, password?: string) {
  const user = await ensurePaidAuthUser(member, password);
  linkPaymentToAuthUser(orderId, user.id);
  return user;
}
