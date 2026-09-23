import { NextResponse } from "next/server";
import { createPendingPayment, getMemberByContact, getMemberByUsername, type PaymentPurpose } from "@/lib/db";
import { getCurrentMember } from "@/lib/current-member";
import { recordPaymentOrder } from "@/lib/supabase-payment-ledger";
import { randomBytes, randomUUID } from "node:crypto";
import { checkoutSecretHash, createTelegramInvoice, paymentStars } from "@/lib/telegram-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return NextResponse.json({ error: "Telegram payments are not configured yet." }, { status: 503 });

  const body = await request.json() as { kind?: string; name?: string; username?: string; contact?: string; city?: string; boostPack?: number };
  let purpose: PaymentPurpose = body.kind === "kit" ? "kit" : "joining";
  if (body.kind === "boost") {
    const pack = body.boostPack;
    if (!Number.isInteger(pack) || !pack || pack < 1 || pack > 10) return NextResponse.json({ error: "Choose between 1 and 10 Profile Boost credits." }, { status: 400 });
    purpose = `boost_${pack}` as PaymentPurpose;
  }
  let name = typeof body.name === "string" ? body.name.trim() : "";
  let username = typeof body.username === "string" ? body.username.trim() : "";
  let contact = typeof body.contact === "string" ? body.contact.trim() : "";
  let city = typeof body.city === "string" ? body.city.trim() : "";
  const amount = paymentStars(purpose);

  if (purpose === "kit" || purpose.startsWith("boost_")) {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: `Please sign in before purchasing ${purpose === "kit" ? "the Gigolo Kit" : "Profile Boost"}.` }, { status: 401 });
    if (purpose === "kit" && member.kitPurchased) return NextResponse.json({ error: "Your account already has premium access." }, { status: 409 });
    if (purpose.startsWith("boost_") && !member.kitPurchased) return NextResponse.json({ error: "Profile Boost is available with the Gigolo Kit." }, { status: 403 });
    ({ name, username, contact, city } = member);
  } else {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^[+\d][\d\s-]{7,}$/.test(contact);
    if (name.length < 2 || city.length < 2 || (!isEmail && !isPhone)) return NextResponse.json({ error: "Please enter your government-ID first name, city, and a valid email or phone number." }, { status: 400 });
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return NextResponse.json({ error: "Choose a username with 3 to 24 letters, numbers, or underscores." }, { status: 400 });
    if (getMemberByUsername(username)) return NextResponse.json({ error: "That username is already taken. Please choose another one." }, { status: 409 });
    if (getMemberByContact(contact)) return NextResponse.json({ error: "An account with this email or phone number already exists. Please sign in." }, { status: 409 });
  }

  const orderId = `tg_${randomUUID()}`;
  const checkoutSecret = randomBytes(32).toString("base64url");

  try {
    createPendingPayment({ orderId, name, username: purpose === "joining" ? username : null, contact, city, amount, currency: "XTR", purpose, checkoutSecretHash: checkoutSecretHash(checkoutSecret) });
    await recordPaymentOrder({ orderId, name, username: purpose === "joining" ? username : null, contact, city, amount, currency: "XTR", purpose });
    const invoiceUrl = await createTelegramInvoice({ orderId, purpose, amount });
    return NextResponse.json({ orderId, amount, currency: "XTR", invoiceUrl, checkoutSecret, purpose });
  } catch (error) {
    console.error("Telegram invoice creation failed", error);
    return NextResponse.json({ error: "We could not prepare your secure payment record. Please try again in a moment." }, { status: 503 });
  }
}
