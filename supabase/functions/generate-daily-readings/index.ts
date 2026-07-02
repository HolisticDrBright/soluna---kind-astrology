/**
 * Worker: generate-daily-readings
 * Runs hourly. Selects users whose local daily_time matches this hour,
 * generates their daily reading, and enqueues push notifications.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { buildContext, detectAgreement, generateDailyReading } from "../_shared/synthesis/index.ts";
import { deriveReadingAccuracy } from "../_shared/accuracy.ts";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { computeDailyCosmos, dailyCosmosSignals, toHoroscopeBirth } from "../_shared/engines/daily-cosmos.ts";
import { todayInTz } from "../_shared/dates.ts";

Deno.serve(async (req: Request) => {
  const unauthorized = requireInternalSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const sb = getSupabaseAdmin();

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
    for (const { user_id, tz } of users) {
      // The reading is dated in the USER's calendar (their tz already drove the
      // hour match above) so /today's cache lookup finds it all day long.
      const today = todayInTz(tz ?? null);

      // Check if reading already exists for today
      const { data: existing } = await sb.from("daily_readings")
        .select("id")
        .eq("user_id", user_id)
        .eq("reading_date", today)
        .maybeSingle();

      if (existing) continue;

      try {
        const ctx = await buildContext(user_id, today);

        // Same real transit signals /today fetches (moon, personal horoscope,
        // BaZi day pillar) — without this, every push-user's reading would
        // permanently lack the Today's Sky sections and read less "today".
        const { data: bp } = await sb.from("birth_profiles")
          .select("birth_date, birth_time, time_known, birth_place_label, lat, lng, timezone")
          .eq("user_id", user_id)
          .single();
        const cosmos = await computeDailyCosmos(bp ? toHoroscopeBirth(bp) : null, today);
        ctx.dailyCosmos = dailyCosmosSignals(cosmos.moon, cosmos.horoscope, cosmos.baziToday);

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
          moon: cosmos.moon,
          horoscope: cosmos.horoscope,
          bazi_today: cosmos.baziToday,
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
