import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/current-member";
import { createSupabaseAdminClient } from "@/lib/paid-account";

export const runtime = "nodejs";

type PaymentStatus = "created" | "verified" | "failed" | "refunded";
type PaymentType = "signup" | "kit" | "boost";

type PaymentRow = {
  id: string;
  payment_type: PaymentType;
  boost_credits: number;
  amount_paise: number;
  currency: string;
  status: PaymentStatus;
  provider_order_id: string;
  provider_payment_id: string | null;
  created_at: string;
  verified_at: string | null;
  refunded_at: string | null;
};

function safeStatus(value: string): PaymentStatus {
  return value === "verified" || value === "failed" || value === "refunded" ? value : "created";
}

function safeType(value: string): PaymentType {
  return value === "kit" || value === "boost" ? value : "signup";
}

export async function GET() {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to view your payment history." }, { status: 401 });

    const { data, error } = await createSupabaseAdminClient()
      .from("payment_transactions")
      .select("id, payment_type, boost_credits, amount_paise, currency, status, provider_order_id, provider_payment_id, created_at, verified_at, refunded_at")
      .eq("auth_user_id", member.authUserId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: "Payment history is not available yet. Complete the Supabase payment migration and try again." }, { status: 503 });

    const transactions = ((data ?? []) as PaymentRow[]).map((transaction) => ({
      id: transaction.id,
      paymentType: safeType(transaction.payment_type),
      boostCredits: Math.max(0, Number(transaction.boost_credits) || 0),
      amountPaise: Math.max(0, Number(transaction.amount_paise) || 0),
      currency: transaction.currency || "INR",
      status: safeStatus(transaction.status),
      orderId: transaction.provider_order_id,
      paymentId: transaction.provider_payment_id,
      createdAt: transaction.created_at,
      verifiedAt: transaction.verified_at,
      refundedAt: transaction.refunded_at,
    }));

    const summary = {
      totalPaidPaise: transactions.filter((transaction) => transaction.status === "verified" && transaction.currency === "INR").reduce((total, transaction) => total + transaction.amountPaise, 0),
      totalPaidStars: transactions.filter((transaction) => transaction.status === "verified" && transaction.currency === "XTR").reduce((total, transaction) => total + transaction.amountPaise, 0),
      accepted: transactions.filter((transaction) => transaction.status === "verified").length,
      pending: transactions.filter((transaction) => transaction.status === "created").length,
      rejected: transactions.filter((transaction) => transaction.status === "failed").length,
      refunded: transactions.filter((transaction) => transaction.status === "refunded").length,
    };
    return NextResponse.json({ transactions, summary });
  } catch {
    return NextResponse.json({ error: "We could not load your payment history. Please try again." }, { status: 500 });
  }
}
