import { NextResponse } from "next/server";
import { getCoinGateOrder, validCheckoutSecret } from "@/lib/coingate";
import { getPendingPayment, updatePaymentStatus } from "@/lib/db";
import { finaliseVerifiedOrder } from "@/lib/payment-finalization";

export const runtime = "nodejs";

async function callbackBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return request.json() as Promise<Record<string, unknown>>;
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function POST(request: Request) {
  try {
    const callback = await callbackBody(request);
    const orderId = typeof callback.order_id === "string" ? callback.order_id : "";
    const token = typeof callback.token === "string" ? callback.token : "";
    const payment = orderId ? getPendingPayment(orderId) : undefined;
    if (!payment || !validCheckoutSecret(token, payment.checkoutSecretHash)) return NextResponse.json({ error: "Invalid callback token." }, { status: 401 });
    if (!payment.providerOrderId || String(callback.id || "") !== payment.providerOrderId) return NextResponse.json({ error: "CoinGate order reference does not match." }, { status: 409 });

    const remote = await getCoinGateOrder(payment.providerOrderId);
    if (remote.order_id !== payment.orderId || remote.price_currency !== payment.currency || Number(remote.price_amount) !== payment.amount) return NextResponse.json({ error: "CoinGate order details do not match." }, { status: 409 });
    if (remote.status === "paid") await finaliseVerifiedOrder(payment, `coingate:${remote.id}`);
    else if (remote.status === "refunded" || remote.status === "partially_refunded") updatePaymentStatus(payment.orderId, "refunded");
    else if (["invalid", "expired", "canceled"].includes(remote.status)) updatePaymentStatus(payment.orderId, "failed");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("CoinGate callback processing failed", error);
    return NextResponse.json({ error: "Callback processing failed." }, { status: 500 });
  }
}
