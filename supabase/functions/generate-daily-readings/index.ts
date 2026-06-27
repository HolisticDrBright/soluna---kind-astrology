/**
 * Worker: generate-daily-readings
 * Runs hourly. Selects users whose local daily_time matches this hour,
 * generates their daily reading, and enqueues push notifications.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { buildContext, detectAgreement, generateDailyReading } from "../_shared/synthesis/index.ts";
import { deriveReadingAccuracy } from "../_shared/accuracy.ts";
import { requireInternalSecret } from "../_shared/internal-auth.ts";

Deno.serve(async (req: Request) => {
  const unauthorized = requireInternalSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const sb = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    // daily_time is the user's LOCAL time, so match it against each user's
    // current local hour (derived from their tz) — never the server's UTC hour,
    // which would fire every non-UTC user at the wrong time of day.
    const now = new Date();
    const localHour = (tz: string): number => {
      try {
        return Number(
          new Intl.DateTimeFormat("en-US", { hour: "2-digit", hourCycle: "h23", timeZone: tz }).format(now),
        );
      } catch {
        return now.getUTCHours(); // unknown tz → fall back to the server hour
      }
    };

    const { data: candidates } = await sb.from("notification_prefs")
      .select("user_id, daily_time, tz")
      .eq("daily_reading", true)
      .limit(5000);

    const users = (candidates ?? []).filter((c) => {
      const targetHour = parseInt(String(c.daily_time ?? "").slice(0, 2), 10);
      return !Number.isNaN(targetHour) && localHour(c.tz ?? "UTC") === targetHour;
    });

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
        const accuracy = deriveReadingAccuracy(ctx.astrology);

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
          accuracy_level: accuracy.accuracy_level,
          missing_inputs: accuracy.missing_inputs,
          confidence_notes: accuracy.confidence_notes,
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
