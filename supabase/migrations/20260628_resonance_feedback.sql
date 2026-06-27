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
