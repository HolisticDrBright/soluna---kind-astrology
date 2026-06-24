// GET /insight?system=&key=
// Warm interpretation + a plain "why you're seeing this". Cache-first.
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, serve, ValidationError } from "../_shared/http.ts";
import { loadBlueprint, loadPlacements, loadPreferredName } from "../_shared/repo.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import { generateInsight } from "../_shared/synthesis/synthesis.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const url = new URL(req.url);
  const system = url.searchParams.get("system");
  const key = url.searchParams.get("key");
  if (!system || !key) throw new ValidationError("system and key are required");

  const svc = serviceClient();
  const { data: cached } = await svc
    .from("insights").select("body, why")
    .eq("user_id", user.id).eq("system", system).eq("item_key", key).maybeSingle();
  if (cached) return json({ system, key, body: cached.body, why: cached.why, cached: true });

  const bp = await loadBlueprint(user.id);
  if (!bp) throw new HttpError(409, "No blueprint yet — complete onboarding first.");

  const placements = await loadPlacements(user.id, system);
  const match = placements.find((p) => p.key === key);
  const label = match?.label ?? `${key}`;
  const detail = (match?.detail ?? {}) as Record<string, unknown>;
  const preferredName = await loadPreferredName(user.id);

  const { insight, usedFallback } = await generateInsight({ system, label, detail, preferredName });

  await svc.from("insights").insert({
    user_id: user.id,
    system,
    item_key: key,
    body: insight.body,
    why: insight.why,
    cached: true,
  });
  await logEvent("llm_call", { kind: "insight", system, key, usedFallback }, user.id);

  return json({ system, key, body: insight.body, why: insight.why, cached: false });
}));
