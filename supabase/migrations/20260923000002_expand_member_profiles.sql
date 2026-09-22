-- Adds safe signup and profile fields to installations that already ran the
-- initial payment ledger migration. Passwords, access tokens, and payment
-- secrets must remain in Supabase Auth or the payment provider, never here.

begin;

alter table public.member_profiles
  add column if not exists bio text not null default '',
  add column if not exists profile_visibility text not null default 'private',
  add column if not exists email_updates boolean not null default true,
  add column if not exists profile_images jsonb not null default '[]'::jsonb,
  add column if not exists signup_completed_at timestamptz;

alter table public.member_profiles
  drop constraint if exists member_profiles_bio_length_check;
alter table public.member_profiles
  add constraint member_profiles_bio_length_check
  check (char_length(bio) <= 500);

alter table public.member_profiles
  drop constraint if exists member_profiles_profile_visibility_check;
alter table public.member_profiles
  add constraint member_profiles_profile_visibility_check
  check (profile_visibility in ('private', 'members'));

alter table public.member_profiles
  drop constraint if exists member_profiles_profile_images_array_check;
alter table public.member_profiles
  add constraint member_profiles_profile_images_array_check
  check (jsonb_typeof(profile_images) = 'array');

update public.member_profiles
set signup_completed_at = coalesce(signup_completed_at, created_at)
where signup_completed_at is null;

comment on table public.member_profiles is
  'Private application member profile. Authentication credentials remain only in auth.users.';

commit;
