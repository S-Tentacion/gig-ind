import { cookies } from "next/headers";
import { getMemberByContact, type Member } from "@/lib/db";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export type CurrentMember = Member & { authUserId: string };

export async function getCurrentMember(): Promise<CurrentMember | undefined> {
  const accessToken = (await cookies()).get("gigolo_india_access_token")?.value;
  if (!accessToken) return undefined;
  const { data, error } = await createSupabaseAuthClient().auth.getUser(accessToken);
  const contact = data.user?.email || data.user?.phone;
  if (error || !contact) return undefined;
  const member = getMemberByContact(contact);
  return member ? { ...member, authUserId: data.user.id } : undefined;
}
