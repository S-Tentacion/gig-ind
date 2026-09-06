import { NextResponse } from "next/server";
import { createPendingPayment, getMemberByContact, type PaymentPurpose } from "@/lib/db";
import { getCurrentMember } from "@/lib/current-member";

export const runtime = "nodejs";

const JOINING_AMOUNT = 150000;
const KIT_AMOUNT = 1000000;
const BOOST_CREDIT_AMOUNT = 100000;

export async function POST(request: Request) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay test keys are not configured yet. Add them to .env.local." }, { status: 503 });

  const body = await request.json() as { kind?: string; name?: string; contact?: string; city?: string; boostPack?: number };
  let purpose: PaymentPurpose = body.kind === "kit" ? "kit" : "joining";
  if (body.kind === "boost") {
    const pack = body.boostPack;
    if (!Number.isInteger(pack) || !pack || pack < 1 || pack > 10) return NextResponse.json({ error: "Choose between 1 and 10 Profile Boost credits." }, { status: 400 });
    purpose = `boost_${pack}` as PaymentPurpose;
  }
  let name = typeof body.name === "string" ? body.name.trim() : "";
  let contact = typeof body.contact === "string" ? body.contact.trim() : "";
  let city = typeof body.city === "string" ? body.city.trim() : "";
  const amount = purpose === "kit" ? KIT_AMOUNT : purpose.startsWith("boost_") ? Number(purpose.replace("boost_", "")) * BOOST_CREDIT_AMOUNT : JOINING_AMOUNT;

  if (purpose === "kit" || purpose.startsWith("boost_")) {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: `Please sign in before purchasing ${purpose === "kit" ? "the Gigolo Kit" : "Profile Boost"}.` }, { status: 401 });
    if (purpose === "kit" && member.kitPurchased) return NextResponse.json({ error: "Your account already has premium access." }, { status: 409 });
    if (purpose.startsWith("boost_") && !member.kitPurchased) return NextResponse.json({ error: "Profile Boost is available with the Gigolo Kit." }, { status: 403 });
    ({ name, contact, city } = member);
  } else {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^[+\d][\d\s-]{7,}$/.test(contact);
    if (name.length < 2 || city.length < 2 || (!isEmail && !isPhone)) return NextResponse.json({ error: "Please enter a name, city, and a valid email or phone number." }, { status: 400 });
    if (getMemberByContact(contact)) return NextResponse.json({ error: "An account with this email or phone number already exists. Please sign in." }, { status: 409 });
  }

  const receipt = `${purpose}_${Date.now()}`;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount, currency: "INR", receipt, notes: { purpose: `gigolo_india_${purpose}` } }), cache: "no-store" });
  if (!razorpayResponse.ok) return NextResponse.json({ error: "Razorpay could not create a test order. Check your test keys." }, { status: 502 });
  const order = await razorpayResponse.json() as { id: string; amount: number; currency: string };

  createPendingPayment({ orderId: order.id, name, contact, city, amount, purpose });
  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId, purpose });
}
