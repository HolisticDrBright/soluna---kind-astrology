/**
 * GET /me — current user profile + blueprint summary + settings
 * PATCH /me — update preferred_name, birth details, notification_prefs, push_token
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateMeUpdate, validateBirthProfile } from "../_shared/schemas.ts";
import { computeAndPersistBlueprint } from "../_shared/engines/blueprint-service.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);

    // GET /me
    if (req.method === "GET") {
      const { data: profile } = await supabase.from("profiles")
        .select("id, email, preferred_name, full_name, avatar_url, created_at")
        .eq("id", user.userId)
        .single();

      const { data: birthProfile } = await supabase.from("birth_profiles")
        .select("*")
        .eq("user_id", user.userId)
        .single();

      const { data: notifPrefs } = await supabase.from("notification_prefs")
        .select("*")
        .eq("user_id", user.userId)
        .single();

      const { data: subscription } = await supabase.from("subscriptions")
        .select("entitlement, status, expires_at")
        .eq("user_id", user.userId)
        .single();

      const { data: blueprint } = await supabase.from("blueprints")
        .select("astrology, numerology, chinese, human_design")
        .eq("user_id", user.userId)
        .single();

      // Build summary chip
      const sun = (blueprint?.astrology as Record<string, unknown>)?.planets
        ? Array.isArray((blueprint?.astrology as Record<string, unknown>)?.planets)
          ? ((blueprint?.astrology as Record<string, unknown>)?.planets as Array<Record<string, unknown>>)
              .find((p: Record<string, unknown>) => p.planet === "Sun")?.sign ?? ""
          : ""
        : "";

      const summaryChip = [
        sun ? `☉ ${sun}` : null,
        (blueprint?.numerology as Record<string, unknown>)?.lifePath
          ? `Life Path ${(blueprint?.numerology as Record<string, unknown>)?.lifePath}`
          : null,
        (blueprint?.chinese as Record<string, unknown>)?.animal
          ? `${(blueprint?.chinese as Record<string, unknown>)?.animal}`
          : null,
        (blueprint?.human_design as Record<string, unknown>)?.type
          ? `${(blueprint?.human_design as Record<string, unknown>)?.type}`
          : null,
      ].filter(Boolean).join(" · ");

      return jsonResponse({
        profile,
        birthProfile: birthProfile ?? null,
        notificationPrefs: notifPrefs ?? {
          daily_time: "08:00",
          tz: "UTC",
          daily_reading: true,
          personal_day: true,
          moon_alerts: true,
          transit_alerts: false,
        },
        blueprint: blueprint ?? null,
        subscription: subscription ?? { entitlement: "free", status: "inactive" },
        summaryChip: summaryChip || "Complete onboarding to see your blueprint",
      });
    }

    // PATCH /me
    if (req.method === "PATCH") {
      const body = await req.json();
      const validation = validateMeUpdate(body);
      if (!validation.success) {
        return errorResponse(validation.error ?? "Invalid input", 400);
      }

      const updates = validation.data!;

      // Update preferred name
      if (updates.preferred_name) {
        await supabase.from("profiles")
          .update({ preferred_name: updates.preferred_name })
          .eq("id", user.userId);
      }

      // Update birth profile, then recompute the blueprint so the chart never
      // goes stale after a birth-data edit.
      if (updates.birth_profile) {
        const bpValidation = validateBirthProfile(updates.birth_profile);
        if (bpValidation.success && bpValidation.data) {
          const bp = bpValidation.data;
          await supabase.from("birth_profiles").upsert({
            user_id: user.userId,
            full_birth_name: bp.full_birth_name,
            birth_date: bp.birth_date,
            birth_time: bp.birth_time ?? null,
            time_known: bp.time_known,
            birth_place_label: bp.birth_place_label ?? null,
            lat: bp.lat ?? null,
            lng: bp.lng ?? null,
            timezone: bp.timezone ?? "UTC",
            house_system: bp.house_system ?? "placidus",
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

          // Recompute only with REAL coordinates + timezone — never guess a
          // location (that would fabricate chart precision). Without them the
          // existing blueprint stays until the user resolves their birth place.
          if (typeof bp.lat === "number" && typeof bp.lng === "number" && bp.timezone) {
            try {
              await computeAndPersistBlueprint({
                user_id: user.userId,
                full_birth_name: bp.full_birth_name,
                birth_date: bp.birth_date,
                birth_time: bp.birth_time ?? null,
                time_known: bp.time_known,
                birth_place_label: bp.birth_place_label,
                lat: bp.lat,
                lng: bp.lng,
                timezone: bp.timezone,
                house_system: (bp.house_system ?? "placidus") as "placidus" | "whole_sign" | "porphyry",
              }, user.userId);
            } catch (err) {
              console.error("Blueprint recompute after /me birth update failed:", err);
            }
          }
        }
      }

      // Update notification preferences
      if (updates.notification_prefs) {
        const prefs = updates.notification_prefs;
        await supabase.from("notification_prefs").upsert({
          user_id: user.userId,
          daily_time: prefs.daily_time ?? "08:00",
          tz: prefs.tz ?? "UTC",
          daily_reading: prefs.daily_reading ?? true,
          personal_day: prefs.personal_day ?? true,
          moon_alerts: prefs.moon_alerts ?? true,
          transit_alerts: prefs.transit_alerts ?? false,
        }, { onConflict: "user_id" });
      }

      // Save push token
      if (updates.push_token) {
        const { error: tokenErr } = await supabase.from("push_tokens").upsert({
          user_id: user.userId,
          expo_token: updates.push_token.expo_token,
          platform: updates.push_token.platform ?? "ios",
        }, { onConflict: "user_id, expo_token" });

        if (tokenErr) {
          console.error("Failed to save push token:", tokenErr.message);
        }
      }

      return jsonResponse({ ok: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse("Unauthorized", 401);
    }
    console.error("Me error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
