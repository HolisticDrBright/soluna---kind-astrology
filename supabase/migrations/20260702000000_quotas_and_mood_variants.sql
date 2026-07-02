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
