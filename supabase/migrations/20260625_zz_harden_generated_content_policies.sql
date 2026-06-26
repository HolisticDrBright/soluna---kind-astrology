-- Harden generated content tables.
-- Users can read their generated blueprint and daily readings, but writes should
-- only happen through Edge Functions using the service role.

drop policy if exists "Blueprints insertable by owner" on public.blueprints;
drop policy if exists "Blueprints updatable by owner" on public.blueprints;
drop policy if exists "Blueprints deletable by owner" on public.blueprints;

drop policy if exists "Daily readings insertable by owner" on public.daily_readings;
drop policy if exists "Daily readings updatable by owner" on public.daily_readings;
drop policy if exists "Daily readings deletable by owner" on public.daily_readings;
