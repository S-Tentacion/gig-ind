import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/current-member";
import { createSupabaseAdminClient } from "@/lib/paid-account";
import {
  MemberMessagesError,
  getActiveClient,
  getOwnedActiveConversation,
  isConversationId,
  messagesUnavailableResponse,
  type ClientMessage,
} from "@/lib/member-client-conversations";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ conversationId: string }> };

function errorResponse(error: unknown) {
  if (error instanceof MemberMessagesError) {
    if (error.message === "CONVERSATION_NOT_FOUND" || error.message === "CLIENT_NOT_FOUND") {
      return NextResponse.json({ error: "This conversation is not available." }, { status: 404 });
    }
    return NextResponse.json(messagesUnavailableResponse(), { status: 503 });
  }
  return NextResponse.json({ error: "We could not load this conversation. Please try again." }, { status: 500 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to view messages." }, { status: 401 });
    const { conversationId } = await params;
    if (!isConversationId(conversationId)) return NextResponse.json({ error: "This conversation is not available." }, { status: 404 });

    const conversation = await getOwnedActiveConversation(member, conversationId);
    const [client, messagesResult] = await Promise.all([
      getActiveClient(conversation.client_id),
      createSupabaseAdminClient()
        .from("member_client_messages")
        .select("id, sender_kind, body, created_at")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);
    if (messagesResult.error) return NextResponse.json(messagesUnavailableResponse(), { status: 503 });

    const messages = (messagesResult.data ?? []) as ClientMessage[];
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        client: { id: client.id, displayName: client.display_name, username: client.username, city: client.city },
        messages: messages.map((message) => ({
          id: message.id,
          senderKind: message.sender_kind,
          body: message.body,
          createdAt: message.created_at,
        })),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Sends a message as the authenticated member; sender identity is never client supplied. */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to send a message." }, { status: 401 });
    const { conversationId } = await params;
    if (!isConversationId(conversationId)) return NextResponse.json({ error: "This conversation is not available." }, { status: 404 });

    let payload: { body?: unknown };
    try {
      payload = await request.json() as { body?: unknown };
    } catch {
      return NextResponse.json({ error: "Enter a message before sending." }, { status: 400 });
    }
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    if (!body || body.length > 2000) {
      return NextResponse.json({ error: "Messages must be between 1 and 2,000 characters." }, { status: 400 });
    }

    const conversation = await getOwnedActiveConversation(member, conversationId);
    const admin = createSupabaseAdminClient();
    const { data: message, error: insertError } = await admin
      .from("member_client_messages")
      .insert({
        conversation_id: conversation.id,
        sender_kind: "member",
        sender_member_id: member.authUserId,
        body,
      })
      .select("id, sender_kind, body, created_at")
      .single();
    if (insertError || !message) return NextResponse.json(messagesUnavailableResponse(), { status: 503 });

    const { error: readError } = await admin
      .from("member_client_conversations")
      .update({ member_last_read_at: new Date().toISOString() })
      .eq("id", conversation.id)
      .eq("member_profile_id", member.authUserId);
    if (readError) return NextResponse.json(messagesUnavailableResponse(), { status: 503 });

    const typedMessage = message as ClientMessage;
    return NextResponse.json({
      message: { id: typedMessage.id, senderKind: typedMessage.sender_kind, body: typedMessage.body, createdAt: typedMessage.created_at },
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Marks only the current member's copy of the conversation as read. */
export async function PATCH(_request: Request, { params }: RouteContext) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to update messages." }, { status: 401 });
    const { conversationId } = await params;
    if (!isConversationId(conversationId)) return NextResponse.json({ error: "This conversation is not available." }, { status: 404 });

    const conversation = await getOwnedActiveConversation(member, conversationId);
    const { error } = await createSupabaseAdminClient()
      .from("member_client_conversations")
      .update({ member_last_read_at: new Date().toISOString() })
      .eq("id", conversation.id)
      .eq("member_profile_id", member.authUserId);
    if (error) return NextResponse.json(messagesUnavailableResponse(), { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
