import { cookies } from "next/headers";
import { getMemberByContact } from "@/lib/db";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";

export async function getCurrentMember() {
  const accessToken = (await cookies()).get("gigolo_india_access_token")?.value;
  if (!accessToken) return undefined;
  const { data, error } = await createSupabaseAuthClient().auth.getUser(accessToken);
  const contact = data.user?.email || data.user?.phone;
  if (error || !contact) return undefined;
  return getMemberByContact(contact);
}
