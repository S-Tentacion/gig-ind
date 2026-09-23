begin;

alter table public.payment_transactions
  drop constraint if exists payment_transactions_currency_check;

alter table public.payment_transactions
  add constraint payment_transactions_currency_check
  check (currency in ('INR', 'XTR'));

alter table public.payment_transactions
  alter column provider set default 'telegram';

comment on column public.payment_transactions.amount_paise is
  'Provider amount in the smallest provider unit: paise for INR, whole Stars for XTR.';

commit;
