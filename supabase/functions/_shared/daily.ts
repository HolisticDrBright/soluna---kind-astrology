// Shared daily-reading row construction + upsert, used by both the on-demand
// `today` function and the scheduled `cron-daily-readings` job (one source of truth).
import { serviceClient } from "./supabase.ts";
import type { DayContext } from "./synthesis/context.ts";
import { type AgreementResult, buildAgreementEvidence } from "./synthesis/agreement.ts";
import type { DailyReading } from "./synthesis/synthesis.ts";

export function buildReadingRow(
  userId: string,
  ctx: DayContext,
  reading: DailyReading,
  agreement: AgreementResult,
) {
  const energyLevel = Math.round(
    ((ctx.biorhythm.physical + ctx.biorhythm.emotional + ctx.biorhythm.intellectual) / 3 + 1) * 2.5,
  );
  return {
    user_id: userId,
    reading_date: ctx.date,
    hero_text: reading.heroText,
    // Structured "systems agree": theme/score/systems[{label,signal,detail,
    // confidence}]/combinedTakeaway — the Today drawer renders this directly,
    // no prose parsing. summary/perSystem keep the LLM phrasing.
    agreement: {
      ...buildAgreementEvidence(agreement, reading.agreement?.detail),
      summary: reading.agreement?.summary ??
        `${agreement.topTheme.score} systems point to ${agreement.topTheme.title.toLowerCase()} today.`,
      perSystem: reading.agreement?.perSystem ?? [],
    },
    affirmation: reading.affirmation,
    do_embrace_ease: reading.doEmbraceEase,
    personal_day: ctx.personalDay,
    chinese_daily: ctx.chineseDaily,
    tarot_card: ctx.tarot,
    cosmic_weather: {
      moon: ctx.transits.moon,
      transits: ctx.transits.planets.slice(0, 5),
      energy: {
        physical: ctx.biorhythm.physical,
        emotional: ctx.biorhythm.emotional,
        intellectual: ctx.biorhythm.intellectual,
        level: Math.min(5, Math.max(1, energyLevel)),
      },
      caption: reading.energyCaption,
    },
  };
}

// deno-lint-ignore no-explicit-any
export function shapeReading(r: any) {
  return {
    date: r.reading_date,
    hero: r.hero_text,
    agreement: r.agreement,
    affirmation: r.affirmation,
    doEmbraceEase: r.do_embrace_ease,
    personalDay: r.personal_day,
    chineseDaily: r.chinese_daily,
    tarotCard: r.tarot_card,
    cosmicWeather: r.cosmic_weather,
  };
}

export async function upsertDailyReading(
  userId: string,
  ctx: DayContext,
  reading: DailyReading,
  agreement: AgreementResult,
) {
  const row = buildReadingRow(userId, ctx, reading, agreement);
  const { data } = await serviceClient()
    .from("daily_readings")
    .upsert(row, { onConflict: "user_id,reading_date" })
    .select("*")
    .single();
  return data ?? row;
}
