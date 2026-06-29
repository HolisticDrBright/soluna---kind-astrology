/**
 * Resonance Feedback / "Tune Soluna to You"
 *
 * POST   /resonance          — submit "did this resonate?" feedback, then
 *                              deterministically recompute the personalization
 *                              profile from the user's recent feedback.
 * GET    /resonance/profile  — fetch the caller's personalization profile.
 * DELETE /resonance/profile  — reset personalization (clears profile + feedback).
 *
 * Feedback only ever adjusts HOW Soluna communicates (tone, emphasis, examples,
 * action style). It never changes chart facts, placements, BaZi pillars, numbers,
 * tarot draws, transits, compatibility math, or safety rules.
 */

import { requireAuth, createUserClient, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";
import { validateResonanceFeedback } from "../_shared/schemas.ts";
import {
  recomputePersonalization,
  fetchPersonalizationProfile,
  systemFitRanking,
  type ResonanceRow,
} from "../_shared/personalization.ts";

// Recompute the profile from the most recent N feedbacks (gradual, bounded).
const RECENT_LIMIT = 50;

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const user = await requireAuth(req);
    const supabase = createUserClient(req);
    const url = new URL(req.url);
    const isProfile = url.pathname.endsWith("/profile");

    // GET /resonance/profile — owner-scoped read (RLS). Also returns the
    // per-system fit ranking computed live from the user's own feedback rows.
    if (req.method === "GET" && isProfile) {
      const profile = await fetchPersonalizationProfile(supabase, user.userId);
      const { data: rows } = await supabase.from("resonance_feedback")
        .select("resonance, reason_tags, reframe_requested, systems_referenced, free_text")
        .eq("user_id", user.userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT);
      const systemFit = systemFitRanking((rows ?? []) as ResonanceRow[]);
      return jsonResponse({ profile, systemFit });
    }

    // DELETE /resonance/profile — let the user reset their personalization.
    if (req.method === "DELETE" && isProfile) {
      await supabase.from("personalization_profiles").delete().eq("user_id", user.userId);
      await supabase.from("resonance_feedback").delete().eq("user_id", user.userId);
      await logEvent("resonance_reset", {}, user.userId);
      return jsonResponse({ ok: true, message: "Your personalization has been reset." });
    }

    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    const body = await req.json();
    const validation = validateResonanceFeedback(body);
    if (!validation.success) return errorResponse(validation.error ?? "Invalid input", 400);
    const fb = validation.data!;

    // 1) Persist the raw feedback (owner-scoped insert via RLS).
    const { error: insertErr } = await supabase.from("resonance_feedback").insert({
      user_id: user.userId,
      source_type: fb.sourceType,
      source_id: fb.sourceId,
      resonance: fb.resonance,
      reason_tags: fb.reasonTags,
      free_text: fb.freeText,
      reframe_requested: fb.reframeRequested,
      systems_referenced: fb.systemsReferenced,
    });
    if (insertErr) {
      console.error("Resonance insert failed:", insertErr.message);
      return errorResponse("Could not save your feedback. Please try again.", 500);
    }

    // 2) DETERMINISTICALLY recompute the personalization profile from recent
    //    feedback. Written via the service role only (clients can't write it),
    //    so the rules are the single source of truth.
    const admin = getSupabaseAdmin();
    const { data: rows } = await admin.from("resonance_feedback")
      .select("resonance, reason_tags, reframe_requested, systems_referenced, free_text")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT);

    const derived = recomputePersonalization((rows ?? []) as ResonanceRow[]);
    const { error: upsertErr } = await admin.from("personalization_profiles").upsert({
      user_id: user.userId,
      ...derived,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (upsertErr) console.error("Personalization upsert failed:", upsertErr.message);

    await logEvent("resonance_feedback", {
      sourceType: fb.sourceType,
      resonance: fb.resonance,
      reasonTags: fb.reasonTags,
      reframe: fb.reframeRequested,
      feedbackCount: derived.feedback_count,
    }, user.userId);

    // Humble, trust-building acknowledgement — never defensive, never flattering.
    const message = fb.resonance === "yes"
      ? "Thank you — I'm so glad that resonated. I'll keep tuning to you."
      : "Thank you. I'll tune future guidance toward what feels more useful for you.";

    return jsonResponse({ ok: true, message, summary: derived.summary });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Resonance error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
