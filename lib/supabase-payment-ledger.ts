import { createSupabaseAdminClient } from "@/lib/paid-account";
import { normaliseContact, type Member, type PaymentPurpose } from "@/lib/db";

type PaymentRecord = {
  orderId: string;
  paymentId?: string | null;
  name: string;
  username: string | null;
  contact: string;
  city: string;
  amount: number;
  currency?: string;
  purpose: PaymentPurpose;
};

type VerifiedPaymentInput = {
  payment: PaymentRecord;
  member: Member;
  authUserId: string;
  signInStatus?: "pending_password" | "ready";
};

function paymentPurpose(purpose: PaymentPurpose) {
  return purpose.startsWith("boost_") ? "boost" : purpose;
}

function paymentType(purpose: PaymentPurpose) {
  if (purpose === "joining") return "signup";
  return purpose.startsWith("boost_") ? "boost" : "kit";
}

function purchasedBoostCredits(purpose: PaymentPurpose) {
  return purpose.startsWith("boost_") ? Number(purpose.slice("boost_".length)) : 0;
}

function paymentRow(payment: PaymentRecord) {
  return {
    provider: payment.currency === "XTR" ? "telegram" : "razorpay",
    provider_order_id: payment.orderId,
    member_contact: normaliseContact(payment.contact),
    member_username: payment.username?.trim() || null,
    city: payment.city.trim() || null,
    payment_type: paymentType(payment.purpose),
    purpose: paymentPurpose(payment.purpose),
    boost_credits: purchasedBoostCredits(payment.purpose),
    amount_paise: payment.amount,
    currency: payment.currency || "INR",
  };
}

function ledgerError(code: string) {
  return new Error(code);
}

/**
 * The private `member_profiles` table mirrors safe application profile data.
 * Passwords, authentication tokens, and payment secrets stay in their own
 * systems and must never be included in this row.
 */
function memberProfileRow(member: Member, authUserId: string) {
  return {
    id: authUserId,
    username: member.username,
    legal_first_name: member.name,
    email: normaliseContact(member.contact),
    city: member.city,
    bio: member.bio,
    profile_visibility: member.profileVisibility,
    email_updates: member.emailUpdates,
    // Only public/private storage references are written here, never image data.
    profile_images: member.profileImages,
    membership_status: member.kitPurchased ? "prism" : "standard",
    boost_credits: member.boostCredits,
    boost_expires_at: member.boostExpiresAt,
  };
}

async function findMemberProfileId(member: Member) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("member_profiles")
    .select("id")
    .eq("email", normaliseContact(member.contact))
    .maybeSingle();
  if (error || !data?.id) throw ledgerError("SUPABASE_MEMBER_PROFILE_NOT_FOUND");
  return data.id;
}

/**
 * Mirrors the member's editable signup/profile fields without touching Kit
 * delivery status, sign-in readiness, or other operational account state.
 */
export async function syncMemberProfile({ member, authUserId }: { member: Member; authUserId?: string }) {
  const id = authUserId ?? await findMemberProfileId(member);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("member_profiles").upsert(memberProfileRow(member, id), { onConflict: "id" });
  if (error) throw ledgerError("SUPABASE_MEMBER_PROFILE_SYNC_FAILED");
}

export async function linkTelegramMemberProfile({ authUserId, telegramUserId, telegramUsername }: { authUserId: string; telegramUserId: string; telegramUsername?: string }) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("member_profiles").update({ telegram_user_id: telegramUserId, telegram_username: telegramUsername?.trim() || null }).eq("id", authUserId);
  if (error) throw ledgerError("SUPABASE_TELEGRAM_LINK_FAILED");
}

/** Saves a provider order before checkout is opened. No payment credentials or passwords are stored. */
export async function recordPaymentOrder(payment: PaymentRecord) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("payment_transactions").upsert(
    { ...paymentRow(payment), status: "created" },
    { onConflict: "provider_order_id" },
  );
  if (error) throw ledgerError("SUPABASE_PAYMENT_ORDER_WRITE_FAILED");
}

/**
 * Records a verified payment and the member state it grants. Each table has a
 * provider/order unique constraint, so duplicate provider webhooks are safe.
 */
export async function recordVerifiedPayment({ payment, member, authUserId, signInStatus }: VerifiedPaymentInput) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: transaction, error: transactionError } = await admin
    .from("payment_transactions")
    .upsert(
      {
        ...paymentRow(payment),
        auth_user_id: authUserId,
        provider_payment_id: payment.paymentId || null,
        status: "verified",
        verified_at: now,
        metadata: { verified_by: "server" },
      },
      { onConflict: "provider_order_id" },
    )
    .select("id")
    .single();
  if (transactionError || !transaction?.id) throw ledgerError("SUPABASE_PAYMENT_VERIFICATION_WRITE_FAILED");

  const profile: Record<string, unknown> = {
    ...memberProfileRow(member, authUserId),
    account_status: "active",
  };
  // Omitting this on a webhook-created record lets the database default to
  // pending_password without ever overwriting a later ready status.
  if (payment.purpose === "joining") {
    profile.signup_completed_at = now;
    if (signInStatus) profile.sign_in_status = signInStatus;
  }
  if (payment.purpose === "kit") {
    profile.kit_status = "order_placed";
    profile.kit_purchased_at = now;
  }

  const { error: profileError } = await admin.from("member_profiles").upsert(profile, { onConflict: "id" });
  if (profileError) throw ledgerError("SUPABASE_MEMBER_STATUS_WRITE_FAILED");

  if (payment.purpose === "kit") {
    const { error: kitOrderError } = await admin.from("kit_orders").upsert(
      {
        auth_user_id: authUserId,
        payment_transaction_id: transaction.id,
        destination_city: member.city,
        status: "order_placed",
        ordered_at: now,
        status_updated_at: now,
      },
      { onConflict: "payment_transaction_id" },
    );
    if (kitOrderError) throw ledgerError("SUPABASE_KIT_STATUS_WRITE_FAILED");
  }

  const credits = purchasedBoostCredits(payment.purpose);
  if (credits > 0) {
    const { error: boostLedgerError } = await admin.from("boost_credit_ledger").upsert(
      {
        auth_user_id: authUserId,
        payment_transaction_id: transaction.id,
        delta: credits,
        reason: "purchase",
      },
      { onConflict: "payment_transaction_id,reason" },
    );
    if (boostLedgerError) throw ledgerError("SUPABASE_BOOST_LEDGER_WRITE_FAILED");
  }
}

export async function recordFailedPayment(orderId: string, paymentId?: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("payment_transactions")
    .update({ status: "failed", provider_payment_id: paymentId || null })
    .eq("provider_order_id", orderId)
    .eq("status", "created");
  if (error) throw ledgerError("SUPABASE_PAYMENT_FAILURE_WRITE_FAILED");
}

export async function recordSuccessfulSignIn({ authUserId, member }: { authUserId: string; member: Member }) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("member_profiles").upsert(
    {
      ...memberProfileRow(member, authUserId),
      sign_in_status: "ready",
      last_sign_in_at: now,
    },
    { onConflict: "id" },
  );
  if (error) throw ledgerError("SUPABASE_SIGN_IN_STATUS_WRITE_FAILED");
}

export async function markPasswordReady(authUserId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("member_profiles")
    .update({ sign_in_status: "ready" })
    .eq("id", authUserId);
  if (error) throw ledgerError("SUPABASE_SIGN_IN_STATUS_WRITE_FAILED");
}

export async function recordBoostActivation({ authUserId, boostCredits, boostExpiresAt }: { authUserId: string; boostCredits: number; boostExpiresAt: string | null }) {
  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin.from("member_profiles")
    .update({ boost_credits: boostCredits, boost_expires_at: boostExpiresAt })
    .eq("id", authUserId);
  if (profileError) throw ledgerError("SUPABASE_BOOST_STATUS_WRITE_FAILED");

  const { error: ledgerErrorResult } = await admin.from("boost_credit_ledger").insert({
    auth_user_id: authUserId,
    delta: -1,
    reason: "activation",
  });
  if (ledgerErrorResult) throw ledgerError("SUPABASE_BOOST_LEDGER_WRITE_FAILED");
}
