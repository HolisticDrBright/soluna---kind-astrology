/**
 * GET /today — today's reading with synthesis, tarot card, and cosmic weather.
 * Generates on demand if missing for today.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { buildContext, detectAgreement, generateDailyReading } from "../_shared/synthesis/index.ts";
import { deriveReadingAccuracy } from "../_shared/accuracy.ts";
import { computeDailyCosmos, type HoroscopeBirth } from "../_shared/engines/daily-cosmos.ts";

/** Map a birth_profiles row into the horoscope provider's birth input. */
function toHoroscopeBirth(bp: Record<string, unknown>): HoroscopeBirth | null {
  if (!bp.birth_date) return null;
  const [y, m, d] = String(bp.birth_date).split("-").map(Number);
  const timeStr = bp.birth_time ? String(bp.birth_time) : null;
  const [hh, mm] = timeStr ? timeStr.split(":").map(Number) : [null, null];
  return {
    year: y,
    month: m,
    day: d,
    hour: hh,
    minute: mm,
    city: bp.birth_place_label ? String(bp.birth_place_label) : null,
    timezone: bp.timezone ? String(bp.timezone) : null,
    timeKnown: bp.time_known !== false && !!timeStr,
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const today = new Date().toISOString().split("T")[0];

    // Check if we already have today's reading cached
    const { data: cached } = await supabase.from("daily_readings")
      .select("*")
      .eq("user_id", user.userId)
      .eq("reading_date", today)
      .single();

    if (cached) {
      return jsonResponse(cached);
    }

    // Generate new reading
    const ctx = await buildContext(user.userId, today);

    // Today's REAL transit signals (moon phase + sign, personal daily horoscope,
    // BaZi day pillar), personalized to the birth chart where possible. Honest
    // degradation lives inside computeDailyCosmos (never fabricated).
    const { data: bp } = await supabase.from("birth_profiles")
      .select("birth_date, birth_time, time_known, birth_place_label, lat, lng, timezone")
      .eq("user_id", user.userId)
      .single();
    const cosmos = await computeDailyCosmos(bp ? toHoroscopeBirth(bp) : null, today);
    ctx.dailyCosmos = {
      moonPhase: cosmos.moon.phase,
      moonSign: cosmos.moon.sign,
      theme: cosmos.horoscope?.theme ?? null,
      topTransit: cosmos.horoscope?.topTransits?.[0]?.label ?? null,
      focusAreas: cosmos.horoscope?.focusAreas ?? [],
      baziDayElement: cosmos.baziToday?.dayStemElement ?? null,
      baziAnimal: cosmos.baziToday?.animal ?? null,
    };

    const agreements = detectAgreement(ctx);
    const reading = await generateDailyReading(ctx, agreements);

    // Tarot card is already in context
    const tarotCard = ctx.tarotCard;

    // Honest accuracy from the blueprint's astrology provenance (no fake precision)
    const accuracy = deriveReadingAccuracy(ctx.astrology);

    // Persist to database
    const sbAdmin = getSupabaseAdmin();
    const { data: saved, error: saveErr } = await sbAdmin.from("daily_readings")
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
        accuracy_level: accuracy.accuracy_level,
        missing_inputs: accuracy.missing_inputs,
        confidence_notes: accuracy.confidence_notes,
        generated_at: new Date().toISOString(),
      }, { onConflict: "user_id, reading_date" })
      .select()
      .single();

    if (saveErr) {
      // Don't fail the request — we still return the freshly generated reading
      // via the fallback below; just surface the persistence failure in logs.
      console.error("Failed to persist daily reading:", saveErr);
    }

    await logEvent("daily_reading_generated", {
      agreementScore: agreements[0]?.score ?? 0,
      llmUsed: !!reading.heroText,
    }, user.userId);

    return jsonResponse(saved ?? {
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
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse("Unauthorized", 401);
    }
    console.error("Today error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
