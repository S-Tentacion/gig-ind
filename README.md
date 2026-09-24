# Gigolo India — College Project POC

Gigolo India is a Next.js proof of concept for a privacy-focused, adult-only companion discovery interface. It uses Supabase for authentication and private application data, a local SQLite development cache, and CoinGate hosted cryptocurrency checkout for payments.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local`. Never expose the service-role key or CoinGate token to browser code.

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase **Project Settings → API**.
- `SUPABASE_SECRET_KEY`: Supabase server-only `sb_secret_...` key. The legacy `SUPABASE_SERVICE_ROLE_KEY` remains supported as a fallback.
- `NEXT_PUBLIC_SITE_URL`: deployed site URL.
- `COINGATE_ENV`: `sandbox` while testing, then `live` in production.
- `COINGATE_API_TOKEN`: API access token created in the matching CoinGate environment.
- `COINGATE_PRICE_CURRENCY`: supported CoinGate order currency; use `USD` because CoinGate does not accept INR as a merchant price currency.
- `COINGATE_RECEIVE_CURRENCY`: settlement preference, normally `DO_NOT_CONVERT` during sandbox testing.
- `COINGATE_CALLBACK_BASE_URL`: public HTTPS origin CoinGate can call, without a trailing slash.
- `CRON_SECRET`: long random value for Vercel Cron authorization.

## CoinGate configuration

Create a separate sandbox account at <https://sandbox.coingate.com>. In its dashboard open **Integrations → Merchant Tools → API Management**, create an API app, select JSON callback format, and copy its access token into `.env.local`.

CoinGate cannot deliver callbacks to `localhost`. Use a public HTTPS development URL for `COINGATE_CALLBACK_BASE_URL`, or deploy a preview environment. The app keeps its catalog in INR, converts the fixed price to USD with CoinGate's current merchant rate when creating the order, and sends customers to CoinGate's hosted checkout. It grants membership, PRISM access, or Boost credits only after re-fetching a matching order from CoinGate with status `paid`.

Catalog prices are ₹1,500 for Standard membership, ₹10,000 for lifetime PRISM Premium, and ₹1,000 per Boost credit.

## Supabase application data

Run all files in `supabase/migrations/` in filename order using the Supabase SQL Editor. They create private member profiles, payment history, Kit delivery status, Boost credit history, messaging, and the companion directory. Passwords remain only in Supabase Auth. The application tables do not store authentication tokens, CoinGate credentials, or cryptocurrency wallet details.

Registration requires 3–5 JPG, PNG, or WebP profile images of up to 5 MB each. Local uploads are only suitable for development; production should use private object storage with authenticated policies.

The project is strictly for adults aged 18 and over. It does not promise ranking, visibility, bookings, popularity, income, or any other real-world outcome.
