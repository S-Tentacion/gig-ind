import { createHash, timingSafeEqual } from "node:crypto";
import type { PaymentPurpose } from "@/lib/db";

export const COINGATE_PRICES = {
  joining: 1500,
  kit: 10000,
  boostCredit: 1000,
} as const;

export type CoinGateOrder = {
  id: number;
  order_id: string;
  status: string;
  price_amount: string;
  price_currency: string;
  payment_url?: string;
  token?: string;
};

export function coingateAmount(purpose: PaymentPurpose) {
  return purpose === "kit" ? COINGATE_PRICES.kit : purpose.startsWith("boost_") ? Number(purpose.slice(6)) * COINGATE_PRICES.boostCredit : COINGATE_PRICES.joining;
}

export function coingatePriceCurrency() {
  return (process.env.COINGATE_PRICE_CURRENCY || "USD").trim().toUpperCase();
}

export async function coingateCheckoutPrice(purpose: PaymentPurpose) {
  const catalogAmountInr = coingateAmount(purpose);
  const currency = coingatePriceCurrency();
  if (currency === "INR") return { amount: catalogAmountInr, currency, catalogAmountInr };
  const rate = Number(await coingateApi<string>(`/rates/merchant/INR/${encodeURIComponent(currency)}`));
  if (!Number.isFinite(rate) || rate <= 0) throw new Error(`CoinGate does not provide an INR/${currency} checkout rate.`);
  return { amount: Math.max(0.01, Math.round(catalogAmountInr * rate * 100) / 100), currency, catalogAmountInr };
}

export function coingateTitle(purpose: PaymentPurpose) {
  if (purpose === "joining") return "Standard Membership";
  if (purpose === "kit") return "PRISM Premium Membership";
  const credits = Number(purpose.slice(6));
  return `${credits} Profile Boost ${credits === 1 ? "Credit" : "Credits"}`;
}

export function coingateDescription(purpose: PaymentPurpose) {
  if (purpose === "joining") return "Activate your Gigolo India Standard membership.";
  if (purpose === "kit") return "Unlock lifetime PRISM Premium access for your member account.";
  return "Add Profile Boost credits to your PRISM member account.";
}

export function checkoutSecretHash(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function validCheckoutSecret(secret: string, expectedHash: string | null) {
  if (!secret || !expectedHash) return false;
  const actual = checkoutSecretHash(secret);
  return actual.length === expectedHash.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expectedHash));
}

export function coingateApiBase() {
  const override = process.env.COINGATE_API_BASE_URL?.trim().replace(/\/$/, "");
  if (override) return override;
  return process.env.COINGATE_ENV === "live" ? "https://api.coingate.com/api/v2" : "https://api-sandbox.coingate.com/api/v2";
}

export async function coingateApi<T>(path: string, init: RequestInit = {}) {
  const token = process.env.COINGATE_API_TOKEN?.trim();
  if (!token) throw new Error("COINGATE_NOT_CONFIGURED");
  const response = await fetch(`${coingateApiBase()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Token ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  let result: unknown;
  try { result = text ? JSON.parse(text) : {}; } catch { result = { message: text }; }
  if (!response.ok) {
    const detail = result as { message?: string; reason?: string; error?: string };
    throw new Error(detail.message || detail.reason || detail.error || `CoinGate request failed (${response.status}).`);
  }
  return result as T;
}

export function getCoinGateOrder(id: string) {
  return coingateApi<CoinGateOrder>(`/orders/${encodeURIComponent(id)}`);
}
