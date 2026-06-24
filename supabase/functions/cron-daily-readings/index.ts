// pg_cron (hourly): generate daily readings for users whose local daily_time
// matches this hour, then enqueue a push.
import { assertCron } from "../_shared/cron.ts";
import { json, serve } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { loadBlueprint, loadPreferredName, todayISO } from "../_shared/repo.ts";
import { buildContext } from "../_shared/synthesis/context.ts";
import { detectAgreement } from "../_shared/synthesis/agreement.ts";
import { generateDailyReading } from "../_shared/synthesis/synthesis.ts";
import { upsertDailyReading } from "../_shared/daily.ts";
import { logEvent } from "../_shared/log.ts";

function localHour(tz: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date()),
  );
}

Deno.serve(serve(async (req) => {
  assertCron(req);
  const svc = serviceClient();

  const { data: prefs } = await svc.from("notification_prefs")
    .select("user_id, daily_time, tz, daily_reading").eq("daily_reading", true);

  let generated = 0;
  for (const p of prefs ?? []) {
    try {
      const tz = p.tz || "UTC";
      const targetHour = Number(String(p.daily_time ?? "08:00").split(":")[0]);
      if (localHour(tz) !== targetHour) continue;

      const date = todayISO(tz);
      const { data: existing } = await svc.from("daily_readings")
        .select("id").eq("user_id", p.user_id).eq("reading_date", date).maybeSingle();
      if (existing) continue;

      const bp = await loadBlueprint(p.user_id);
      if (!bp) continue;
      const name = await loadPreferredName(p.user_id);

      const ctx = await buildContext(p.user_id, date, bp, name);
      const agreement = detectAgreement(ctx);
      const { reading } = await generateDailyReading(ctx, agreement);
      await upsertDailyReading(p.user_id, ctx, reading, agreement);

      await svc.rpc("queue_send", {
        p_queue: "send_push",
        p_msg: {
          user_id: p.user_id,
          title: "Your Soluna reading is ready ✨",
          body: reading.heroText.slice(0, 140),
          kind: "daily_reading",
          data: { route: "/today" },
        },
      });
      generated++;
    } catch (e) {
      console.error("daily-reading error:", e);
    }
  }

  await logEvent("cron", { fn: "daily-readings", generated });
  return json({ generated });
}));
