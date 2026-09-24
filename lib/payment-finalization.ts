import { finalisePayment, type PendingPayment } from "@/lib/db";
import { linkPaidOrderToAuth } from "@/lib/paid-account";
import { recordVerifiedPayment } from "@/lib/supabase-payment-ledger";
import { coingateAmount } from "@/lib/coingate";

export async function finaliseVerifiedOrder(payment: PendingPayment, providerPaymentId: string) {
  const member = finalisePayment({ orderId: payment.orderId, paymentId: providerPaymentId });
  const authUser = await linkPaidOrderToAuth(member, payment.orderId);
  await recordVerifiedPayment({ payment: { ...payment, amount: coingateAmount(payment.purpose), currency: "INR", paymentId: providerPaymentId, provider: "coingate" }, member, authUserId: authUser.id });
  return { member, authUser };
}
