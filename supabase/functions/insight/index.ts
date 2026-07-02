/**
 * GET /insight?system=&key= — warm interpretation + why for any blueprint item.
 * Cache-first, else generates via LLM and stores.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { generateInsight } from "../_shared/synthesis/index.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const url = new URL(req.url);
    const system = url.searchParams.get("system");
    const key = url.searchParams.get("key");

    if (!system || !key) {
      return errorResponse("system and key query params required", 400);
    }

    const validSystems = ["astrology", "numerology", "chinese", "human_design", "tarot"];
    if (!validSystems.includes(system)) {
      return errorResponse(`Invalid system. Must be one of: ${validSystems.join(", ")}`, 400);
    }

    // Get detail from placements FIRST — the cache key must include the
    // placement's VALUE. A key like "life_path" alone would cache the first
    // user's "Life Path 8" text and serve it to every Life Path 3 user forever
    // (cross-user leakage of chart-derived content).
    const { data: placement } = await supabase.from("placements")
      .select("detail, label")
      .eq("system", system)
      .eq("key", key)
      .maybeSingle();

    const detail = (placement?.detail as Record<string, unknown>) ?? {};
    const valueSig = [
      detail.sign, detail.number, detail.animal, detail.element,
      detail.type, detail.authority, detail.profile, detail.strategy,
    ].find((v) => v !== undefined && v !== null && v !== "");
    const cacheKey = valueSig !== undefined
      ? `${key}::${String(valueSig).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
      : null;

    // Check cache (only when the key is value-scoped).
    if (cacheKey) {
      const { data: cached } = await supabase.from("insights")
        .select("*")
        .eq("system", system)
        .eq("item_key", cacheKey)
        .single();
      if (cached) {
        return jsonResponse(cached);
      }
    }

    // Generate via LLM
    const insight = await generateInsight(system, key, detail);

    // Cache it — but never under a value-less key (see above).
    const sbAdmin = getSupabaseAdmin();
    let saved: Record<string, unknown> | null = null;
    if (cacheKey) {
      const { data } = await sbAdmin.from("insights")
        .upsert({
          system,
          item_key: cacheKey,
          body: insight.body,
          why: insight.why,
          cached: true,
        }, { onConflict: "system, item_key" })
        .select()
        .single();
      saved = data;
    }

    await logEvent("insight_generated", { system, key }, user.userId);

    return jsonResponse(saved ?? { system, item_key: key, ...insight });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Insight error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
