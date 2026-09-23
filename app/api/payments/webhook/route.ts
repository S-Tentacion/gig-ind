import { NextResponse } from "next/server";
import { finalisePayment, getMemberByContact, getMemberByTelegramUserId, getMemberByUsername, getPendingPayment, linkTelegramAccount } from "@/lib/db";
import { linkPaidOrderToAuth } from "@/lib/paid-account";
import { linkTelegramMemberProfile, recordVerifiedPayment } from "@/lib/supabase-payment-ledger";
import { paymentTitle, sendTelegramMessage, telegramApi } from "@/lib/telegram-payments";

export const runtime = "nodejs";

type TelegramUpdate = {
  pre_checkout_query?: { id: string; currency: string; total_amount: number; invoice_payload: string };
  message?: { text?: string; chat: { id: number }; from?: { id: number; username?: string }; successful_payment?: { currency: string; total_amount: number; invoice_payload: string; telegram_payment_charge_id: string } };
};

function siteUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

async function handleCommand(update: TelegramUpdate, request: Request) {
  const message = update.message;
  if (!message?.text?.startsWith("/")) return false;
  const command = message.text.split(/\s|@/)[0].toLowerCase();
  if (command === "/start") await sendTelegramMessage(message.chat.id, "Welcome to Gigolo India Payments. Start checkout on the website, then complete your secure Telegram Stars payment here.");
  else if (command === "/terms") await sendTelegramMessage(message.chat.id, `Terms of Use: ${siteUrl(request)}/terms`);
  else if (command === "/support" || command === "/paysupport") await sendTelegramMessage(message.chat.id, `Payment support: ${siteUrl(request)}/privacy#safety\nTelegram support cannot resolve purchases made through this bot.`);
  else return false;
  return true;
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  const update = await request.json() as TelegramUpdate;
  try {
    if (await handleCommand(update, request)) return NextResponse.json({ received: true });
    const checkout = update.pre_checkout_query;
    if (checkout) {
      const order = getPendingPayment(checkout.invoice_payload);
      const identityAvailable = order?.purpose !== "joining" || (!getMemberByContact(order.contact) && (!order.username || !getMemberByUsername(order.username)));
      const valid = Boolean(order && order.status === "created" && identityAvailable && checkout.currency === "XTR" && checkout.total_amount === order.amount);
      await telegramApi("answerPreCheckoutQuery", { pre_checkout_query_id: checkout.id, ok: valid, ...(!valid ? { error_message: "This payment session is invalid or already completed. Return to the website and start again." } : {}) });
      return NextResponse.json({ received: true });
    }
    const successful = update.message?.successful_payment;
    if (!successful) return NextResponse.json({ received: true });
    const order = getPendingPayment(successful.invoice_payload);
    if (!order || successful.currency !== "XTR" || successful.total_amount !== order.amount) return NextResponse.json({ error: "Payment details do not match the order." }, { status: 400 });
    const newlyVerified = order.status !== "verified";
    const member = finalisePayment({ orderId: order.orderId, paymentId: successful.telegram_payment_charge_id });
    const authUser = await linkPaidOrderToAuth(member, order.orderId);
    await recordVerifiedPayment({ payment: { ...order, paymentId: successful.telegram_payment_charge_id }, member, authUserId: authUser.id });
    if (update.message?.from?.id) {
      const telegramUserId = String(update.message.from.id);
      const existingLink = getMemberByTelegramUserId(telegramUserId);
      if (!existingLink || existingLink.id === member.id) {
        linkTelegramAccount(member.id, telegramUserId, update.message.from.username);
        await linkTelegramMemberProfile({ authUserId: authUser.id, telegramUserId, telegramUsername: update.message.from.username }).catch(() => undefined);
      }
    }
    const confirmation = `✅ Payment confirmed\n${paymentTitle(order.purpose)}\n⭐ ${order.amount} Stars\nReference: ${successful.telegram_payment_charge_id}`;
    if (newlyVerified) await sendTelegramMessage(update.message!.chat.id, `${confirmation}\n\nReturn to the website to finish or refresh your account.`).catch(() => undefined);
    const adminChatId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID;
    if (newlyVerified && adminChatId && String(update.message!.chat.id) !== adminChatId) await sendTelegramMessage(adminChatId, `${confirmation}\nMember: ${order.username || order.name}\nContact: ${order.contact}`).catch(() => undefined);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Telegram webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
