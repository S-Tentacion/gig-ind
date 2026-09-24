import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkoutSecretHash, coingateApi, coingateCheckoutPrice, coingateDescription, coingateTitle, type CoinGateOrder } from "@/lib/coingate";
import { getCurrentMember } from "@/lib/current-member";
import { createPendingPayment, getMemberByContact, getMemberByUsername, type PaymentPurpose } from "@/lib/db";
import { assertPaymentLedgerReady, recordPaymentOrder } from "@/lib/supabase-payment-ledger";

export const runtime = "nodejs";

function publicBase(request: Request) {
  return (process.env.COINGATE_CALLBACK_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

function safeReturnPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function canReceiveCallback(base: string) {
  try {
    const url = new URL(base);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch { return false; }
}

export async function POST(request: Request) {
  if (!process.env.COINGATE_API_TOKEN) return NextResponse.json({ error: "CoinGate payments are not configured yet." }, { status: 503 });

  const body = await request.json() as { kind?: string; name?: string; username?: string; contact?: string; city?: string; boostPack?: number; source?: string; returnPath?: string };
  let purpose: PaymentPurpose = body.kind === "kit" ? "kit" : "joining";
  if (body.kind === "boost") {
    if (!Number.isInteger(body.boostPack) || !body.boostPack || body.boostPack < 1 || body.boostPack > 10) return NextResponse.json({ error: "Choose between 1 and 10 Profile Boost credits." }, { status: 400 });
    purpose = `boost_${body.boostPack}` as PaymentPurpose;
  }

  let name = typeof body.name === "string" ? body.name.trim() : "";
  let username = typeof body.username === "string" ? body.username.trim() : "";
  let contact = typeof body.contact === "string" ? body.contact.trim() : "";
  let city = typeof body.city === "string" ? body.city.trim() : "";
  if (purpose === "kit" || purpose.startsWith("boost_")) {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: `Please sign in before purchasing ${purpose === "kit" ? "PRISM membership" : "Profile Boost"}.` }, { status: 401 });
    if (purpose === "kit" && member.kitPurchased) return NextResponse.json({ error: "Your account already has PRISM access." }, { status: 409 });
    if (purpose.startsWith("boost_") && !member.kitPurchased) return NextResponse.json({ error: "Profile Boost is available with PRISM membership." }, { status: 403 });
    ({ name, username, contact, city } = member);
  } else {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    if (name.length < 2 || city.length < 2 || !isEmail) return NextResponse.json({ error: "Please enter your government-ID first name, city, and a valid email address." }, { status: 400 });
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return NextResponse.json({ error: "Choose a username with 3 to 24 letters, numbers, or underscores." }, { status: 400 });
    if (getMemberByUsername(username)) return NextResponse.json({ error: "That username is already taken. Please choose another one." }, { status: 409 });
    if (getMemberByContact(contact)) return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }

  const orderId = `cg_${randomUUID()}`;
  const checkoutSecret = randomBytes(32).toString("base64url");
  const base = publicBase(request);
  const returnPath = safeReturnPath(body.returnPath);
  const returnUrl = new URL(returnPath, base);
  const source = typeof body.source === "string" ? body.source.slice(0, 80) : null;
  try {
    await assertPaymentLedgerReady();
    const { amount, currency, catalogAmountInr } = await coingateCheckoutPrice(purpose);
    const orderPayload: Record<string, unknown> = {
      order_id: orderId,
      price_amount: amount,
      price_currency: currency,
      receive_currency: process.env.COINGATE_RECEIVE_CURRENCY || "DO_NOT_CONVERT",
      title: coingateTitle(purpose),
      description: coingateDescription(purpose),
      success_url: `${returnUrl.toString()}${returnUrl.search ? "&" : "?"}coingate=success`,
      cancel_url: `${returnUrl.toString()}${returnUrl.search ? "&" : "?"}coingate=cancelled`,
      token: checkoutSecret,
      shopper: { type: "personal", email: contact, first_name: name },
    };
    if (canReceiveCallback(base)) orderPayload.callback_url = `${base}/api/payments/webhook`;
    const coinGateOrder = await coingateApi<CoinGateOrder>("/orders", { method: "POST", body: JSON.stringify(orderPayload) });
    if (!coinGateOrder.id || !coinGateOrder.payment_url) throw new Error("CoinGate did not return a checkout URL.");
    const payment = { orderId, providerOrderId: String(coinGateOrder.id), name, username: purpose === "joining" ? username : null, contact, city, amount, currency, purpose, checkoutSecretHash: checkoutSecretHash(checkoutSecret), provider: "coingate", source };
    createPendingPayment(payment);
    await recordPaymentOrder({ ...payment, amount: catalogAmountInr, currency: "INR" });
    return NextResponse.json({ orderId, amount, currency, paymentUrl: coinGateOrder.payment_url, checkoutSecret, purpose });
  } catch (error) {
    console.error("CoinGate order creation failed", error);
    if (error instanceof Error && error.message === "SUPABASE_PAYMENT_LEDGER_UNAVAILABLE") {
      return NextResponse.json({ error: "Payment records are not configured. Add the matching SUPABASE_SECRET_KEY, restart the server, and try again." }, { status: 503 });
    }
    return NextResponse.json({ error: error instanceof Error && error.message !== "COINGATE_NOT_CONFIGURED" ? error.message : "We could not prepare CoinGate checkout. Please try again in a moment." }, { status: 503 });
  }
}
