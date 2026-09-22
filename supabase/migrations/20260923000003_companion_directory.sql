-- The companion directory is read by the Next.js server only. It deliberately
-- keeps media paths private; the server creates short-lived signed URLs only
-- for profiles a member is permitted to see.

begin;

create table if not exists public.companion_profiles (
  id uuid primary key default gen_random_uuid(),
  -- A companion can be created by staff before they receive a login.
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 60),
  age smallint not null check (age >= 18 and age <= 100),
  city text not null check (char_length(trim(city)) between 2 and 100),
  vibes text[] not null default '{}'::text[] check (cardinality(vibes) <= 6),
  languages text[] not null default '{}'::text[] check (cardinality(languages) <= 8),
  availability text not null default 'this_week'
    check (availability in ('available_now', 'this_week', 'unavailable')),
  is_prism_exclusive boolean not null default false,
  is_active boolean not null default true,
  is_top_rated boolean not null default false,
  is_fast_reply boolean not null default false,
  is_concierge_favorite boolean not null default false,
  response_time_minutes integer check (response_time_minutes is null or response_time_minutes >= 0),
  meetup_count integer check (meetup_count is null or meetup_count >= 0),
  rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  -- Paths must point to the private companion-profile-media storage bucket.
  primary_photo_path text,
  gallery_photo_paths jsonb not null default '[]'::jsonb
    constraint companion_profiles_gallery_photo_paths_array_check check (jsonb_typeof(gallery_photo_paths) = 'array'),
  sort_rank integer not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.companion_profiles is
  'Private companion directory. Public aliases and listing facts are served through the Next.js API; photo paths are never exposed directly.';

create index if not exists companion_profiles_directory_idx
  on public.companion_profiles (is_active, city, availability, sort_rank desc, created_at desc);
create index if not exists companion_profiles_prism_idx
  on public.companion_profiles (is_prism_exclusive, is_active, sort_rank desc);

drop trigger if exists companion_profiles_set_updated_at on public.companion_profiles;
create trigger companion_profiles_set_updated_at
before update on public.companion_profiles
for each row execute function public.set_row_updated_at();

-- The bucket is private. Uploads and signed URL generation happen on the
-- server with SUPABASE_SERVICE_ROLE_KEY, so raw photo paths never reach
-- non-authorized browsers.
insert into storage.buckets (id, name, public)
values ('companion-profile-media', 'companion-profile-media', false)
on conflict (id) do update set public = false;

alter table public.companion_profiles enable row level security;
revoke all on public.companion_profiles from anon, authenticated;

commit;
