-- Soluna — core schema
-- Conventions:
--   * uuid PKs via gen_random_uuid()
--   * every user-scoped table has user_id uuid -> auth.users(id) on delete cascade
--   * sensitive birth name is stored encrypted (app-layer AES-GCM) in *_enc columns
--   * timestamps are timestamptz default now()

-- ─── updated_at helper ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- IDENTITY
-- ════════════════════════════════════════════════════════════════════
create table public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text,
  preferred_name text,
  created_at     timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- BIRTH DATA + BLUEPRINT
-- ════════════════════════════════════════════════════════════════════
create table public.birth_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  full_birth_name_enc text,                       -- AES-GCM ciphertext, never plaintext
  birth_date          date not null,
  birth_time          time,                        -- null => time unknown
  time_known          boolean not null default false,
  birth_place_label   text,
  lat                 double precision,
  lng                 double precision,
  timezone            text,                        -- IANA tz, e.g. "America/Los_Angeles"
  house_system        text not null default 'placidus'
                        check (house_system in ('placidus','whole-sign','porphyry')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_birth_profiles_updated
  before update on public.birth_profiles
  for each row execute function public.set_updated_at();

create table public.blueprints (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  astrology      jsonb not null default '{}'::jsonb,
  numerology     jsonb not null default '{}'::jsonb,
  chinese        jsonb not null default '{}'::jsonb,
  human_design   jsonb not null default '{}'::jsonb,
  biorhythm_seed jsonb not null default '{}'::jsonb,
  summary        jsonb not null default '{}'::jsonb,  -- Big Three, Life Path, animal, HD type
  computed_at    timestamptz not null default now()
);

-- Flattened, queryable view of every placement across systems.
create table public.placements (
  id           uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.blueprints(id) on delete cascade,
  system       text not null,         -- astrology | numerology | chinese | human_design
  key          text not null,         -- e.g. "Sun", "lifePath", "type"
  label        text not null,         -- e.g. "Sun in Cancer (12H)"
  detail       jsonb not null default '{}'::jsonb
);
create index idx_placements_blueprint on public.placements(blueprint_id);
create index idx_placements_system on public.placements(system);

-- ════════════════════════════════════════════════════════════════════
-- DAILY READINGS + INSIGHTS
-- ════════════════════════════════════════════════════════════════════
create table public.daily_readings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  reading_date    date not null,
  hero_text       text,
  agreement       jsonb,               -- {systems, summary, detail, theme, score, evidence[]}
  affirmation     text,
  do_embrace_ease jsonb,               -- {do, embrace, ease}
  personal_day    int,
  chinese_daily   jsonb,
  tarot_card      jsonb,
  cosmic_weather  jsonb,               -- moon phase/sign, transits, energy level (for UI)
  generated_at    timestamptz not null default now(),
  unique (user_id, reading_date)
);
create index idx_daily_readings_user_date on public.daily_readings(user_id, reading_date desc);

create table public.insights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,  -- null => generic cache
  system     text not null,
  item_key   text not null,
  body       text not null,
  why        text,
  cached     boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_insights_user on public.insights(user_id);
create index idx_insights_lookup on public.insights(system, item_key);

-- ════════════════════════════════════════════════════════════════════
-- ASK SOLUNA (chat + memory)
-- ════════════════════════════════════════════════════════════════════
create table public.ask_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  created_at timestamptz not null default now()
);
create index idx_ask_conversations_user on public.ask_conversations(user_id, created_at desc);

create table public.ask_messages (
  id                 uuid primary key default gen_random_uuid(),
  conversation_id    uuid not null references public.ask_conversations(id) on delete cascade,
  role               text not null check (role in ('user','assistant','system')),
  content            text not null,
  systems_referenced text[] not null default '{}',
  created_at         timestamptz not null default now()
);
create index idx_ask_messages_conv on public.ask_messages(conversation_id, created_at);

create table public.ask_memory (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  fact       text not null,
  salience   int not null default 1,
  updated_at timestamptz not null default now()
);
create index idx_ask_memory_user on public.ask_memory(user_id, salience desc);
create trigger trg_ask_memory_updated
  before update on public.ask_memory
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- CONNECTIONS + COMPATIBILITY
-- ════════════════════════════════════════════════════════════════════
create table public.connections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  relationship      text,
  birth_date        date not null,
  birth_time        time,
  time_known        boolean not null default false,
  birth_place_label text,
  lat               double precision,
  lng               double precision,
  timezone          text,
  blueprint         jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);
create index idx_connections_user on public.connections(user_id, created_at desc);

create table public.compatibility_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.connections(id) on delete cascade,
  lens          text not null check (lens in ('romance','friendship','work','family')),
  score         int,
  body          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (connection_id, lens)
);
create index idx_compat_user on public.compatibility_reports(user_id);

-- ════════════════════════════════════════════════════════════════════
-- TAROT / JOURNAL / RITUALS / SAVED
-- ════════════════════════════════════════════════════════════════════
create table public.tarot_readings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  spread         text not null,
  cards          jsonb not null default '[]'::jsonb,
  question       text,
  interpretation text,
  created_at     timestamptz not null default now()
);
create index idx_tarot_user on public.tarot_readings(user_id, created_at desc);

create table public.journal_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entry_date      date not null,
  title           text,
  prompt          text,
  body            text,
  mood            int,
  transit_context jsonb,
  created_at      timestamptz not null default now()
);
create index idx_journal_user_date on public.journal_entries(user_id, entry_date desc);

-- Rituals are shared content (not user-scoped).
create table public.rituals (
  id            uuid primary key default gen_random_uuid(),
  moon_phase    text not null,
  title         text not null,
  description   text,
  steps         jsonb not null default '[]'::jsonb,
  intention     text,
  active_window jsonb
);
create index idx_rituals_phase on public.rituals(moon_phase);

create table public.saved_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,        -- reading | insight | tarot | ritual | transit | placement
  ref_id     text not null,
  payload    jsonb,                -- denormalized snapshot for display
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);
create index idx_saved_user on public.saved_items(user_id, kind);

-- ════════════════════════════════════════════════════════════════════
-- BILLING + ENTITLEMENTS
-- ════════════════════════════════════════════════════════════════════
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  revenuecat_app_user_id  text,
  entitlement             text not null default 'free',  -- free | premium
  status                  text not null default 'inactive',
  expires_at              timestamptz,
  store                   text,
  updated_at              timestamptz not null default now()
);
create index idx_subscriptions_rc on public.subscriptions(revenuecat_app_user_id);
create trigger trg_subscriptions_updated
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create table public.purchases (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  kind       text not null,        -- subscription | consumable (e.g. tarot reading)
  created_at timestamptz not null default now()
);
create index idx_purchases_user on public.purchases(user_id, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════════
create table public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  expo_token text not null,
  platform   text,
  created_at timestamptz not null default now(),
  unique (user_id, expo_token)
);
create index idx_push_tokens_user on public.push_tokens(user_id);

create table public.notification_prefs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  daily_time     time not null default '08:00',
  tz             text not null default 'America/Los_Angeles',
  daily_reading  boolean not null default true,
  personal_day   boolean not null default false,
  moon_alerts    boolean not null default true,
  transit_alerts boolean not null default false
);

-- ════════════════════════════════════════════════════════════════════
-- CONTENT + TRANSITS + LOGS
-- ════════════════════════════════════════════════════════════════════
create table public.content_templates (
  id        uuid primary key default gen_random_uuid(),
  system    text not null,
  item_key  text not null,
  base_copy text not null,
  unique (system, item_key)
);

-- Precomputed daily transit snapshot shared by all users (refresh-transits cron).
create table public.transit_snapshots (
  id            uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  data          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table public.logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  kind       text not null,        -- engine_compute | llm_call | webhook | push | guardrail_trip
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_logs_user on public.logs(user_id);
create index idx_logs_kind on public.logs(kind, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- AUTH TRIGGER (provision public.users + prefs on signup)
-- ════════════════════════════════════════════════════════════════════
-- Defined here, after all referenced tables exist.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.notification_prefs (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
