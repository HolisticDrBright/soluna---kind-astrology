/**
 * Worker: generate-daily-readings
 * Runs hourly. Selects users whose local daily_time matches this hour,
 * generates their daily reading, and enqueues push notifications.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { buildContext, detectAgreement, generateDailyReading } from "../_shared/synthesis/index.ts";
import { requireInternalSecret } from "../_shared/internal-auth.ts";

Deno.serve(async (req: Request) => {
  const unauthorized = requireInternalSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const sb = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    // Get users who have notification_prefs with matching hour
    const currentHour = new Date().getUTCHours();
    const timeFilter = `${String(currentHour).padStart(2, "0")}:00`;

    const { data: users } = await sb.from("notification_prefs")
      .select("user_id")
      .eq("daily_reading", true)
      .like("daily_time", `${timeFilter}%`)
      .limit(50);

    if (!users?.length) {
      return new Response(JSON.stringify({ ok: true, generated: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let generated = 0;
    for (const { user_id } of users) {
      // Check if reading already exists for today
      const { data: existing } = await sb.from("daily_readings")
        .select("id")
        .eq("user_id", user_id)
        .eq("reading_date", today)
        .maybeSingle();

      if (existing) continue;

      try {
        const ctx = await buildContext(user_id, today);
        const agreements = detectAgreement(ctx);
        const reading = await generateDailyReading(ctx, agreements);

        await sb.from("daily_readings").upsert({
          user_id,
          reading_date: today,
          hero_text: reading.heroText,
          agreement: reading.agreement,
          affirmation: reading.affirmation,
          do_embrace_ease: reading.doEmbraceEase,
          personal_day: ctx.numerology?.personalDay ?? null,
          chinese_daily: ctx.chinese ? {
            animal: ctx.chinese.animal,
            element: ctx.chinese.element,
          } : null,
          tarot_card: ctx.tarotCard ? {
            name: ctx.tarotCard.name,
            meaning: ctx.tarotCard.meaning,
          } : null,
          generated_at: new Date().toISOString(),
        }, { onConflict: "user_id, reading_date" });

        generated++;
      } catch (err) {
        console.error(`Failed daily reading for user ${user_id}:`, err);
      }
    }

    await logEvent("daily_readings_batch_generated", { count: generated });

    return new Response(JSON.stringify({ ok: true, generated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Daily readings worker error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
