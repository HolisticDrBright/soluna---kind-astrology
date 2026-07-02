/**
 * Per-user daily usage caps for the LLM-backed endpoints. Every Ask message and
 * every mood-reframe generation is a real Anthropic call (and, uncached, real
 * provider calls too), so an unmetered endpoint is an open tab. Counters live in
 * usage_counters (service-role only) and are bumped atomically via the
 * increment_usage SQL function.
 *
 * FAIL-OPEN by design: if the table/function isn't migrated yet or the RPC
 * errors, we log and allow the request — a missing quota system must never
 * take the product down.
 */

import { getSupabaseAdmin } from "./supabase.ts";

/** Bump today's counter for (user, kind) and return the new count, or null when
 *  the counter is unavailable (treat as "allow"). Day is the UTC date — the cap
 *  is a rolling abuse guard, not a user-facing calendar feature. */
export async function bumpDailyUsage(userId: string, kind: string): Promise<number | null> {
  const day = new Date().toISOString().split("T")[0];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.rpc("increment_usage", {
    p_user: userId,
    p_day: day,
    p_kind: kind,
  });
  if (error) {
    console.error(`usage counter unavailable for ${kind} (allowing request):`, error.message);
    return null;
  }
  const n = Number(data);
  return Number.isFinite(n) ? n : null;
}
