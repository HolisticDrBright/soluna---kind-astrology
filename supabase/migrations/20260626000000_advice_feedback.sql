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
