import { createHash, timingSafeEqual } from "node:crypto";
import type { PaymentPurpose } from "@/lib/db";

export const TELEGRAM_STARS = {
  // Fixed catalog prices chosen to target the existing INR revenue at
  // Telegram's published USD 0.013 developer reward per Star. Customer cost
  // varies by platform, region, VAT, and Telegram pricing.
  joining: 1325,
  kit: 8750,
  boostCredit: 875,
} as const;

type TelegramResponse<T> = { ok: boolean; result?: T; description?: string };

export function paymentStars(purpose: PaymentPurpose) {
  return purpose === "kit" ? TELEGRAM_STARS.kit : purpose.startsWith("boost_") ? Number(purpose.slice(6)) * TELEGRAM_STARS.boostCredit : TELEGRAM_STARS.joining;
}

export function paymentTitle(purpose: PaymentPurpose) {
  if (purpose === "joining") return "Standard Membership";
  if (purpose === "kit") return "PRISM Premium";
  const credits = Number(purpose.slice(6));
  return `${credits} Profile Boost ${credits === 1 ? "Credit" : "Credits"}`;
}

export function checkoutSecretHash(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function validCheckoutSecret(secret: string, expectedHash: string | null) {
  if (!secret || !expectedHash) return false;
  const actual = checkoutSecretHash(secret);
  return actual.length === expectedHash.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expectedHash));
}

export async function telegramApi<T>(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_NOT_CONFIGURED");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json() as TelegramResponse<T>;
  if (!response.ok || !result.ok || result.result === undefined) throw new Error(result.description || `TELEGRAM_${method.toUpperCase()}_FAILED`);
  return result.result;
}

export function createTelegramInvoice({ orderId, purpose, amount }: { orderId: string; purpose: PaymentPurpose; amount: number }) {
  return telegramApi<string>("createInvoiceLink", {
    title: paymentTitle(purpose),
    description: purpose === "joining" ? "Activate your Gigolo India Standard membership." : purpose === "kit" ? "Unlock PRISM Premium access for your member account." : "Add Profile Boost credits to your PRISM account.",
    payload: orderId,
    provider_token: "",
    currency: "XTR",
    prices: [{ label: paymentTitle(purpose), amount }],
  });
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  return telegramApi("sendMessage", { chat_id: chatId, text, protect_content: true });
}
