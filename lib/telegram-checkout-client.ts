export type TelegramOrder = { orderId: string; checkoutSecret: string; invoiceUrl: string; amount: number; currency: "XTR"; error?: string };

export function openTelegramWindow() {
  const popup = window.open("about:blank", "telegram-payment");
  if (popup) {
    popup.opener = null;
    popup.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Preparing secure Telegram checkout…</p>';
  }
  return popup;
}

export async function createTelegramOrder(body: Record<string, unknown>, popup: Window | null) {
  const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const order = await response.json() as TelegramOrder;
  if (!response.ok || !order.orderId || !order.checkoutSecret || !order.invoiceUrl) {
    popup?.close();
    throw new Error(order.error || "We could not start Telegram checkout.");
  }
  if (popup) popup.location.replace(order.invoiceUrl);
  else window.location.href = order.invoiceUrl;
  return order;
}

export async function waitForTelegramPayment(order: Pick<TelegramOrder, "orderId" | "checkoutSecret">, timeoutMs = 10 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch("/api/payments/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order), cache: "no-store" });
    const result = await response.json() as { status?: string; paymentId?: string; error?: string };
    if (!response.ok) throw new Error(result.error || "We could not check the payment status.");
    if (result.status === "verified" && result.paymentId) return result.paymentId;
    if (result.status === "failed" || result.status === "refunded") throw new Error("This Telegram payment was not completed.");
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }
  throw new Error("Payment confirmation timed out. If you paid, refresh this page in a moment or contact support with your Telegram receipt.");
}
