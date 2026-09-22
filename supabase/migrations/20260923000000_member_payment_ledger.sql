-- Apply this migration in the Supabase SQL Editor or with `supabase db push`.
-- These tables are intentionally private: the Next.js server writes through the
-- service-role key after it verifies a Razorpay payment server-side.

begin;

create extension if not exists pgcrypto;

create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  legal_first_name text not null,
  email text not null,
  city text not null,
  bio text not null default ''
    constraint member_profiles_bio_length_check check (char_length(bio) <= 500),
  profile_visibility text not null default 'private'
    constraint member_profiles_profile_visibility_check check (profile_visibility in ('private', 'members')),
  email_updates boolean not null default true,
  -- Stores only image references/paths, never image binary data.
  profile_images jsonb not null default '[]'::jsonb
    constraint member_profiles_profile_images_array_check check (jsonb_typeof(profile_images) = 'array'),
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  sign_in_status text not null default 'pending_password'
    check (sign_in_status in ('pending_password', 'ready', 'suspended')),
  membership_status text not null default 'standard'
    check (membership_status in ('standard', 'prism')),
  kit_status text not null default 'not_purchased'
    check (kit_status in ('not_purchased', 'order_placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  kit_purchased_at timestamptz,
  boost_credits integer not null default 0 check (boost_credits >= 0),
  boost_expires_at timestamptz,
  last_sign_in_at timestamptz,
  signup_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.member_profiles is
  'Private application member profile. Authentication credentials remain only in auth.users.';

create unique index if not exists member_profiles_username_lower_key
  on public.member_profiles (lower(username));
create unique index if not exists member_profiles_email_lower_key
  on public.member_profiles (lower(email));

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  member_contact text not null,
  member_username text,
  city text,
  provider text not null default 'razorpay',
  provider_order_id text not null unique,
  provider_payment_id text,
  payment_type text not null check (payment_type in ('signup', 'kit', 'boost')),
  purpose text not null check (purpose in ('joining', 'kit', 'boost')),
  boost_credits integer not null default 0 check (boost_credits >= 0),
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'created'
    check (status in ('created', 'verified', 'failed', 'refunded')),
  created_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists payment_transactions_provider_payment_id_key
  on public.payment_transactions (provider_payment_id)
  where provider_payment_id is not null;
create index if not exists payment_transactions_auth_user_created_idx
  on public.payment_transactions (auth_user_id, created_at desc);
create index if not exists payment_transactions_contact_created_idx
  on public.payment_transactions (lower(member_contact), created_at desc);

create table if not exists public.kit_orders (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  payment_transaction_id uuid not null unique references public.payment_transactions(id) on delete restrict,
  destination_city text not null,
  status text not null default 'order_placed'
    check (status in ('order_placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  ordered_at timestamptz not null default timezone('utc', now()),
  status_updated_at timestamptz not null default timezone('utc', now()),
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists kit_orders_auth_user_status_idx
  on public.kit_orders (auth_user_id, status);

create table if not exists public.boost_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  payment_transaction_id uuid references public.payment_transactions(id) on delete restrict,
  delta integer not null,
  reason text not null check (reason in ('purchase', 'activation', 'adjustment', 'refund')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (payment_transaction_id, reason)
);

create index if not exists boost_credit_ledger_auth_user_created_idx
  on public.boost_credit_ledger (auth_user_id, created_at desc);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists member_profiles_set_updated_at on public.member_profiles;
create trigger member_profiles_set_updated_at
before update on public.member_profiles
for each row execute function public.set_row_updated_at();

drop trigger if exists kit_orders_set_updated_at on public.kit_orders;
create trigger kit_orders_set_updated_at
before update on public.kit_orders
for each row execute function public.set_row_updated_at();

alter table public.member_profiles enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.kit_orders enable row level security;
alter table public.boost_credit_ledger enable row level security;

-- No browser roles can read or mutate financial or account-status records.
-- The Supabase service role used only on the server bypasses RLS.
revoke all on public.member_profiles from anon, authenticated;
revoke all on public.payment_transactions from anon, authenticated;
revoke all on public.kit_orders from anon, authenticated;
revoke all on public.boost_credit_ledger from anon, authenticated;

commit;
