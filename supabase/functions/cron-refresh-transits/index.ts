// pg_cron (daily): precompute the shared transit snapshot for today so /today
// and /synthesis don't recompute the ephemeris per request.
import { assertCron } from "../_shared/cron.ts";
import { json, serve } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { todayISO } from "../_shared/repo.ts";
import { computeTransits } from "../_shared/engines/astrology.ts";
import { logEvent } from "../_shared/log.ts";

Deno.serve(serve(async (req) => {
  assertCron(req);
  const date = todayISO();
  const snapshot = computeTransits(date);
  await serviceClient()
    .from("transit_snapshots")
    .upsert({ snapshot_date: date, data: snapshot }, { onConflict: "snapshot_date" });
  await logEvent("cron", { fn: "refresh-transits", date });
  return json({ ok: true, date, moon: snapshot.moon });
}));
