export type CoinGateCheckoutOrder = { orderId: string; checkoutSecret: string; paymentUrl: string; amount: number; currency: string; error?: string };

export function openCoinGateWindow() {
  const popup = window.open("about:blank", "coingate-payment");
  if (popup) {
    popup.opener = null;
    popup.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Preparing secure CoinGate checkout…</p>';
  }
  return popup;
}

export async function createCoinGateOrder(body: Record<string, unknown>, popup?: Window | null) {
  const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const order = await response.json() as CoinGateCheckoutOrder;
  if (!response.ok || !order.orderId || !order.checkoutSecret || !order.paymentUrl) {
    popup?.close();
    throw new Error(order.error || "We could not start CoinGate checkout.");
  }
  if (popup) popup.location.replace(order.paymentUrl);
  else openCoinGateCheckout(order.paymentUrl);
  return order;
}

export function openCoinGateCheckout(paymentUrl: string) {
  window.location.assign(paymentUrl);
}

export async function waitForCoinGatePayment(order: Pick<CoinGateCheckoutOrder, "orderId" | "checkoutSecret">, timeoutMs = 20 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch("/api/payments/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order), cache: "no-store" });
    const result = await response.json() as { status?: string; paymentId?: string; error?: string };
    if (!response.ok) throw new Error(result.error || "We could not check the payment status.");
    if (result.status === "verified" && result.paymentId) return result.paymentId;
    if (["failed", "refunded", "canceled", "expired", "invalid"].includes(result.status || "")) throw new Error("This CoinGate payment was not completed.");
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
  }
  throw new Error("Payment confirmation timed out. If you paid, refresh this page in a moment or contact support with your CoinGate order reference.");
}
