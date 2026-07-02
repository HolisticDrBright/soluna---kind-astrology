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
