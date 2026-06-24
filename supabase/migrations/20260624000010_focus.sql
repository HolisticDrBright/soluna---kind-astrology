-- ════════════════════════════════════════════════════════════════════
-- SOLUNA FOCUS — dynamic, user-led guidance around a real-life situation.
-- A focus carries the user's framing + which context Soluna may consider;
-- guidance and check-ins are cached against it over time. Privacy by default:
-- raw problem text lives only here (RLS-scoped), never in logs.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.focuses (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  category               text not null check (category in (
                           'relationship','work','school','big_decision','family',
                           'friendship','money','self_worth','creativity',
                           'spiritual_growth','personal')),
  title                  text,
  problem_text           text not null,
  support_mode           text not null default 'gentle' check (support_mode in (
                           'gentle','clear','motivating','practical','reflective')),
  selected_connection_id uuid references public.connections(id) on delete set null,
  selected_bond_id       uuid references public.partner_links(id) on delete set null,
  -- which context the user allowed Soluna to consider
  allowed_context        jsonb not null default '{}'::jsonb,
  status                 text not null default 'active'
                           check (status in ('active','paused','resolved','archived')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  resolved_at            timestamptz
);
create index if not exists idx_focuses_user on public.focuses(user_id, status, created_at desc);

create trigger trg_focuses_updated
  before update on public.focuses
  for each row execute function public.set_updated_at();

create table if not exists public.focus_guidance (
  id              uuid primary key default gen_random_uuid(),
  focus_id        uuid not null references public.focuses(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  guidance        jsonb not null default '{}'::jsonb,   -- {whatSolunaNotices,...,followUpQuestion,suggestedMemoryTheme?}
  evidence        jsonb not null default '[]'::jsonb,   -- Evidence[] (extended systems)
  accuracy_level  text,                                 -- exact|partial|approximate|blocked
  confidence_notes text[] not null default '{}',
  generated_at    timestamptz not null default now()
);
create index if not exists idx_focus_guidance_focus on public.focus_guidance(focus_id, generated_at desc);

create table if not exists public.focus_checkins (
  id               uuid primary key default gen_random_uuid(),
  focus_id         uuid not null references public.focuses(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  checkin_status   text not null check (checkin_status in (
                     'better','still_unclear','harder_than_expected','took_the_step','not_yet')),
  checkin_text     text,
  updated_guidance jsonb,   -- {whatShifted,nextStep,keepPauseOrResolve,reflectionPrompt,evidence}
  created_at       timestamptz not null default now()
);
create index if not exists idx_focus_checkins_focus on public.focus_checkins(focus_id, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- RLS — users touch only their own focus rows. Service role (Edge Functions)
-- bypasses RLS to generate + cache guidance.
-- ════════════════════════════════════════════════════════════════════
alter table public.focuses        enable row level security;
alter table public.focus_guidance enable row level security;
alter table public.focus_checkins enable row level security;

create policy "focuses own" on public.focuses
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "focus_guidance own" on public.focus_guidance
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "focus_checkins own" on public.focus_checkins
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
