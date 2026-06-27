/**
 * POST /onboarding/blueprint
 * Save birth_profile, compute blueprint, return summary.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateBirthProfile } from "../_shared/schemas.ts";
import { computeAndPersistBlueprint } from "../_shared/engines/blueprint-service.ts";
import { logEvent } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const body = await req.json();

    const validation = validateBirthProfile(body);
    if (!validation.success) {
      return errorResponse(validation.error ?? "Invalid input", 400);
    }

    const input = validation.data!;

    // Save or update birth profile
    const { data: profile, error: profileErr } = await supabase
      .from("birth_profiles")
      .upsert({
        user_id: user.userId,
        full_birth_name: input.full_birth_name,
        birth_date: input.birth_date,
        birth_time: input.birth_time ?? null,
        time_known: input.time_known,
        birth_place_label: input.birth_place_label ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        timezone: input.timezone ?? "UTC",
        house_system: input.house_system ?? "placidus",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select("id")
      .single();

    if (profileErr || !profile) {
      return errorResponse(profileErr?.message ?? "Failed to save birth profile", 500);
    }

    // Update profile with preferred name if provided
    if (input.preferred_name) {
      await supabase.from("profiles")
        .update({ preferred_name: input.preferred_name })
        .eq("id", user.userId);
    }

    // Compute blueprint
    const { summary } = await computeAndPersistBlueprint({
      user_id: user.userId,
      full_birth_name: input.full_birth_name,
      birth_date: input.birth_date,
      birth_time: input.birth_time ?? null,
      time_known: input.time_known,
      birth_place_label: input.birth_place_label,
      lat: input.lat,
      lng: input.lng,
      timezone: input.timezone,
      house_system: (input.house_system ?? "placidus") as "placidus" | "whole_sign" | "porphyry",
    }, user.userId);

    await logEvent("onboarding_completed", { timeKnown: input.time_known }, user.userId);

    return jsonResponse({ summary, timeKnown: input.time_known });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse("Unauthorized", 401);
    }
    console.error("Onboarding error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
