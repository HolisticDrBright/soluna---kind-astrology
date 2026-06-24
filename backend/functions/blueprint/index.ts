/**
 * GET /blueprint — full blueprint
 * GET /blueprint/:system — one lens (astrology|numerology|chinese|human_design)
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";
import { computeAndPersistBlueprint } from "../_shared/engines/blueprint-service.ts";

const VALID_SYSTEMS = ["astrology", "numerology", "chinese", "human_design"] as const;

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);

    // Parse system from URL: /blueprint/:system
    const url = new URL(req.url);
    const pathParts = url.pathname.replace(/\/+$/, "").split("/");
    const system = pathParts[pathParts.length - 1];

    // If blueprint/<system>, return that lens only
    if (system && system !== "blueprint" && VALID_SYSTEMS.includes(system as typeof VALID_SYSTEMS[number])) {
      const { data: bp } = await supabase.from("blueprints")
        .select(`${system}, computed_at`)
        .eq("user_id", user.userId)
        .single();

      if (!bp) {
        return jsonResponse({ [system]: null, message: "No blueprint found. Complete onboarding first." }, 200);
      }

      return jsonResponse({
        system,
        data: bp[system],
        computedAt: bp.computed_at,
      });
    }

    // Full blueprint
    const { data: blueprint } = await supabase.from("blueprints")
      .select("*")
      .eq("user_id", user.userId)
      .single();

    if (!blueprint) {
      // Try to compute from birth profile if missing
      const { data: profile } = await supabase.from("birth_profiles")
        .select("*")
        .eq("user_id", user.userId)
        .single();

      if (!profile) {
        return jsonResponse({ blueprint: null, message: "No birth data found. Complete onboarding first." }, 200);
      }

      try {
        const { summary } = await computeAndPersistBlueprint({
          user_id: user.userId,
          full_birth_name: profile.full_birth_name,
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          time_known: profile.time_known,
          birth_place_label: profile.birth_place_label,
          lat: profile.lat ?? 0,
          lng: profile.lng ?? 0,
          timezone: profile.timezone ?? "UTC",
          house_system: (profile.house_system ?? "placidus") as "placidus" | "whole_sign" | "porphyry",
        }, user.userId);

        return jsonResponse({ blueprint: summary, recomputed: true });
      } catch (err) {
        return errorResponse("Failed to compute blueprint. Please try again.", 500);
      }
    }

    return jsonResponse({ blueprint });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse("Unauthorized", 401);
    }
    console.error("Blueprint error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
