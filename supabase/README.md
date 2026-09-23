# Supabase application data

Run every file in `migrations/` in filename order once in the Supabase SQL Editor before deploying this version.

The Telegram Stars migration is `20260923000006_telegram_stars_payments.sql`. After deployment, register the public HTTPS webhook with `npm run telegram:webhook -- https://your-domain.example`.

It creates private tables for member profiles, sign-in readiness, payment history, Kit delivery status, Boost credit history, member-to-client conversations, and the companion directory. `member_profiles` is the application user table: it holds safe profile data entered during signup (legal first name, username, email, city), profile preferences, and photo references. Passwords stay exclusively in Supabase Auth (`auth.users`), and no access token, card data, or payment secret is stored here. `payment_transactions.payment_type` makes the three charge categories explicit: `signup`, `kit`, and `boost`. The app writes these tables only from server routes using `SUPABASE_SERVICE_ROLE_KEY`.

## Companion directory

`companion_profiles` is the source for `/browse`. Add verified companion aliases, city, tags, availability, and private photo paths there. Companion media belongs in the private `companion-profile-media` Storage bucket created by the migration. The `/api/companions` server route makes short-lived media URLs only for profiles the signed-in member may see; PRISM-exclusive paths are never returned to standard members.

## Client messaging

After applying `20260923000004_member_client_messages.sql`, an administrator can add a private client record to `public.clients` and connect it to a Gigolo member’s Supabase UUID through `public.member_client_links.member_profile_id`. The linked member will then see that client in `/messages`; the app never fabricates client records.

```sql
-- Run only from an administrator-controlled Supabase SQL session.
insert into public.clients (display_name, username, city)
values ('Client alias', 'client-alias', 'Delhi')
returning id;

-- Use the returned client UUID and the member_profiles.id (Gigolo member UUID).
insert into public.member_client_links (member_profile_id, client_id)
values ('MEMBER_PROFILE_UUID', 'CLIENT_UUID');
```

The link trigger creates one private conversation. For a PRISM member, its first message is a one-time Premium Kit recommendation. A database uniqueness key prevents duplicates from repeat imports. All messaging tables have RLS enabled and are revoked from browser roles; the app routes verify the current member before reading or sending a message.
