-- ════════════════════════════════════════════════════════════════════
-- BLUEPRINT ACCURACY
-- Stores the honest accuracy report (level + missing inputs + warm notes)
-- alongside the blueprint, so the app never has to guess how precise a chart
-- is. Derived purely from which birth inputs were supplied (time, place).
-- ════════════════════════════════════════════════════════════════════

alter table public.blueprints
  add column if not exists accuracy jsonb not null default '{}'::jsonb;

comment on column public.blueprints.accuracy is
  'AccuracyReport: { accuracyLevel, missingInputs[], confidenceNotes[] }. No fake precision — labels what is exact vs estimated.';
