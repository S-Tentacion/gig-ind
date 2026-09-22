import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/current-member";
import { createSupabaseAdminClient } from "@/lib/paid-account";
import { messagesUnavailableResponse, type ClientConversation, type PrivateClient } from "@/lib/member-client-conversations";

export const runtime = "nodejs";

type InboxConversation = ClientConversation & { client: PrivateClient };

function isUnread(conversation: ClientConversation) {
  if (conversation.last_sender_kind !== "client") return false;
  if (!conversation.member_last_read_at) return true;
  return new Date(conversation.last_message_at).getTime() > new Date(conversation.member_last_read_at).getTime();
}

/**
 * Returns only conversations connected to the authenticated member. Client
 * data is read from Supabase; nothing is fabricated when no client is linked.
 */
export async function GET() {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to view your messages." }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: conversationData, error: conversationError } = await admin
      .from("member_client_conversations")
      .select("id, client_id, status, member_last_read_at, last_message_preview, last_sender_kind, last_message_at, created_at")
      .eq("member_profile_id", member.authUserId)
      .eq("status", "active")
      .order("last_message_at", { ascending: false })
      .limit(100);

    if (conversationError) return NextResponse.json(messagesUnavailableResponse(), { status: 503 });
    const conversations = (conversationData ?? []) as ClientConversation[];
    if (conversations.length === 0) return NextResponse.json({ conversations: [], unreadCount: 0 });

    const clientIds = [...new Set(conversations.map((conversation) => conversation.client_id))];
    const { data: clientData, error: clientError } = await admin
      .from("clients")
      .select("id, display_name, username, city, status")
      .in("id", clientIds)
      .eq("status", "active");
    if (clientError) return NextResponse.json(messagesUnavailableResponse(), { status: 503 });

    const clientsById = new Map(((clientData ?? []) as PrivateClient[]).map((client) => [client.id, client]));
    const visibleConversations: InboxConversation[] = conversations.flatMap((conversation) => {
      const client = clientsById.get(conversation.client_id);
      return client ? [{ ...conversation, client }] : [];
    });

    return NextResponse.json({
      conversations: visibleConversations.map((conversation) => ({
        id: conversation.id,
        client: {
          id: conversation.client.id,
          displayName: conversation.client.display_name,
          username: conversation.client.username,
          city: conversation.client.city,
        },
        lastMessagePreview: conversation.last_message_preview,
        lastSenderKind: conversation.last_sender_kind,
        lastMessageAt: conversation.last_message_at,
        unread: isUnread(conversation),
      })),
      unreadCount: visibleConversations.filter(isUnread).length,
    });
  } catch {
    return NextResponse.json({ error: "We could not load your messages. Please try again." }, { status: 500 });
  }
}
