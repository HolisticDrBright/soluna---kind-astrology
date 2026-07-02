/**
 * GET /year-ahead — the Solar Return ("year ahead") reading for the currently
 * active return year. Cached best-effort on blueprints.solar_return and refreshed
 * only when the year rolls over (the chart changes on the birthday). Degrades
 * honestly when birth time/place are missing or the provider is unavailable —
 * never fabricated.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { todayInTz } from "../_shared/dates.ts";
import {
  computeSolarReturn,
  currentSolarYear,
  type SolarReturnInput,
  type SolarReturnOutput,
} from "../_shared/engines/solar-return.ts";

/** Map a birth_profiles row into the solar-return provider's input. */
function toSolarInput(bp: Record<string, unknown>): SolarReturnInput | null {
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
    lat: typeof bp.lat === "number" ? bp.lat : null,
    lng: typeof bp.lng === "number" ? bp.lng : null,
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);

    const { data: bp } = await supabase.from("birth_profiles")
      .select("birth_date, birth_time, time_known, birth_place_label, lat, lng, timezone")
      .eq("user_id", user.userId)
      .single();

    if (!bp || !bp.birth_date) {
      return jsonResponse({ solarReturn: null, message: "Add your birth data to unlock your year ahead." }, 200);
    }
    const input = toSolarInput(bp);
    if (!input) {
      return jsonResponse({ solarReturn: null, message: "Add your birth data to unlock your year ahead." }, 200);
    }

    // The birthday rollover happens at the USER's midnight, not UTC's.
    const today = todayInTz(bp.timezone ? String(bp.timezone) : null);
    const returnYear = currentSolarYear(input.month, input.day, today);

    // Reuse the cached chart when the same return year is already on file (select *
    // so a not-yet-migrated solar_return column can't error this read).
    const { data: blueprintRow } = await supabase.from("blueprints")
      .select("*")
      .eq("user_id", user.userId)
      .maybeSingle();
    const cached = (blueprintRow?.solar_return as SolarReturnOutput | null) ?? null;

    const sr = await computeSolarReturn(input, { cached, todayISO: today });

    // Best-effort cache: persist a fresh provider result for the current year.
    // No-ops with a log if the column isn't migrated yet — the reading still returns.
    if (sr.source === "provider" && sr.sourceInputHash !== cached?.sourceInputHash) {
      const { error: upErr } = await getSupabaseAdmin().from("blueprints")
        .update({ solar_return: sr }).eq("user_id", user.userId);
      if (upErr) console.error("Solar-return persist skipped (apply the solar_return column migration to enable caching):", upErr.message);
    }

    await logEvent("year_ahead_viewed", { returnYear, available: sr.source === "provider" }, user.userId);

    return jsonResponse({ solarReturn: sr });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Year-ahead error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
