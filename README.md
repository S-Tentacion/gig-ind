# Gigolo India — College Project POC

Gigolo India is a Next.js proof of concept for a privacy-focused, adult-only companion-discovery interface. It uses a local SQLite database for accounts and Razorpay Standard Checkout in **test mode** for the joining-fee flow.

## Supabase authentication

Sign-up is completed only after payment verification. The chosen password is sent directly to Supabase Auth and is never written to the application tables. Members then sign in with email and password.

1. Create a Supabase project and copy its Project URL and publishable key from **Project Settings → API**.
2. Add these values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. In **Authentication → Providers → Email**, enable email/password sign-in. Email confirmation can be disabled for the payment-confirmed password flow, since the server creates the account only after a verified payment.

The application uses Supabase Auth’s server-verified email/password sign-in. The server stores only the short-lived app session cookies and private profile/payment data; it never stores a plaintext password, token, or payment credential.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` for local development. In Vercel, set the same values in **Project → Settings → Environment Variables**.

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase **Project Settings → API**; browser-safe.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase **Project Settings → API**; server-only and required for private profiles, payments, companion listings, and messaging.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` — Razorpay **Account & Settings → API Keys**; the secret is server-only.
- `RAZORPAY_WEBHOOK_SECRET` — choose it when creating the Razorpay webhook; server-only.
- `CRON_SECRET` — create a 32-byte random value yourself for Vercel Cron authorization; server-only.
- `NEXT_PUBLIC_SITE_URL` — your final site URL, e.g. `https://gig-ind.vercel.app`.

## Razorpay test configuration

## Supabase payment and account data

Run every SQL file in [`supabase/migrations/`](supabase/migrations) in filename order in the Supabase SQL Editor before using payment flows in this version. It creates private tables for:

- `member_profiles` — the private application user table, with safe signup/profile data (legal first name, username, email, city, preferences, and image references), sign-in readiness, membership level, Kit status, and Boost balance. Passwords remain only in Supabase Auth.
- `payment_transactions` — every created, verified, failed, or refunded payment order, categorized as `signup`, `kit`, or `boost`.
- `kit_orders` — the current Kit delivery status and destination city.
- `boost_credit_ledger` — purchased and used Boost credits.

The server records a Razorpay order before Checkout opens, then updates it only after server-side signature verification or a verified webhook. Add `SUPABASE_SERVICE_ROLE_KEY` to local and deployed server environment variables; never expose that key to the browser.

1. In the Razorpay Dashboard, enable **Test Mode**.
2. Generate an API key pair from **Account & Settings → API Keys**.
3. Add the values to `.env.local`:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

The key secret is server-only. Do not place it in browser code, commit it, or share it.

The app creates a fresh ₹1,500 order on the server, opens Razorpay Checkout, and verifies Razorpay’s returned signature before creating the local member account. This mirrors Razorpay’s recommended Standard Checkout sequence: [create an order server-side and verify the payment signature server-side](https://razorpay.com/docs/developer-tools/integrations/standard-checkout/).

## Profile-photo POC flow

Registration requires 3–5 profile photos before the checkout button can be used. The server accepts JPG, PNG, or WebP files up to 5 MB each. After a payment signature is verified, the selected photos are saved to `public/uploads/`, their paths are stored on the local member record, and the first photo is used in the member’s PRISM banner. This is local development storage only: Vercel’s filesystem is not durable, so a real deployment should use private object storage (such as Supabase Storage) with authenticated upload policies.

## Member and premium POC flow

1. A member signs in with the email address and password chosen during paid registration. Supabase Auth verifies the password and the app writes HTTP-only session cookies.
2. A signed-in standard member sees their name, city, and plan in the profile popover, plus an animated Gigolo Kit banner and marquee.
3. The Kit CTA opens `/buy`, which creates a separate Razorpay **test-mode** ₹10,000 order for the signed-in account.
4. After server-side signature verification, the app saves `kit_purchased` for that member and changes their home into the colorful **PRISM** premium experience with its own logo treatment.
5. Premium members can purchase Profile Boost credit packs through the same Razorpay **test-mode** order-and-signature-verification flow: ₹1,000 for one one-hour Boost credit, ₹2,500 for three credits, or ₹5,000 for seven credits. A credit starts one hour of saved PRISM visual state; it does not promise visibility, placement, bookings, income, or any other outcome.

The Kit is a visual college-project POC. It does not promise ranking, popularity, earnings, bookings, or any other real-world outcome.

## POC activity feed

The homepage includes a **classroom activity simulation** every 15 seconds to demonstrate animated toast behavior. It is not a record of real members. Separately, actual accounts created through the local database can produce anonymous live join events.

## Important POC limitations

- Razorpay is configured for test mode only; no real money is collected.
- Sign-in uses Supabase email/password authentication. Enable the Email provider in your Supabase project before testing it.
- SQLite is local to the running project. Use managed storage and proper session security before deployment.
- The session cookies contain Supabase session tokens with secure, HTTP-only cookie options in production. The legacy SQLite data remains a local cache; Supabase migrations must be applied for durable member, payment, companion, and messaging data.
- The product is strictly for adults aged 18 and over.
