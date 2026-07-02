/**
 * GET /today — today's reading with synthesis, tarot card, and cosmic weather.
 * Generates on demand if missing for today.
 *
 * "Today" is the USER's calendar date (birth-profile timezone), never the
 * server's UTC date — otherwise evening users in the Americas would watch their
 * morning reading vanish and flip to tomorrow's at 4–8pm local.
 *
 * Mood reframes (?support=Gentle|Clear|Motivating|Reflective|Practical) are
 * cached per (user, date, mood) in daily_readings.mood_variants and reuse the
 * day's already-fetched cosmos, so each mood costs at most ONE LLM call and
 * ZERO extra provider calls — not one of each per tap.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { buildContext, detectAgreement, generateDailyReading, type DailyReading } from "../_shared/synthesis/index.ts";
import { deriveReadingAccuracy } from "../_shared/accuracy.ts";
import { computeDailyCosmos, dailyCosmosSignals, toHoroscopeBirth } from "../_shared/engines/daily-cosmos.ts";
import { todayInTz } from "../_shared/dates.ts";
import { bumpDailyUsage } from "../_shared/quota.ts";

const SUPPORT_MOODS = ["Gentle", "Clear", "Motivating", "Reflective", "Practical"];
/** Daily ceiling on mood-variant GENERATIONS (cached variants are free). */
const MOOD_GENERATIONS_PER_DAY = 20;

/** The reframed slice of a reading stored under mood_variants[mood]. */
function variantOf(reading: DailyReading): Record<string, unknown> {
  return {
    hero_text: reading.heroText,
    agreement: reading.agreement,
    affirmation: reading.affirmation,
    do_embrace_ease: reading.doEmbraceEase,
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);

    // Optional "support mode" (mood) reframes the reading in a chosen tone.
    const supportRaw = new URL(req.url).searchParams.get("support") ?? "";
    const support = SUPPORT_MOODS.includes(supportRaw) ? supportRaw : undefined;

    // Birth profile first: it defines the user's LOCAL "today" and feeds the
    // personal horoscope.
    const { data: bp } = await supabase.from("birth_profiles")
      .select("birth_date, birth_time, time_known, birth_place_label, lat, lng, timezone")
      .eq("user_id", user.userId)
      .single();
    const today = todayInTz(bp?.timezone as string | null);

    const { data: cached } = await supabase.from("daily_readings")
      .select("*")
      .eq("user_id", user.userId)
      .eq("reading_date", today)
      .single();

    // Neutral + cached → serve as-is.
    if (cached && !support) {
      return jsonResponse(cached);
    }

    // Mood variant with a cached base reading: serve the cached variant, or
    // generate exactly one — reusing the day's cosmos (no provider calls).
    if (cached && support) {
      const variants = (cached.mood_variants ?? {}) as Record<string, Record<string, unknown>>;
      if (variants[support]) {
        return jsonResponse({ ...cached, ...variants[support], support });
      }

      const used = await bumpDailyUsage(user.userId, "mood_reframe");
      if (used !== null && used > MOOD_GENERATIONS_PER_DAY) {
        return errorResponse(
          "You've explored a lot of tones today — the reframes are resting. They'll be fresh again tomorrow.",
          429,
        );
      }

      const ctx = await buildContext(user.userId, today);
      ctx.dailyCosmos = dailyCosmosSignals(cached.moon, cached.horoscope, cached.bazi_today);
      const agreements = detectAgreement(ctx);
      const reading = await generateDailyReading(ctx, agreements, { supportMode: support });
      const variant = variantOf(reading);

      const { error: varErr } = await getSupabaseAdmin().from("daily_readings")
        .update({ mood_variants: { ...variants, [support]: variant } })
        .eq("user_id", user.userId)
        .eq("reading_date", today);
      if (varErr) console.error("Mood variant cache skipped (apply the mood_variants migration to enable it):", varErr.message);

      await logEvent("daily_reading_reframed", { support }, user.userId);
      return jsonResponse({ ...cached, ...variant, support });
    }

    // No reading for today yet → generate the neutral base (and, if a mood was
    // pre-selected, its variant from the same context — no extra provider calls).
    const ctx = await buildContext(user.userId, today);

    // Today's REAL transit signals (moon phase + sign, personal daily horoscope,
    // BaZi day pillar), personalized to the birth chart where possible. Honest
    // degradation lives inside computeDailyCosmos (never fabricated).
    const cosmos = await computeDailyCosmos(bp ? toHoroscopeBirth(bp) : null, today);
    ctx.dailyCosmos = dailyCosmosSignals(cosmos.moon, cosmos.horoscope, cosmos.baziToday);

    const agreements = detectAgreement(ctx);
    const reading = await generateDailyReading(ctx, agreements);

    // Tarot card is already in context
    const tarotCard = ctx.tarotCard;

    // Honest accuracy from the blueprint's astrology provenance (no fake precision)
    const accuracy = deriveReadingAccuracy(ctx.astrology);

    // When a mood was pre-selected, its variant ships in this same response.
    let firstVariant: Record<string, unknown> | null = null;
    if (support) {
      const variantReading = await generateDailyReading(ctx, agreements, { supportMode: support });
      firstVariant = variantOf(variantReading);
    }

    const sbAdmin = getSupabaseAdmin();
    const upsertRes = await sbAdmin.from("daily_readings")
      .upsert({
        user_id: user.userId,
        reading_date: today,
        hero_text: reading.heroText,
        agreement: reading.agreement,
        affirmation: reading.affirmation,
        do_embrace_ease: reading.doEmbraceEase,
        personal_day: ctx.numerology?.personalDay ?? null,
        chinese_daily: ctx.chinese ? {
          animal: ctx.chinese.animal,
          element: ctx.chinese.element,
          yinYang: ctx.chinese.yinYang,
        } : null,
        tarot_card: tarotCard ? {
          name: tarotCard.name,
          meaning: tarotCard.meaning,
          arcana: tarotCard.arcana,
        } : null,
        moon: cosmos.moon,
        horoscope: cosmos.horoscope,
        bazi_today: cosmos.baziToday,
        mood_variants: firstVariant && support ? { [support]: firstVariant } : null,
        accuracy_level: accuracy.accuracy_level,
        missing_inputs: accuracy.missing_inputs,
        confidence_notes: accuracy.confidence_notes,
        generated_at: new Date().toISOString(),
      }, { onConflict: "user_id, reading_date" })
      .select()
      .single();
    if (upsertRes.error) {
      // Don't fail the request — we still return the freshly generated reading
      // via the fallback below; just surface the persistence failure in logs.
      console.error("Failed to persist daily reading:", upsertRes.error);
    }
    const saved = upsertRes.data;

    await logEvent("daily_reading_generated", {
      agreementScore: agreements[0]?.score ?? 0,
      llmUsed: !!reading.heroText,
    }, user.userId);

    const base = saved ?? {
      user_id: user.userId,
      reading_date: today,
      hero_text: reading.heroText,
      agreement: reading.agreement,
      affirmation: reading.affirmation,
      do_embrace_ease: reading.doEmbraceEase,
      personal_day: ctx.numerology?.personalDay,
      chinese_daily: ctx.chinese ? { animal: ctx.chinese.animal, element: ctx.chinese.element } : null,
      tarot_card: tarotCard,
      moon: cosmos.moon,
      horoscope: cosmos.horoscope,
      bazi_today: cosmos.baziToday,
      generated_at: new Date().toISOString(),
    };
    return jsonResponse(firstVariant && support ? { ...base, ...firstVariant, support } : base);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse("Unauthorized", 401);
    }
    console.error("Today error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
