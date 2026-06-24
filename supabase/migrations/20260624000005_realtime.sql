-- Enable Realtime for the tables the app subscribes to:
--  - daily_readings INSERT -> "today's reading is ready"
--  - subscriptions  UPDATE -> entitlement changed (refresh paywall/gating)
-- RLS still applies to realtime, so users only receive their own rows.
do $$
begin
  begin
    alter publication supabase_realtime add table public.daily_readings;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.subscriptions;
  exception when duplicate_object then null;
  end;
end $$;
