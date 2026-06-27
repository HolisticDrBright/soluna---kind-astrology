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

commit;
