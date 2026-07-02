-- Solar Return ("year ahead") cache. Unlike the natal blueprint (fixed for life),
-- the solar-return chart is NEW each birthday, so we cache the currently-active
-- year's chart on the blueprint and refresh it when the year rolls over. Stored
-- best-effort by the year-ahead function (it works without this column too — it
-- just re-computes each view until the column exists). RLS on blueprints already
-- restricts rows to their owner; adding a column does not change that.
alter table public.blueprints
  add column if not exists solar_return jsonb;
