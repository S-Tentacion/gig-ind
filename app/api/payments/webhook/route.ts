import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { finalisePayment, getPendingPayment } from "@/lib/db";
import { linkPaidOrderToAuth } from "@/lib/paid-account";
import { recordFailedPayment, recordVerifiedPayment } from "@/lib/supabase-payment-ledger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signature || expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });

  try {
    const event = JSON.parse(rawBody) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } } };
    const payment = event.payload?.payment?.entity;
    if (!payment?.id || !payment.order_id) return NextResponse.json({ received: true });
    if (payment.status === "failed") {
      await recordFailedPayment(payment.order_id, payment.id);
      return NextResponse.json({ received: true });
    }
    if (payment.status !== "captured") return NextResponse.json({ received: true });
    const order = getPendingPayment(payment.order_id);
    if (!order) return NextResponse.json({ received: true });
    const member = finalisePayment({ orderId: order.orderId, paymentId: payment.id });
    const authUser = await linkPaidOrderToAuth(member, order.orderId);
    await recordVerifiedPayment({
      payment: { ...order, paymentId: payment.id },
      member,
      authUserId: authUser.id,
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
