import { NextResponse } from "next/server";
import { getPendingPayment } from "@/lib/db";
import { validCheckoutSecret } from "@/lib/telegram-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json() as { orderId?: string; checkoutSecret?: string };
  const payment = body.orderId ? getPendingPayment(body.orderId) : undefined;
  if (!payment || !validCheckoutSecret(body.checkoutSecret || "", payment.checkoutSecretHash)) return NextResponse.json({ error: "Payment session was not found." }, { status: 404 });
  return NextResponse.json({ status: payment.status, paymentId: payment.status === "verified" ? payment.paymentId : undefined, purpose: payment.purpose });
}
