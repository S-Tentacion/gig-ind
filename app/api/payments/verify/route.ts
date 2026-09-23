import { NextResponse } from "next/server";
import { getMemberByContact, getPendingPayment } from "@/lib/db";
import { linkPaidOrderToAuth } from "@/lib/paid-account";
import { recordVerifiedPayment } from "@/lib/supabase-payment-ledger";
import { validCheckoutSecret } from "@/lib/telegram-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json() as { orderId?: string; checkoutSecret?: string; password?: string };
  const payment = body.orderId ? getPendingPayment(body.orderId) : undefined;
  if (!payment || !validCheckoutSecret(body.checkoutSecret || "", payment.checkoutSecretHash)) return NextResponse.json({ error: "Payment session was not found." }, { status: 404 });
  if (payment.status !== "verified" || !payment.paymentId) return NextResponse.json({ error: "Telegram has not confirmed this payment yet." }, { status: 409 });
  if (payment.purpose !== "joining") return NextResponse.json({ ok: true });
  if (!body.password || body.password.length < 8 || body.password.length > 128) return NextResponse.json({ error: "Choose a password between 8 and 128 characters." }, { status: 400 });
  const member = getMemberByContact(payment.contact);
  if (!member) return NextResponse.json({ error: "The paid member account could not be found." }, { status: 404 });
  try {
    const authUser = await linkPaidOrderToAuth(member, payment.orderId, body.password);
    await recordVerifiedPayment({ payment, member, authUserId: authUser.id, signInStatus: "ready" });
    return NextResponse.json({ paymentId: payment.paymentId, member: { id: member.id, name: member.username, city: member.city } });
  } catch (error) {
    console.error("Telegram payment completion failed", error);
    return NextResponse.json({ error: "Payment is confirmed, but account setup could not be completed. Please contact support." }, { status: 502 });
  }
}
