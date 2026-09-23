begin;

alter table public.member_profiles
  add column if not exists telegram_user_id text,
  add column if not exists telegram_username text;

create unique index if not exists member_profiles_telegram_user_id_key
  on public.member_profiles (telegram_user_id)
  where telegram_user_id is not null;

comment on column public.member_profiles.telegram_user_id is
  'Verified Telegram user id linked through a signed Login Widget callback or successful Telegram payment.';

commit;
