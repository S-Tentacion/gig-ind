# Supabase application data

Run every file in `migrations/` in filename order once in the Supabase SQL Editor before deploying this version. The final CoinGate migration sets the payment provider default to `coingate`, restores INR-only catalog accounting, and removes obsolete provider-specific profile fields.

The migrations create private tables for member profiles, sign-in readiness, payment history, Kit delivery status, Boost credit history, member-to-client conversations, and the companion directory. Passwords stay exclusively in Supabase Auth (`auth.users`). No access token, card data, wallet detail, or payment secret is stored in these tables. Server routes write private records with `SUPABASE_SERVICE_ROLE_KEY`.

## Companion directory

`companion_profiles` is the source for `/browse`. Add verified companion aliases, city, tags, availability, and private photo paths there. Companion media belongs in the private `companion-profile-media` Storage bucket. The server creates short-lived media URLs only for profiles the signed-in member may see.

## Client messaging

Administrators can connect private client records to a member through `member_client_links.member_profile_id`. The link trigger creates one private conversation, protected by database uniqueness and server-side access checks.
