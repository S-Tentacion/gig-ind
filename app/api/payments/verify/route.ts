import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { finalisePayment, getPendingPayment } from "@/lib/db";
import { linkPaidOrderToAuth } from "@/lib/paid-account";
import { recordVerifiedPayment } from "@/lib/supabase-payment-ledger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Razorpay test keys are not configured yet." }, { status: 503 });
  const body = await request.json();
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  const password = typeof body.password === "string" ? body.password : "";
  const payment = getPendingPayment(orderId);
  if (!payment || !paymentId || !signature) return NextResponse.json({ error: "The payment response is incomplete." }, { status: 400 });

  const expectedSignature = createHmac("sha256", keySecret).update(`${payment.orderId}|${paymentId}`).digest("hex");
  const valid = expectedSignature.length === signature.length && timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  if (!valid) return NextResponse.json({ error: "Payment verification failed. Your account was not created." }, { status: 400 });
  if (payment.purpose === "joining" && (password.length < 8 || password.length > 128)) {
    return NextResponse.json({ error: "Choose a password between 8 and 128 characters." }, { status: 400 });
  }

  try {
    const member = finalisePayment({ orderId: payment.orderId, paymentId });
    const authUser = await linkPaidOrderToAuth(member, payment.orderId, payment.purpose === "joining" ? password : undefined);
    await recordVerifiedPayment({
      payment: { ...payment, paymentId },
      member,
      authUserId: authUser.id,
      ...(payment.purpose === "joining" ? { signInStatus: "ready" as const } : {}),
    });
    return NextResponse.json({ member: { id: member.id, name: member.username, city: member.city, kitPurchased: member.kitPurchased, boostCredits: member.boostCredits, boostExpiresAt: member.boostExpiresAt } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return NextResponse.json({ error: "An account with this email or phone number already exists. Please sign in." }, { status: 409 });
    return NextResponse.json({ error: "Payment is confirmed, but we could not save your account status. Please contact support before trying again." }, { status: 502 });
  }
}
