-- ============================================================================
-- Soluna — one-shot database setup (bootstrap)
-- Paste this entire file into: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- It is the in-order concatenation of supabase/migrations/*.sql and creates every
-- table + row-level-security policy the app needs (birth_profiles, blueprints, etc.).
-- Intended for a fresh project. If you see "already exists" errors, some of it was
-- already applied — tell your developer and they can run 'supabase db push' instead.
-- ============================================================================


-- ====================== 20260625_initial_soluna_schema.sql ======================
-- Soluna initial Supabase schema.
-- Apply from the Supabase SQL editor or with the Supabase CLI.
-- This migration is written to be re-runnable for early setup.

begin;

create extension if not exists pgcrypto;

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, preferred_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'preferred_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  preferred_name text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.birth_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_birth_name text not null,
  birth_date date not null,
  birth_time time,
  time_known boolean not null default true,
  birth_place_label text,
  lat double precision,
  lng double precision,
  timezone text,
  house_system text not null default 'placidus',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint birth_profiles_user_unique unique (user_id),
  constraint birth_profiles_house_system_check check (house_system in ('placidus', 'whole_sign', 'porphyry')),
  constraint birth_profiles_lat_check check (lat is null or lat between -90 and 90),
  constraint birth_profiles_lng_check check (lng is null or lng between -180 and 180)
);

create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  astrology jsonb not null default '{}'::jsonb,
  numerology jsonb not null default '{}'::jsonb,
  chinese jsonb not null default '{}'::jsonb,
  human_design jsonb not null default '{}'::jsonb,
  biorhythm_seed jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blueprints_user_unique unique (user_id)
);

create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.blueprints(id) on delete cascade,
  system text not null,
  key text not null,
  label text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint placements_blueprint_system_key_unique unique (blueprint_id, system, key)
);

create table if not exists public.daily_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reading_date date not null,
  hero_text text not null,
  agreement jsonb not null default '[]'::jsonb,
  affirmation text,
  do_embrace_ease jsonb not null default '{}'::jsonb,
  personal_day integer,
  chinese_daily jsonb,
  tarot_card jsonb,
  soluna_shift jsonb,
  evidence jsonb not null default '[]'::jsonb,
  widget_payload jsonb,
  push_payload jsonb,
  accuracy_level text not null default 'partial',
  missing_inputs text[] not null default '{}',
  confidence_notes text[] not null default '{}',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_readings_user_date_unique unique (user_id, reading_date),
  constraint daily_readings_accuracy_level_check check (accuracy_level in ('exact', 'partial', 'approximate', 'blocked'))
);

create table if not exists public.ask_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ask_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ask_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  systems_referenced text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint ask_messages_role_check check (role in ('user', 'assistant', 'system'))
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null default current_date,
  body text not null,
  mood integer,
  prompt text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_mood_check check (mood is null or mood between 1 and 10)
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  ref_id text not null,
  created_at timestamptz not null default now(),
  constraint saved_items_user_kind_ref_unique unique (user_id, kind, ref_id)
);

create table if not exists public.memory_themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  description text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.focuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  title text,
  problem_text text not null,
  support_mode text not null default 'gentle',
  selected_connection_id uuid,
  selected_bond_id uuid,
  allowed_context jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint focuses_category_check check (category in ('relationship', 'work', 'school', 'big_decision', 'family', 'friendship', 'money', 'self_worth', 'creativity', 'spiritual_growth', 'personal')),
  constraint focuses_support_mode_check check (support_mode in ('gentle', 'clear', 'motivating', 'practical', 'reflective')),
  constraint focuses_status_check check (status in ('active', 'paused', 'resolved', 'archived'))
);

create table if not exists public.focus_guidance (
  id uuid primary key default gen_random_uuid(),
  focus_id uuid not null references public.focuses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  guidance jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  accuracy_level text not null default 'partial',
  confidence_notes text[] not null default '{}',
  generated_at timestamptz not null default now(),
  constraint focus_guidance_accuracy_level_check check (accuracy_level in ('exact', 'partial', 'approximate', 'blocked'))
);

create table if not exists public.focus_checkins (
  id uuid primary key default gen_random_uuid(),
  focus_id uuid not null references public.focuses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_status text not null,
  checkin_text text,
  updated_guidance jsonb,
  created_at timestamptz not null default now(),
  constraint focus_checkins_status_check check (checkin_status in ('better', 'still_unclear', 'harder_than_expected', 'took_the_step', 'not_yet'))
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  birth_date date not null,
  birth_time time,
  birth_place_label text,
  lat double precision,
  lng double precision,
  timezone text,
  blueprint jsonb,
  linked_user_id uuid references public.profiles(id) on delete set null,
  link_status text not null default 'manual',
  lens text not null default 'romance',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_lens_check check (lens in ('romance', 'friendship', 'work', 'family')),
  constraint connections_link_status_check check (link_status in ('manual', 'invited', 'linked', 'archived')),
  constraint connections_lat_check check (lat is null or lat between -90 and 90),
  constraint connections_lng_check check (lng is null or lng between -180 and 180)
);

create table if not exists public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique,
  lens text not null default 'romance',
  invitee_email text,
  status text not null default 'pending',
  accepted_user_id uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_invites_lens_check check (lens in ('romance', 'friendship', 'work', 'family')),
  constraint partner_invites_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create table if not exists public.partner_links (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  lens text not null default 'romance',
  status text not null default 'active',
  a_share_prefs jsonb not null default '{}'::jsonb,
  b_share_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_links_user_pair_unique unique (user_a, user_b),
  constraint partner_links_distinct_users_check check (user_a <> user_b),
  constraint partner_links_lens_check check (lens in ('romance', 'friendship', 'work', 'family')),
  constraint partner_links_status_check check (status in ('active', 'paused', 'unlinked'))
);

create table if not exists public.compatibility_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  link_id uuid references public.partner_links(id) on delete cascade,
  lens text not null default 'romance',
  score integer,
  body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint compatibility_reports_lens_check check (lens in ('romance', 'friendship', 'work', 'family')),
  constraint compatibility_reports_score_check check (score is null or score between 0 and 100)
);

create unique index if not exists compatibility_reports_connection_unique
on public.compatibility_reports (user_id, connection_id, lens)
where connection_id is not null;

create unique index if not exists compatibility_reports_link_unique
on public.compatibility_reports (user_id, link_id, lens)
where link_id is not null;

create table if not exists public.bond_readings (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.partner_links(id) on delete cascade,
  reading_date date not null,
  lens text not null default 'romance',
  body jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  accuracy_level text not null default 'partial',
  confidence_notes text[] not null default '{}',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint bond_readings_link_date_lens_unique unique (link_id, reading_date, lens),
  constraint bond_readings_lens_check check (lens in ('romance', 'friendship', 'work', 'family')),
  constraint bond_readings_accuracy_level_check check (accuracy_level in ('exact', 'partial', 'approximate', 'blocked'))
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  source text not null default 'partner_invite',
  invite_id uuid references public.partner_invites(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  revenuecat_app_user_id text,
  entitlement text not null default 'free',
  status text not null default 'inactive',
  expires_at timestamptz,
  store text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_user_unique unique (user_id),
  constraint subscriptions_revenuecat_app_user_unique unique (revenuecat_app_user_id),
  constraint subscriptions_status_check check (status in ('active', 'inactive', 'expired', 'cancelled', 'grace_period'))
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  kind text not null default 'one_time',
  created_at timestamptz not null default now(),
  constraint purchases_kind_check check (kind in ('one_time', 'subscription'))
);

create table if not exists public.notification_prefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_time time not null default '08:00',
  tz text not null default 'UTC',
  daily_reading boolean not null default true,
  personal_day boolean not null default true,
  moon_alerts boolean not null default true,
  transit_alerts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_prefs_user_unique unique (user_id)
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_token text not null,
  platform text not null default 'ios',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_user_token_unique unique (user_id, expo_token)
);

create table if not exists public.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  spread text not null default 'daily',
  cards jsonb not null default '[]'::jsonb,
  question text,
  interpretation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  system text not null,
  item_key text not null,
  body text not null,
  why text,
  cached boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insights_system_key_unique unique (system, item_key)
);

create table if not exists public.rituals (
  id uuid primary key default gen_random_uuid(),
  moon_phase text not null,
  title text not null,
  body text not null,
  duration_minutes integer,
  premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists birth_profiles_user_idx on public.birth_profiles (user_id);
create index if not exists blueprints_user_idx on public.blueprints (user_id);
create index if not exists placements_blueprint_idx on public.placements (blueprint_id);
create index if not exists placements_system_key_idx on public.placements (system, key);
create index if not exists daily_readings_user_date_idx on public.daily_readings (user_id, reading_date desc);
create index if not exists ask_conversations_user_idx on public.ask_conversations (user_id, created_at desc);
create index if not exists ask_messages_conversation_idx on public.ask_messages (conversation_id, created_at);
create index if not exists journal_entries_user_date_idx on public.journal_entries (user_id, entry_date desc);
create index if not exists saved_items_user_idx on public.saved_items (user_id, created_at desc);
create index if not exists memory_themes_user_idx on public.memory_themes (user_id, enabled);
create index if not exists focuses_user_status_idx on public.focuses (user_id, status, updated_at desc);
create index if not exists focus_guidance_focus_idx on public.focus_guidance (focus_id, generated_at desc);
create index if not exists connections_user_idx on public.connections (user_id, created_at desc);
create index if not exists partner_invites_code_idx on public.partner_invites (invite_code);
create index if not exists partner_links_user_a_idx on public.partner_links (user_a);
create index if not exists partner_links_user_b_idx on public.partner_links (user_b);
create index if not exists bond_readings_link_date_idx on public.bond_readings (link_id, reading_date desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions (user_id, status);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
create index if not exists tarot_readings_user_idx on public.tarot_readings (user_id, created_at desc);
create index if not exists logs_kind_created_idx on public.logs (kind, created_at desc);
create index if not exists logs_user_created_idx on public.logs (user_id, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists set_birth_profiles_updated_at on public.birth_profiles;
create trigger set_birth_profiles_updated_at before update on public.birth_profiles
for each row execute function private.set_updated_at();

drop trigger if exists set_blueprints_updated_at on public.blueprints;
create trigger set_blueprints_updated_at before update on public.blueprints
for each row execute function private.set_updated_at();

drop trigger if exists set_daily_readings_updated_at on public.daily_readings;
create trigger set_daily_readings_updated_at before update on public.daily_readings
for each row execute function private.set_updated_at();

drop trigger if exists set_ask_conversations_updated_at on public.ask_conversations;
create trigger set_ask_conversations_updated_at before update on public.ask_conversations
for each row execute function private.set_updated_at();

drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at before update on public.journal_entries
for each row execute function private.set_updated_at();

drop trigger if exists set_memory_themes_updated_at on public.memory_themes;
create trigger set_memory_themes_updated_at before update on public.memory_themes
for each row execute function private.set_updated_at();

drop trigger if exists set_focuses_updated_at on public.focuses;
create trigger set_focuses_updated_at before update on public.focuses
for each row execute function private.set_updated_at();

drop trigger if exists set_connections_updated_at on public.connections;
create trigger set_connections_updated_at before update on public.connections
for each row execute function private.set_updated_at();

drop trigger if exists set_partner_invites_updated_at on public.partner_invites;
create trigger set_partner_invites_updated_at before update on public.partner_invites
for each row execute function private.set_updated_at();

drop trigger if exists set_partner_links_updated_at on public.partner_links;
create trigger set_partner_links_updated_at before update on public.partner_links
for each row execute function private.set_updated_at();

drop trigger if exists set_compatibility_reports_updated_at on public.compatibility_reports;
create trigger set_compatibility_reports_updated_at before update on public.compatibility_reports
for each row execute function private.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions
for each row execute function private.set_updated_at();

drop trigger if exists set_notification_prefs_updated_at on public.notification_prefs;
create trigger set_notification_prefs_updated_at before update on public.notification_prefs
for each row execute function private.set_updated_at();

drop trigger if exists set_push_tokens_updated_at on public.push_tokens;
create trigger set_push_tokens_updated_at before update on public.push_tokens
for each row execute function private.set_updated_at();

drop trigger if exists set_insights_updated_at on public.insights;
create trigger set_insights_updated_at before update on public.insights
for each row execute function private.set_updated_at();

drop trigger if exists set_rituals_updated_at on public.rituals;
create trigger set_rituals_updated_at before update on public.rituals
for each row execute function private.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.rituals to anon;
grant select on public.insights to authenticated;

alter table public.profiles enable row level security;
alter table public.birth_profiles enable row level security;
alter table public.blueprints enable row level security;
alter table public.placements enable row level security;
alter table public.daily_readings enable row level security;
alter table public.ask_conversations enable row level security;
alter table public.ask_messages enable row level security;
alter table public.journal_entries enable row level security;
alter table public.saved_items enable row level security;
alter table public.memory_themes enable row level security;
alter table public.focuses enable row level security;
alter table public.focus_guidance enable row level security;
alter table public.focus_checkins enable row level security;
alter table public.connections enable row level security;
alter table public.partner_invites enable row level security;
alter table public.partner_links enable row level security;
alter table public.compatibility_reports enable row level security;
alter table public.bond_readings enable row level security;
alter table public.referrals enable row level security;
alter table public.subscriptions enable row level security;
alter table public.purchases enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.push_tokens enable row level security;
alter table public.tarot_readings enable row level security;
alter table public.insights enable row level security;
alter table public.rituals enable row level security;
alter table public.logs enable row level security;

drop policy if exists "Profiles selectable by owner" on public.profiles;
create policy "Profiles selectable by owner" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Profiles insertable by owner" on public.profiles;
create policy "Profiles insertable by owner" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Profiles updatable by owner" on public.profiles;
create policy "Profiles updatable by owner" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Birth profiles selectable by owner" on public.birth_profiles;
create policy "Birth profiles selectable by owner" on public.birth_profiles
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Birth profiles insertable by owner" on public.birth_profiles;
create policy "Birth profiles insertable by owner" on public.birth_profiles
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Birth profiles updatable by owner" on public.birth_profiles;
create policy "Birth profiles updatable by owner" on public.birth_profiles
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Birth profiles deletable by owner" on public.birth_profiles;
create policy "Birth profiles deletable by owner" on public.birth_profiles
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Blueprints selectable by owner" on public.blueprints;
create policy "Blueprints selectable by owner" on public.blueprints
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Blueprints insertable by owner" on public.blueprints;
create policy "Blueprints insertable by owner" on public.blueprints
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Blueprints updatable by owner" on public.blueprints;
create policy "Blueprints updatable by owner" on public.blueprints
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Blueprints deletable by owner" on public.blueprints;
create policy "Blueprints deletable by owner" on public.blueprints
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Placements selectable by blueprint owner" on public.placements;
create policy "Placements selectable by blueprint owner" on public.placements
for select to authenticated using (
  exists (
    select 1 from public.blueprints b
    where b.id = placements.blueprint_id
      and b.user_id = (select auth.uid())
  )
);

drop policy if exists "Daily readings selectable by owner" on public.daily_readings;
create policy "Daily readings selectable by owner" on public.daily_readings
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Daily readings insertable by owner" on public.daily_readings;
create policy "Daily readings insertable by owner" on public.daily_readings
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Daily readings updatable by owner" on public.daily_readings;
create policy "Daily readings updatable by owner" on public.daily_readings
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Daily readings deletable by owner" on public.daily_readings;
create policy "Daily readings deletable by owner" on public.daily_readings
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Ask conversations selectable by owner" on public.ask_conversations;
create policy "Ask conversations selectable by owner" on public.ask_conversations
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Ask conversations insertable by owner" on public.ask_conversations;
create policy "Ask conversations insertable by owner" on public.ask_conversations
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Ask conversations updatable by owner" on public.ask_conversations;
create policy "Ask conversations updatable by owner" on public.ask_conversations
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Ask conversations deletable by owner" on public.ask_conversations;
create policy "Ask conversations deletable by owner" on public.ask_conversations
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Ask messages selectable by conversation owner" on public.ask_messages;
create policy "Ask messages selectable by conversation owner" on public.ask_messages
for select to authenticated using (
  exists (
    select 1 from public.ask_conversations c
    where c.id = ask_messages.conversation_id
      and c.user_id = (select auth.uid())
  )
);
drop policy if exists "Ask messages insertable by conversation owner" on public.ask_messages;
create policy "Ask messages insertable by conversation owner" on public.ask_messages
for insert to authenticated with check (
  exists (
    select 1 from public.ask_conversations c
    where c.id = ask_messages.conversation_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "Journal entries selectable by owner" on public.journal_entries;
create policy "Journal entries selectable by owner" on public.journal_entries
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Journal entries insertable by owner" on public.journal_entries;
create policy "Journal entries insertable by owner" on public.journal_entries
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Journal entries updatable by owner" on public.journal_entries;
create policy "Journal entries updatable by owner" on public.journal_entries
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Journal entries deletable by owner" on public.journal_entries;
create policy "Journal entries deletable by owner" on public.journal_entries
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Saved items selectable by owner" on public.saved_items;
create policy "Saved items selectable by owner" on public.saved_items
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Saved items insertable by owner" on public.saved_items;
create policy "Saved items insertable by owner" on public.saved_items
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Saved items deletable by owner" on public.saved_items;
create policy "Saved items deletable by owner" on public.saved_items
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Memory themes selectable by owner" on public.memory_themes;
create policy "Memory themes selectable by owner" on public.memory_themes
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Memory themes insertable by owner" on public.memory_themes;
create policy "Memory themes insertable by owner" on public.memory_themes
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Memory themes updatable by owner" on public.memory_themes;
create policy "Memory themes updatable by owner" on public.memory_themes
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Memory themes deletable by owner" on public.memory_themes;
create policy "Memory themes deletable by owner" on public.memory_themes
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Focuses selectable by owner" on public.focuses;
create policy "Focuses selectable by owner" on public.focuses
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Focuses insertable by owner" on public.focuses;
create policy "Focuses insertable by owner" on public.focuses
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Focuses updatable by owner" on public.focuses;
create policy "Focuses updatable by owner" on public.focuses
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Focuses deletable by owner" on public.focuses;
create policy "Focuses deletable by owner" on public.focuses
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Focus guidance selectable by owner" on public.focus_guidance;
create policy "Focus guidance selectable by owner" on public.focus_guidance
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Focus guidance insertable by owner" on public.focus_guidance;
create policy "Focus guidance insertable by owner" on public.focus_guidance
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Focus checkins selectable by owner" on public.focus_checkins;
create policy "Focus checkins selectable by owner" on public.focus_checkins
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Focus checkins insertable by owner" on public.focus_checkins;
create policy "Focus checkins insertable by owner" on public.focus_checkins
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Connections selectable by owner" on public.connections;
create policy "Connections selectable by owner" on public.connections
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Connections insertable by owner" on public.connections;
create policy "Connections insertable by owner" on public.connections
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Connections updatable by owner" on public.connections;
create policy "Connections updatable by owner" on public.connections
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Connections deletable by owner" on public.connections;
create policy "Connections deletable by owner" on public.connections
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Partner invites selectable by inviter or accepted user" on public.partner_invites;
create policy "Partner invites selectable by inviter or accepted user" on public.partner_invites
for select to authenticated using (
  (select auth.uid()) = inviter_user_id
  or (select auth.uid()) = accepted_user_id
);
drop policy if exists "Partner invites insertable by inviter" on public.partner_invites;
create policy "Partner invites insertable by inviter" on public.partner_invites
for insert to authenticated with check ((select auth.uid()) = inviter_user_id);
drop policy if exists "Partner invites updatable by inviter" on public.partner_invites;
create policy "Partner invites updatable by inviter" on public.partner_invites
for update to authenticated using ((select auth.uid()) = inviter_user_id) with check ((select auth.uid()) = inviter_user_id);

drop policy if exists "Partner links selectable by participants" on public.partner_links;
create policy "Partner links selectable by participants" on public.partner_links
for select to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);
drop policy if exists "Partner links updatable by participants" on public.partner_links;
create policy "Partner links updatable by participants" on public.partner_links
for update to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

drop policy if exists "Compatibility reports selectable by owner" on public.compatibility_reports;
create policy "Compatibility reports selectable by owner" on public.compatibility_reports
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Compatibility reports insertable by owner" on public.compatibility_reports;
create policy "Compatibility reports insertable by owner" on public.compatibility_reports
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Compatibility reports updatable by owner" on public.compatibility_reports;
create policy "Compatibility reports updatable by owner" on public.compatibility_reports
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Bond readings selectable by link participants" on public.bond_readings;
create policy "Bond readings selectable by link participants" on public.bond_readings
for select to authenticated using (
  exists (
    select 1 from public.partner_links l
    where l.id = bond_readings.link_id
      and ((select auth.uid()) = l.user_a or (select auth.uid()) = l.user_b)
  )
);

drop policy if exists "Referrals selectable by participants" on public.referrals;
create policy "Referrals selectable by participants" on public.referrals
for select to authenticated using (
  (select auth.uid()) = referrer_user_id
  or (select auth.uid()) = referred_user_id
);

drop policy if exists "Subscriptions selectable by owner" on public.subscriptions;
create policy "Subscriptions selectable by owner" on public.subscriptions
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Purchases selectable by owner" on public.purchases;
create policy "Purchases selectable by owner" on public.purchases
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Notification prefs selectable by owner" on public.notification_prefs;
create policy "Notification prefs selectable by owner" on public.notification_prefs
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Notification prefs insertable by owner" on public.notification_prefs;
create policy "Notification prefs insertable by owner" on public.notification_prefs
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Notification prefs updatable by owner" on public.notification_prefs;
create policy "Notification prefs updatable by owner" on public.notification_prefs
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Push tokens selectable by owner" on public.push_tokens;
create policy "Push tokens selectable by owner" on public.push_tokens
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Push tokens insertable by owner" on public.push_tokens;
create policy "Push tokens insertable by owner" on public.push_tokens
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Push tokens updatable by owner" on public.push_tokens;
create policy "Push tokens updatable by owner" on public.push_tokens
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Push tokens deletable by owner" on public.push_tokens;
create policy "Push tokens deletable by owner" on public.push_tokens
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Tarot readings selectable by owner" on public.tarot_readings;
create policy "Tarot readings selectable by owner" on public.tarot_readings
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Tarot readings insertable by owner" on public.tarot_readings;
create policy "Tarot readings insertable by owner" on public.tarot_readings
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Insights selectable by authenticated users" on public.insights;
create policy "Insights selectable by authenticated users" on public.insights
for select to authenticated using (true);

drop policy if exists "Rituals selectable by anyone" on public.rituals;
create policy "Rituals selectable by anyone" on public.rituals
for select to anon, authenticated using (true);

drop policy if exists "Logs insertable by owner" on public.logs;
create policy "Logs insertable by owner" on public.logs
for insert to authenticated with check (user_id is null or (select auth.uid()) = user_id);
drop policy if exists "Logs selectable by owner" on public.logs;
create policy "Logs selectable by owner" on public.logs
for select to authenticated using ((select auth.uid()) = user_id);

commit;


-- ====================== 20260625_zz2_advisor_fixes.sql ======================
-- Soluna — post-initial hardening + advisor fixes.
-- Safe to run on a live database; every statement is idempotent.
--
-- 1) SECURITY (acceptance criterion): generated content (blueprints, daily
--    readings) must NOT be directly writable by a normal authenticated user.
--    Both tables are written only by Edge Functions using the service role
--    (blueprint-service.ts, today, generate-daily-readings), so removing the
--    owner WRITE policies leaves reads intact and blocks forgery. (This also
--    covers the existing ..._zz_harden_generated_content_policies.sql, so you
--    only need to run THIS file.)
-- 2) PERFORMANCE (advisor: unindexed_foreign_keys): add covering indexes.
-- 3) SECURITY (advisor: function_search_path_mutable): pin the trigger fn path.

begin;

-- ── 1. Generated-content hardening ─────────────────────────────────
drop policy if exists "Blueprints insertable by owner" on public.blueprints;
drop policy if exists "Blueprints updatable by owner" on public.blueprints;
drop policy if exists "Blueprints deletable by owner" on public.blueprints;

drop policy if exists "Daily readings insertable by owner" on public.daily_readings;
drop policy if exists "Daily readings updatable by owner" on public.daily_readings;
drop policy if exists "Daily readings deletable by owner" on public.daily_readings;
-- (Owner SELECT policies remain, so users can still read their own rows.)

-- ── 2. Missing foreign-key covering indexes ────────────────────────
create index if not exists focus_guidance_user_idx on public.focus_guidance (user_id);
create index if not exists focus_checkins_focus_idx on public.focus_checkins (focus_id, created_at desc);
create index if not exists focus_checkins_user_idx on public.focus_checkins (user_id);
create index if not exists compatibility_reports_user_idx on public.compatibility_reports (user_id);
create index if not exists compatibility_reports_connection_idx on public.compatibility_reports (connection_id);
create index if not exists compatibility_reports_link_idx on public.compatibility_reports (link_id);
create index if not exists connections_linked_user_idx on public.connections (linked_user_id);
create index if not exists partner_invites_inviter_idx on public.partner_invites (inviter_user_id);
create index if not exists partner_invites_accepted_idx on public.partner_invites (accepted_user_id);
create index if not exists referrals_referrer_idx on public.referrals (referrer_user_id);
create index if not exists referrals_referred_idx on public.referrals (referred_user_id);
create index if not exists referrals_invite_idx on public.referrals (invite_id);
create index if not exists purchases_user_idx on public.purchases (user_id);

-- ── 3. Pin the trigger function's search_path ──────────────────────
-- now() resolves from pg_catalog, so an empty search_path is safe and removes
-- the mutable-search_path advisory. (handle_new_user already sets search_path.)
alter function private.set_updated_at() set search_path = '';

commit;


-- ====================== 20260625_zz_harden_generated_content_policies.sql ======================
-- Harden generated content tables.
-- Users can read their generated blueprint and daily readings, but writes should
-- only happen through Edge Functions using the service role.

drop policy if exists "Blueprints insertable by owner" on public.blueprints;
drop policy if exists "Blueprints updatable by owner" on public.blueprints;
drop policy if exists "Blueprints deletable by owner" on public.blueprints;

drop policy if exists "Daily readings insertable by owner" on public.daily_readings;
drop policy if exists "Daily readings updatable by owner" on public.daily_readings;
drop policy if exists "Daily readings deletable by owner" on public.daily_readings;


-- ====================== 20260626_advice_feedback.sql ======================
-- Advice feedback — lets users mark a reading helpful / not helpful so dynamic
-- advice can learn what lands. Minimal + owner-scoped; every existing table
-- already covers journals, focuses, ask history, saved items, and memory themes,
-- so this is the only new table the knowledge layer needs.

create table if not exists public.advice_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  surface text not null,
  ref_id text,
  rating text not null,
  reason text,
  confidence_label text,
  created_at timestamptz not null default now(),
  constraint advice_feedback_surface_check check (surface in ('ask', 'today', 'focus', 'compatibility', 'insight')),
  constraint advice_feedback_rating_check check (rating in ('helpful', 'not_helpful')),
  constraint advice_feedback_confidence_check check (
    confidence_label is null
    or confidence_label in ('strong', 'supportive', 'mixed', 'reflective')
  )
);

create index if not exists advice_feedback_user_idx
  on public.advice_feedback (user_id, surface, created_at desc);

alter table public.advice_feedback enable row level security;

-- Owner-scoped RLS, matching the pattern used across the schema. Feedback is
-- user-authored, so owners may read/insert/delete their own rows. No update
-- policy (feedback is immutable once given; correct it by deleting + re-adding).
drop policy if exists "Advice feedback selectable by owner" on public.advice_feedback;
create policy "Advice feedback selectable by owner" on public.advice_feedback
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Advice feedback insertable by owner" on public.advice_feedback;
create policy "Advice feedback insertable by owner" on public.advice_feedback
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Advice feedback deletable by owner" on public.advice_feedback;
create policy "Advice feedback deletable by owner" on public.advice_feedback
for delete to authenticated using ((select auth.uid()) = user_id);


-- ====================== 20260626_revenuecat_user_mappings.sql ======================
-- RevenueCat ↔ Soluna user mapping.
-- Written by the client after RevenueCat identifies with the Supabase user id
-- (app_user_id === auth.uid()); read by the billing webhook / support tooling.
-- Idempotent and safe to run on a live database.

begin;

create table if not exists public.revenuecat_user_mappings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revenuecat_app_user_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenuecat_user_mappings enable row level security;

-- Owner may read + maintain their own mapping row only.
drop policy if exists "RC mapping selectable by owner" on public.revenuecat_user_mappings;
create policy "RC mapping selectable by owner" on public.revenuecat_user_mappings
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "RC mapping insertable by owner" on public.revenuecat_user_mappings;
create policy "RC mapping insertable by owner" on public.revenuecat_user_mappings
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "RC mapping updatable by owner" on public.revenuecat_user_mappings;
create policy "RC mapping updatable by owner" on public.revenuecat_user_mappings
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists revenuecat_user_mappings_app_user_idx
  on public.revenuecat_user_mappings (revenuecat_app_user_id);

-- Keep updated_at fresh (private.set_updated_at exists from the initial schema).
drop trigger if exists set_revenuecat_user_mappings_updated_at on public.revenuecat_user_mappings;
create trigger set_revenuecat_user_mappings_updated_at
before update on public.revenuecat_user_mappings
for each row execute function private.set_updated_at();

grant select, insert, update on public.revenuecat_user_mappings to authenticated;

commit;


-- ====================== 20260627_bazi_four_pillars.sql ======================
-- BaZi / Four Pillars storage.
--
-- We extend the existing `blueprints` table rather than adding a separate table:
-- a user has exactly one blueprint (unique user_id), the per-system JSONB-column
-- pattern is already established (astrology/numerology/chinese/human_design), and
-- `blueprints` is already owner-scoped via RLS (select/insert/update by owner), so
-- the new column inherits that protection automatically.
--
-- The column stores the normalized BaziOutput. When no provider is configured or
-- inputs are missing, source is "unavailable"/partial — it is NEVER fabricated.
-- Provider secrets (BAZI_API_KEY) stay backend-only in Edge Function env.

begin;

alter table public.blueprints
  add column if not exists bazi jsonb not null default '{}'::jsonb;

comment on column public.blueprints.bazi is
  'Provider-backed BaZi / Four Pillars chart (BaziOutput JSON). source="provider" only with a real chart; "unavailable" otherwise. Never fabricated.';

-- Cache a connection's BaZi chart too, so BaZi compatibility doesn't re-charge the
-- provider on every compatibility view. `connections` is already owner-scoped.
alter table public.connections
  add column if not exists bazi jsonb not null default '{}'::jsonb;

comment on column public.connections.bazi is
  'Cached provider-backed BaZi chart for this connection (BaziOutput JSON). Used for BaZi compatibility only when both sides have a real chart. Never fabricated.';

commit;


-- ====================== 20260627_daily_readings_pushed_at.sql ======================
-- Track when a daily reading's push notification was delivered, so the
-- send-push worker (runs every 5 minutes) doesn't re-notify the same user on
-- every run for the rest of the day. Without this, a reading generated at 08:00
-- keeps matching `reading_date = today` and the user is pushed repeatedly.

alter table public.daily_readings
  add column if not exists pushed_at timestamptz;

-- Partial index so the worker can cheaply find readings that still need a push.
create index if not exists daily_readings_unpushed_idx
  on public.daily_readings (reading_date)
  where pushed_at is null;


-- ====================== 20260628_resonance_feedback.sql ======================
-- Resonance Feedback / "Tune Soluna to You"
--
-- A personalization feedback loop. Users say whether an output "resonated", and
-- Soluna gradually learns HOW to communicate with them — tone, emphasis, system
-- weighting, examples, focus areas, and action style.
--
-- It must NEVER change deterministic facts: natal placements, BaZi pillars,
-- numerology numbers, tarot draws, transits, compatibility math, or safety rules.
-- Those are computed elsewhere and are untouched by anything in these tables.

-- 1) Raw, immutable, owner-authored feedback events ──────────────────────────
create table if not exists public.resonance_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null,
  source_id text,
  resonance text not null,
  reason_tags text[] not null default '{}',
  free_text text,
  reframe_requested text,
  systems_referenced text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint resonance_feedback_source_check check (
    source_type in ('today', 'ask', 'focus', 'compatibility', 'tarot', 'blueprint')
  ),
  constraint resonance_feedback_value_check check (resonance in ('yes', 'partly', 'no'))
);

create index if not exists resonance_feedback_user_idx
  on public.resonance_feedback (user_id, source_type, created_at desc);

-- 2) Derived, gradually-updated personalization profile (one row per user) ────
create table if not exists public.personalization_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_tone text,
  detail_level text,
  spirituality_level text,
  action_style text,
  preferred_focus_areas text[] not null default '{}',
  resonant_systems text[] not null default '{}',
  less_resonant_systems text[] not null default '{}',
  avoid_patterns text[] not null default '{}',
  helpful_patterns text[] not null default '{}',
  summary text,
  feedback_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.resonance_feedback enable row level security;
alter table public.personalization_profiles enable row level security;

-- resonance_feedback: owner-authored. Owners may read/insert their own rows, and
-- delete them (so a user can reset their feedback history). Immutable once given
-- (no update policy) — matching the advice_feedback pattern in the schema.
drop policy if exists "Resonance feedback selectable by owner" on public.resonance_feedback;
create policy "Resonance feedback selectable by owner" on public.resonance_feedback
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Resonance feedback insertable by owner" on public.resonance_feedback;
create policy "Resonance feedback insertable by owner" on public.resonance_feedback
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Resonance feedback deletable by owner" on public.resonance_feedback;
create policy "Resonance feedback deletable by owner" on public.resonance_feedback
for delete to authenticated using ((select auth.uid()) = user_id);

-- personalization_profiles: owners may READ their own row (transparency / display)
-- and DELETE it (to reset personalization). There is intentionally NO client
-- insert/update policy — the profile is written ONLY by the resonance Edge
-- Function via the service role, so the deterministic update rules are the single
-- source of truth and a client can never hand-craft its own "preferences".
drop policy if exists "Personalization profile selectable by owner" on public.personalization_profiles;
create policy "Personalization profile selectable by owner" on public.personalization_profiles
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Personalization profile deletable by owner" on public.personalization_profiles;
create policy "Personalization profile deletable by owner" on public.personalization_profiles
for delete to authenticated using ((select auth.uid()) = user_id);


-- ════════════════════════════════════════════════════════════════════
-- 20260629_vedic_chart.sql
-- ════════════════════════════════════════════════════════════════════
-- Vedic (sidereal / Jyotish) chart storage.
--
-- A distinct lens from the Western (tropical) chart, stored on the same one-row
-- `blueprints` table as its own JSONB column — the established per-system pattern
-- (astrology/numerology/chinese/human_design/bazi). `blueprints` is already
-- owner-scoped via RLS, so the new column inherits that protection automatically.
--
-- The column stores the normalized VedicOutput. When no provider is configured or
-- the birth place is missing, source is "unavailable"/partial — NEVER fabricated.
-- It reuses the same FreeAstroAPI key as BaZi/astrology (backend-only env).

begin;

alter table public.blueprints
  add column if not exists vedic jsonb not null default '{}'::jsonb;

comment on column public.blueprints.vedic is
  'Provider-backed Vedic / sidereal chart (VedicOutput JSON). source="provider" only with a real chart; "unavailable" otherwise. Distinct from the Western chart; never fabricated.';

commit;

-- ════════════════════════════════════════════════════════════════════
-- 20260630_daily_cosmos.sql
-- ════════════════════════════════════════════════════════════════════
-- Daily cosmos signals cached per (user, date) on the daily reading.
-- These are TRANSIT/daily data (moon phase + sign, personal daily horoscope,
-- today's BaZi day pillar) — they change every day, so they live alongside the
-- daily reading rather than on the natal blueprint. RLS on daily_readings already
-- restricts rows to their owner; adding columns does not change that.
alter table public.daily_readings
  add column if not exists moon jsonb,
  add column if not exists horoscope jsonb,
  add column if not exists bazi_today jsonb;

-- ════════════════════════════════════════════════════════════════════
-- 20260701_solar_return.sql
-- ════════════════════════════════════════════════════════════════════
-- Solar Return ("year ahead") cache. Unlike the natal blueprint (fixed for life),
-- the solar-return chart is NEW each birthday, so we cache the currently-active
-- year's chart on the blueprint and refresh it when the year rolls over. Stored
-- best-effort by the year-ahead function (it works without this column too — it
-- just re-computes each view until the column exists). RLS on blueprints already
-- restricts rows to their owner; adding a column does not change that.
alter table public.blueprints
  add column if not exists solar_return jsonb;

-- ════════════════════════════════════════════════════════════════════
-- 20260702_quotas_and_mood_variants.sql
-- ════════════════════════════════════════════════════════════════════
-- Mood-reframe caching + per-user daily LLM quotas.
--
-- mood_variants: the daily reading reframed per support mood (Gentle/Clear/
-- Motivating/Reflective/Practical), cached on the day's reading row so each
-- (user, date, mood) costs at most ONE LLM call instead of one per tap.
alter table public.daily_readings
  add column if not exists mood_variants jsonb;

-- usage_counters: atomic per-day counters behind the Ask / mood-reframe caps.
-- Service-role only (RLS enabled with no policies) — clients never read or
-- write these directly.
create table if not exists public.usage_counters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  kind text not null,
  count integer not null default 0,
  primary key (user_id, day, kind)
);

alter table public.usage_counters enable row level security;

-- Atomic bump-and-read. SECURITY DEFINER so the Edge Function service role can
-- call it; not exposed to anon/authenticated.
create or replace function public.increment_usage(p_user uuid, p_day date, p_kind text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.usage_counters (user_id, day, kind, count)
  values (p_user, p_day, p_kind, 1)
  on conflict (user_id, day, kind)
  do update set count = usage_counters.count + 1
  returning count;
$$;

revoke execute on function public.increment_usage(uuid, date, text) from public;
revoke execute on function public.increment_usage(uuid, date, text) from anon;
revoke execute on function public.increment_usage(uuid, date, text) from authenticated;
