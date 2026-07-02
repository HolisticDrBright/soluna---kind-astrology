-- Track when a daily reading's push notification was delivered, so the
-- send-push worker (runs every 5 minutes) doesn't re-notify the same user on
-- every run for the rest of the day. Without this, a reading generated at 08:00
-- keeps matching `reading_date = today` and the user is pushed repeatedly.

alter table public.daily_readings
  add column if not exists pushed_at timestamptz;

-- Partial index so the worker can cheaply find readings that still need a push.
create index if not exists daily_readings_unpushed_idx
  on public.daily_readings (reading_date)
  where pushed_at is null;
