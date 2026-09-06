# Gigolo India — College Project POC

Gigolo India is a Next.js proof of concept for a privacy-focused, adult-only companion-discovery interface. It uses a local SQLite database for accounts and Razorpay Standard Checkout in **test mode** for the joining-fee flow.

## Supabase passwordless authentication

Sign-up and sign-in are handled by Supabase Auth with an email or SMS verification code—there are no passwords and no OAuth providers in this POC.

1. Create a Supabase project and copy its Project URL and publishable key from **Project Settings → API**.
2. Add these values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

3. In Supabase Auth, enable Email and/or Phone. Configure your email template to include the OTP token, and configure an SMS provider before testing phone delivery.

After Razorpay test checkout creates the local POC membership, `/api/auth/signup` sends email members a Supabase magic link and sends phone members an SMS verification code. The email link opens `/auth/callback`, where its one-time code is exchanged for a Supabase session and the member is redirected to the homepage with their profile visible in the navbar. `/api/auth/login` sends a code for an existing account and `/api/auth/verify` validates it and creates the secure app session. Add `https://your-domain/auth/callback` (and `http://localhost:3000/auth/callback` locally) to Supabase Auth’s allowed redirect URLs. The implementation follows Supabase’s documented [auth-code session exchange](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession) and [OTP verification](https://supabase.com/docs/guides/auth/phone-login) flows.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

## Razorpay test configuration

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

1. A member signs in using the email address or phone number stored at registration. The POC sets a local, HTTP-only session cookie.
2. A signed-in standard member sees their name, city, and plan in the profile popover, plus an animated Gigolo Kit banner and marquee.
3. The Kit CTA opens `/buy`, which creates a separate Razorpay **test-mode** ₹10,000 order for the signed-in account.
4. After server-side signature verification, the app saves `kit_purchased` for that member and changes their home into the colorful **PRISM** premium experience with its own logo treatment.
5. Premium members can purchase Profile Boost credit packs through the same Razorpay **test-mode** order-and-signature-verification flow: ₹1,000 for one one-hour Boost credit, ₹2,500 for three credits, or ₹5,000 for seven credits. A credit starts one hour of saved PRISM visual state; it does not promise visibility, placement, bookings, income, or any other outcome.

The Kit is a visual college-project POC. It does not promise ranking, popularity, earnings, bookings, or any other real-world outcome.

## POC activity feed

The homepage includes a **classroom activity simulation** every 15 seconds to demonstrate animated toast behavior. It is not a record of real members. Separately, actual accounts created through the local database can produce anonymous live join events.

## Important POC limitations

- Razorpay is configured for test mode only; no real money is collected.
- Sign-in requires a Supabase verification code. Configure email/SMS delivery in your Supabase project before testing it.
- SQLite is local to the running project. Use managed storage and proper session security before deployment.
- The session cookie stores only a local POC member ID; production authentication must use signed, rotating sessions and OTP or password verification.
- The product is strictly for adults aged 18 and over.
