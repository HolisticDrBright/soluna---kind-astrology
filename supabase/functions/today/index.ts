// GET /today[?date=YYYY-MM-DD]
// Returns today's reading, generating + caching it on demand. Idempotent via
// UNIQUE(user_id, reading_date).
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, serve } from "../_shared/http.ts";
import { loadBlueprint, loadPreferredName, todayISO } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import { buildContext } from "../_shared/synthesis/context.ts";
import { detectAgreement } from "../_shared/synthesis/agreement.ts";
import { generateDailyReading } from "../_shared/synthesis/synthesis.ts";
import { shapeReading, upsertDailyReading } from "../_shared/daily.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? todayISO();
  const svc = serviceClient();

  // Cache-first.
  const { data: cached } = await svc
    .from("daily_readings").select("*").eq("user_id", user.id).eq("reading_date", date).maybeSingle();
  if (cached) return json({ reading: shapeReading(cached) });

  const bp = await loadBlueprint(user.id);
  if (!bp) throw new HttpError(409, "No blueprint yet — complete onboarding first.");
  const preferredName = await loadPreferredName(user.id);

  const ctx = await buildContext(user.id, date, bp, preferredName);
  const agreement = detectAgreement(ctx);
  const { reading, usedFallback } = await generateDailyReading(ctx, agreement);
  const saved = await upsertDailyReading(user.id, ctx, reading, agreement);

  await logEvent("llm_call", { kind: "daily_reading", date, usedFallback }, user.id);
  return json({ reading: shapeReading(saved) });
}));
