// GET /today[?date=YYYY-MM-DD][&supportMode=gentle|clear|motivating|reflective|practical]
// Returns today's reading + Soluna Shift + explainable evidence + widget/push
// copy + accuracy. Generated + cached on demand, idempotent via
// UNIQUE(user_id, reading_date). A different supportMode re-tones the Shift only
// (facts stay identical), so switching mood is cheap.
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, serve } from "../_shared/http.ts";
import { loadAccuracy, loadBlueprint, loadPreferredName, todayISO } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import { buildContext } from "../_shared/synthesis/context.ts";
import { detectAgreement } from "../_shared/synthesis/agreement.ts";
import { generateDailyReading, generateSolunaShift } from "../_shared/synthesis/synthesis.ts";
import { dailyEvidence } from "../_shared/synthesis/evidence.ts";
import { buildDailyNotify } from "../_shared/notify.ts";
import { shapeReading, upsertDailyReading } from "../_shared/daily.ts";
import { SUPPORT_MODES, type SupportMode } from "../_shared/voice.ts";

function parseSupportMode(raw: string | null): SupportMode | undefined {
  return raw && (SUPPORT_MODES as string[]).includes(raw) ? (raw as SupportMode) : undefined;
}

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? todayISO();
  const supportMode = parseSupportMode(url.searchParams.get("supportMode"));
  const svc = serviceClient();

  // Cache-first.
  const { data: cached } = await svc
    .from("daily_readings").select("*").eq("user_id", user.id).eq("reading_date", date).maybeSingle();
  if (cached) {
    // Re-tone the Shift if the caller asked for a different mood. Facts are
    // untouched — we only regenerate the Shift and notify copy.
    if (supportMode && supportMode !== cached.support_mode) {
      const bp = await loadBlueprint(user.id);
      if (bp) {
        const preferredName = await loadPreferredName(user.id);
        const ctx = await buildContext(user.id, date, bp, preferredName);
        const agreement = detectAgreement(ctx);
        const { shift } = await generateSolunaShift(ctx, agreement, supportMode);
        const notify = buildDailyNotify(agreement.topTheme.id, agreement.topTheme.score, shift);
        const { data: updated } = await svc.from("daily_readings")
          .update({ shift, notify, support_mode: supportMode })
          .eq("user_id", user.id).eq("reading_date", date).select("*").single();
        return json({ reading: shapeReading(updated ?? cached), accuracy: bp.accuracy });
      }
    }
    return json({ reading: shapeReading(cached), accuracy: await loadAccuracy(user.id) });
  }

  const bp = await loadBlueprint(user.id);
  if (!bp) throw new HttpError(409, "No blueprint yet — complete onboarding first.");
  const preferredName = await loadPreferredName(user.id);

  const ctx = await buildContext(user.id, date, bp, preferredName);
  const agreement = detectAgreement(ctx);
  const [{ reading, usedFallback }, { shift }] = await Promise.all([
    generateDailyReading(ctx, agreement, supportMode),
    generateSolunaShift(ctx, agreement, supportMode),
  ]);
  const evidence = dailyEvidence(ctx, agreement);
  const notify = buildDailyNotify(agreement.topTheme.id, agreement.topTheme.score, shift);
  const saved = await upsertDailyReading(user.id, ctx, reading, agreement, {
    shift,
    evidence,
    notify,
    supportMode,
  });

  await logEvent("llm_call", { kind: "daily_reading", date, usedFallback }, user.id);
  return json({ reading: shapeReading(saved), accuracy: bp.accuracy });
}));
