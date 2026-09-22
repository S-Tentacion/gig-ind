-- Private member-to-client messaging.
-- Apply after the member payment/profile migrations. These tables are written
-- only through authenticated server routes that use the Supabase service role.
-- A client is provisioned by an administrator, then linked to a member profile.

begin;

create extension if not exists pgcrypto;

-- Administrators add client records here. Contact details deliberately do not
-- live in this table: member-facing APIs expose only the safe display fields.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  username text,
  city text,
  status text not null default 'active'
    check (status in ('active', 'archived', 'blocked')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists clients_username_lower_key
  on public.clients (lower(username))
  where username is not null;

-- This is the explicit, admin-controlled relationship between a Gigolo member
-- (member_profiles.id) and a client. Inserting an active link creates the
-- matching private conversation below.
create table if not exists public.member_client_links (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'archived', 'blocked')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (member_profile_id, client_id)
);

create index if not exists member_client_links_member_status_idx
  on public.member_client_links (member_profile_id, status);
create index if not exists member_client_links_client_status_idx
  on public.member_client_links (client_id, status);

create table if not exists public.member_client_conversations (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  connection_id uuid unique references public.member_client_links(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'archived', 'blocked')),
  member_last_read_at timestamptz,
  client_last_read_at timestamptz,
  last_message_preview text,
  last_sender_kind text
    check (last_sender_kind is null or last_sender_kind in ('member', 'client', 'system')),
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (member_profile_id, client_id)
);

create index if not exists member_client_conversations_member_status_updated_idx
  on public.member_client_conversations (member_profile_id, status, last_message_at desc);

create table if not exists public.member_client_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.member_client_conversations(id) on delete cascade,
  sender_kind text not null check (sender_kind in ('member', 'client', 'system')),
  sender_member_id uuid references public.member_profiles(id) on delete set null,
  sender_client_id uuid references public.clients(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  message_key text,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (sender_kind = 'member' and sender_member_id is not null and sender_client_id is null)
    or (sender_kind = 'client' and sender_client_id is not null and sender_member_id is null)
    or (sender_kind = 'system' and sender_member_id is null and sender_client_id is null)
  )
);

create index if not exists member_client_messages_conversation_created_idx
  on public.member_client_messages (conversation_id, created_at);
create unique index if not exists member_client_messages_message_key_once
  on public.member_client_messages (conversation_id, message_key)
  where message_key is not null;

create or replace function public.validate_member_client_message_sender()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  conversation_member_id uuid;
  conversation_client_id uuid;
begin
  select member_profile_id, client_id
  into conversation_member_id, conversation_client_id
  from public.member_client_conversations
  where id = new.conversation_id;

  if not found then
    raise exception 'Conversation does not exist';
  end if;

  if new.sender_kind = 'member' and new.sender_member_id <> conversation_member_id then
    raise exception 'Member sender is not a conversation participant';
  end if;
  if new.sender_kind = 'client' and new.sender_client_id <> conversation_client_id then
    raise exception 'Client sender is not a conversation participant';
  end if;
  return new;
end;
$$;

create or replace function public.update_member_client_conversation_from_message()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.member_client_conversations
  set
    last_message_preview = left(new.body, 160),
    last_sender_kind = new.sender_kind,
    last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

-- A PRISM member gets a single, clear Kit recommendation at the start of a
-- newly created conversation. message_key and the unique index make this safe
-- if an admin repeats a connection import or a trigger is retried.
create or replace function public.seed_prism_client_intro_message()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.member_client_messages (
    conversation_id,
    sender_kind,
    sender_member_id,
    body,
    message_key
  )
  select
    new.id,
    'member',
    new.member_profile_id,
    'Welcome to PRISM. The Premium Kit is available for a more private, elevated experience with discreet access and thoughtful planning. Let me know if you would like to explore it.',
    'prism_kit_recommendation_v1'
  where exists (
    select 1
    from public.member_profiles profile
    where profile.id = new.member_profile_id
      and profile.membership_status = 'prism'
  )
  and not exists (
    select 1
    from public.member_client_messages message
    where message.conversation_id = new.id
  )
  on conflict do nothing;
  return new;
end;
$$;

create or replace function public.ensure_member_client_conversation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'active' then
    insert into public.member_client_conversations (
      member_profile_id,
      client_id,
      connection_id,
      status
    )
    values (new.member_profile_id, new.client_id, new.id, 'active')
    on conflict (member_profile_id, client_id)
    do update set
      connection_id = excluded.connection_id,
      status = 'active';
  else
    update public.member_client_conversations
    set status = new.status
    where connection_id = new.id;
  end if;
  return new;
end;
$$;

-- If a member becomes PRISM after a client was linked, seed the same welcome
-- text only when that conversation still has no messages, preserving any real
-- conversation that may already have begun.
create or replace function public.seed_prism_intro_for_existing_client_conversations()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.membership_status = 'prism' and old.membership_status is distinct from 'prism' then
    insert into public.member_client_messages (
      conversation_id,
      sender_kind,
      sender_member_id,
      body,
      message_key
    )
    select
      conversation.id,
      'member',
      new.id,
      'Welcome to PRISM. The Premium Kit is available for a more private, elevated experience with discreet access and thoughtful planning. Let me know if you would like to explore it.',
      'prism_kit_recommendation_v1'
    from public.member_client_conversations conversation
    where conversation.member_profile_id = new.id
      and conversation.status = 'active'
      and not exists (
        select 1
        from public.member_client_messages message
        where message.conversation_id = conversation.id
      )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists member_client_links_set_updated_at on public.member_client_links;
create trigger member_client_links_set_updated_at
before update on public.member_client_links
for each row execute function public.set_row_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_row_updated_at();

drop trigger if exists member_client_conversations_set_updated_at on public.member_client_conversations;
create trigger member_client_conversations_set_updated_at
before update on public.member_client_conversations
for each row execute function public.set_row_updated_at();

drop trigger if exists member_client_links_create_conversation on public.member_client_links;
create trigger member_client_links_create_conversation
after insert or update of status on public.member_client_links
for each row execute function public.ensure_member_client_conversation();

drop trigger if exists member_client_conversations_seed_prism_intro on public.member_client_conversations;
create trigger member_client_conversations_seed_prism_intro
after insert on public.member_client_conversations
for each row execute function public.seed_prism_client_intro_message();

drop trigger if exists member_client_messages_validate_sender on public.member_client_messages;
create trigger member_client_messages_validate_sender
before insert or update of sender_kind, sender_member_id, sender_client_id, conversation_id on public.member_client_messages
for each row execute function public.validate_member_client_message_sender();

drop trigger if exists member_client_messages_update_conversation on public.member_client_messages;
create trigger member_client_messages_update_conversation
after insert on public.member_client_messages
for each row execute function public.update_member_client_conversation_from_message();

drop trigger if exists member_profiles_seed_prism_client_intro on public.member_profiles;
create trigger member_profiles_seed_prism_client_intro
after update of membership_status on public.member_profiles
for each row execute function public.seed_prism_intro_for_existing_client_conversations();

-- Backfill conversations for any active client links that existed before this
-- migration was applied. The conversation trigger safely seeds the Kit intro.
insert into public.member_client_conversations (member_profile_id, client_id, connection_id, status)
select member_profile_id, client_id, id, 'active'
from public.member_client_links
where status = 'active'
on conflict (member_profile_id, client_id) do nothing;

alter table public.clients enable row level security;
alter table public.member_client_links enable row level security;
alter table public.member_client_conversations enable row level security;
alter table public.member_client_messages enable row level security;

-- The browser has no direct table access. Routes check the authenticated
-- member and query only their own conversation through the service role.
revoke all on public.clients from anon, authenticated;
revoke all on public.member_client_links from anon, authenticated;
revoke all on public.member_client_conversations from anon, authenticated;
revoke all on public.member_client_messages from anon, authenticated;
revoke all on function public.validate_member_client_message_sender() from public;
revoke all on function public.update_member_client_conversation_from_message() from public;
revoke all on function public.seed_prism_client_intro_message() from public;
revoke all on function public.ensure_member_client_conversation() from public;
revoke all on function public.seed_prism_intro_for_existing_client_conversations() from public;

commit;
