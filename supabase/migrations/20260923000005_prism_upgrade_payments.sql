-- Provider-neutral PRISM upgrade ledger. Apply with `supabase db push` or in
-- the Supabase SQL Editor before replacing the client-side payment stub.

create extension if not exists pgcrypto;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  provider text,
  provider_order_id text,
  provider_payment_id text unique,
  provider_signature text,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created',
  purpose text not null default 'prism_upgrade',
  source text,
  created_at timestamptz default now(),
  verified_at timestamptz
);

create index if not exists idx_payments_user_id on public.payments(user_id);

alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
