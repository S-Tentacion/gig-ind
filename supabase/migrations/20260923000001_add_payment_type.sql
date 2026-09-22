-- Adds a clear, dashboard-friendly payment category to existing installations.

begin;

alter table public.payment_transactions
  add column if not exists payment_type text;

update public.payment_transactions
set payment_type = case
  when purpose = 'joining' then 'signup'
  when purpose = 'kit' then 'kit'
  when purpose = 'boost' then 'boost'
  else payment_type
end
where payment_type is null;

alter table public.payment_transactions
  alter column payment_type set not null;

alter table public.payment_transactions
  drop constraint if exists payment_transactions_payment_type_check;

alter table public.payment_transactions
  add constraint payment_transactions_payment_type_check
  check (payment_type in ('signup', 'kit', 'boost'));

create index if not exists payment_transactions_type_created_idx
  on public.payment_transactions (payment_type, created_at desc);

commit;
