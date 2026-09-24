import { NextResponse } from "next/server";
import { getCoinGateOrder, validCheckoutSecret } from "@/lib/coingate";
import { getPendingPayment, updatePaymentStatus } from "@/lib/db";
import { finaliseVerifiedOrder } from "@/lib/payment-finalization";

export const runtime = "nodejs";

function matchesOrder(payment: NonNullable<ReturnType<typeof getPendingPayment>>, remote: Awaited<ReturnType<typeof getCoinGateOrder>>) {
  return remote.order_id === payment.orderId && remote.price_currency === payment.currency && Number(remote.price_amount) === payment.amount;
}

export async function POST(request: Request) {
  const body = await request.json() as { orderId?: string; checkoutSecret?: string };
  const payment = body.orderId ? getPendingPayment(body.orderId) : undefined;
  if (!payment || !validCheckoutSecret(body.checkoutSecret || "", payment.checkoutSecretHash)) return NextResponse.json({ error: "Payment session was not found." }, { status: 404 });
  if (payment.status === "verified" && payment.paymentId) return NextResponse.json({ status: "verified", paymentId: payment.paymentId, purpose: payment.purpose });
  if (!payment.providerOrderId) return NextResponse.json({ error: "CoinGate order reference is missing." }, { status: 409 });

  try {
    const remote = await getCoinGateOrder(payment.providerOrderId);
    if (!matchesOrder(payment, remote)) return NextResponse.json({ error: "CoinGate order details do not match this payment." }, { status: 409 });
    if (remote.status === "paid") {
      const providerPaymentId = `coingate:${remote.id}`;
      await finaliseVerifiedOrder(payment, providerPaymentId);
      return NextResponse.json({ status: "verified", paymentId: providerPaymentId, purpose: payment.purpose });
    }
    if (remote.status === "refunded" || remote.status === "partially_refunded") {
      updatePaymentStatus(payment.orderId, "refunded");
      return NextResponse.json({ status: "refunded", purpose: payment.purpose });
    }
    if (["invalid", "expired", "canceled"].includes(remote.status)) {
      updatePaymentStatus(payment.orderId, "failed");
      return NextResponse.json({ status: remote.status, purpose: payment.purpose });
    }
    return NextResponse.json({ status: remote.status || "created", purpose: payment.purpose });
  } catch (error) {
    console.error("CoinGate payment status check failed", error);
    return NextResponse.json({ error: "We could not check CoinGate payment status." }, { status: 502 });
  }
}
