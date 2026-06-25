/**
 * Worker: compute-blueprint-worker
 * Drains pgmq queue and computes blueprints for pending users.
 * Invoked by pg_cron every minute.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { computeAndPersistBlueprint } from "../_shared/engines/blueprint-service.ts";
import { requireInternalSecret } from "../_shared/internal-auth.ts";

Deno.serve(async (req: Request) => {
  const unauthorized = requireInternalSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const sb = getSupabaseAdmin();

    // Find users with birth profiles but no blueprint
    const { data: profiles } = await sb.from("birth_profiles")
      .select("*, user_id")
      .order("created_at", { ascending: true })
      .limit(10);

    if (!profiles?.length) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    for (const profile of profiles) {
      // Check if blueprint already exists
      const { data: existing } = await sb.from("blueprints")
        .select("id")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (existing) continue;

      try {
        if (
          typeof profile.lat !== "number" ||
          typeof profile.lng !== "number" ||
          !profile.timezone
        ) {
          await logEvent("blueprint_worker_skipped_missing_location", {
            userId: profile.user_id,
            missingInputs: [
              typeof profile.lat === "number" ? null : "birth_place_latitude",
              typeof profile.lng === "number" ? null : "birth_place_longitude",
              profile.timezone ? null : "birth_place_timezone",
            ].filter(Boolean),
          }, profile.user_id);
          continue;
        }

        await computeAndPersistBlueprint({
          user_id: profile.user_id,
          full_birth_name: profile.full_birth_name,
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          time_known: profile.time_known,
          birth_place_label: profile.birth_place_label,
          lat: profile.lat,
          lng: profile.lng,
          timezone: profile.timezone,
          house_system: (profile.house_system ?? "placidus") as "placidus" | "whole_sign" | "porphyry",
        }, profile.user_id);
        processed++;
      } catch (err) {
        console.error(`Failed blueprint for user ${profile.user_id}:`, err);
        await logEvent("blueprint_worker_error", {
          userId: profile.user_id,
          error: String(err),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
