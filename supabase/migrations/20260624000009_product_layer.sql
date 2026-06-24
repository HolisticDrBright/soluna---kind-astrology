-- ════════════════════════════════════════════════════════════════════
-- PRODUCT LAYER: Soluna Shift, explainable evidence, notify copy,
-- personal pattern memory, weekly integration reports, bond rituals.
-- ════════════════════════════════════════════════════════════════════

-- ─── daily readings: Shift + evidence chips + notify copy + support mode ──
alter table public.daily_readings
  add column if not exists shift        jsonb,   -- {reframe,reset,braveTinyAction,journalPrompt,supportMode}
  add column if not exists evidence     jsonb,   -- Evidence[] (system/signal/detail/confidence/source)
  add column if not exists notify       jsonb,   -- {widgetTitle,widgetBody,pushTitle,pushBody}
  add column if not exists support_mode text;    -- gentle|clear|motivating|reflective|practical

comment on column public.daily_readings.shift is
  'Soluna Shift: explainable, practical guidance for the day (LLM + safe fallback).';

-- ─── bond readings: daily relationship ritual ───────────────────────
alter table public.bond_readings
  add column if not exists ritual jsonb;  -- {supportEachOtherToday,bestDayForDeepConversation,possibleMisread,sharedJournalPrompt,lens,evidence[],confidenceNotes[]}

-- ════════════════════════════════════════════════════════════════════
-- PERSONAL PATTERN MEMORY (user-controlled themes)
-- The user explicitly creates/enables these; only enabled themes are ever fed
-- to the LLM. We never infer or auto-store themes.
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.user_memory_themes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  description text,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_memory_themes_user on public.user_memory_themes(user_id, created_at desc);
create index if not exists idx_memory_themes_enabled on public.user_memory_themes(user_id, enabled);

create trigger trg_memory_themes_updated
  before update on public.user_memory_themes
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- WEEKLY INTEGRATION REPORTS (cached per user + week)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.weekly_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  week_start   date not null,
  body         jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create index if not exists idx_weekly_reports_user on public.weekly_reports(user_id, week_start desc);

-- ════════════════════════════════════════════════════════════════════
-- RLS — strict per-user scoping for the new user-owned tables
-- ════════════════════════════════════════════════════════════════════
alter table public.user_memory_themes enable row level security;
alter table public.weekly_reports     enable row level security;

create policy "memory themes own" on public.user_memory_themes
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "weekly reports own" on public.weekly_reports
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
