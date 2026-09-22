import type { CurrentMember } from "@/lib/current-member";
import { createSupabaseAdminClient } from "@/lib/paid-account";

export type ClientConversation = {
  id: string;
  client_id: string;
  status: "active" | "archived" | "blocked";
  member_last_read_at: string | null;
  last_message_preview: string | null;
  last_sender_kind: "member" | "client" | "system" | null;
  last_message_at: string;
  created_at: string;
};

export type PrivateClient = {
  id: string;
  display_name: string;
  username: string | null;
  city: string | null;
  status: "active" | "archived" | "blocked";
};

export type ClientMessage = {
  id: string;
  sender_kind: "member" | "client" | "system";
  body: string;
  created_at: string;
};

export class MemberMessagesError extends Error {
  constructor(message: "MESSAGES_UNAVAILABLE" | "CONVERSATION_NOT_FOUND" | "CLIENT_NOT_FOUND") {
    super(message);
  }
}

export function isConversationId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Finds an active conversation owned by this member. Every API route uses
 * this ownership check before reading or mutating any message.
 */
export async function getOwnedActiveConversation(member: CurrentMember, conversationId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("member_client_conversations")
    .select("id, client_id, status, member_last_read_at, last_message_preview, last_sender_kind, last_message_at, created_at")
    .eq("id", conversationId)
    .eq("member_profile_id", member.authUserId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new MemberMessagesError("MESSAGES_UNAVAILABLE");
  if (!data) throw new MemberMessagesError("CONVERSATION_NOT_FOUND");
  return data as ClientConversation;
}

/** Returns only fields that are safe to show to the associated member. */
export async function getActiveClient(clientId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("clients")
    .select("id, display_name, username, city, status")
    .eq("id", clientId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new MemberMessagesError("MESSAGES_UNAVAILABLE");
  if (!data) throw new MemberMessagesError("CLIENT_NOT_FOUND");
  return data as PrivateClient;
}

export function messagesUnavailableResponse() {
  return { error: "Messages are not available yet. Apply the Supabase member messaging migration and try again." };
}
