import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { finalisePayment, getPendingPayment } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Razorpay test keys are not configured yet." }, { status: 503 });
  const body = await request.json();
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  const payment = getPendingPayment(orderId);
  if (!payment || !paymentId || !signature) return NextResponse.json({ error: "The payment response is incomplete." }, { status: 400 });

  const expectedSignature = createHmac("sha256", keySecret).update(`${payment.orderId}|${paymentId}`).digest("hex");
  const valid = expectedSignature.length === signature.length && timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  if (!valid) return NextResponse.json({ error: "Payment verification failed. Your account was not created." }, { status: 400 });

  try {
    const member = finalisePayment({ orderId: payment.orderId, paymentId });
    return NextResponse.json({ member: { id: member.id, name: member.name, city: member.city, boostCredits: member.boostCredits, boostExpiresAt: member.boostExpiresAt } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return NextResponse.json({ error: "An account with this email or phone number already exists. Please sign in." }, { status: 409 });
    return NextResponse.json({ error: "We could not complete your membership. Please contact the project administrator." }, { status: 500 });
  }
}
