begin;

alter table public.payment_transactions
  drop constraint if exists payment_transactions_currency_check;

alter table public.payment_transactions
  add constraint payment_transactions_currency_check
  check (currency ~ '^[A-Z0-9_]{3,20}$');

alter table public.payment_transactions
  alter column provider set default 'coingate';

alter table public.member_profiles
  drop column if exists telegram_user_id,
  drop column if exists telegram_username;

comment on column public.payment_transactions.amount_paise is
  'CoinGate checkout price in the smallest unit of price_currency. CoinGate handles the selected payment cryptocurrency.';

commit;
