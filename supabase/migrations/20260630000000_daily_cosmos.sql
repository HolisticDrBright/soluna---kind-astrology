-- Daily cosmos signals cached per (user, date) on the daily reading.
-- These are TRANSIT/daily data (moon phase + sign, personal daily horoscope,
-- today's BaZi day pillar) — they change every day, so they live alongside the
-- daily reading rather than on the natal blueprint. RLS on daily_readings already
-- restricts rows to their owner; adding columns does not change that.
alter table public.daily_readings
  add column if not exists moon jsonb,
  add column if not exists horoscope jsonb,
  add column if not exists bazi_today jsonb;
