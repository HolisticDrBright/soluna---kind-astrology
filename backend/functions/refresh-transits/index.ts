/**
 * Worker: refresh-transits
 * Runs daily at midnight. Precomputes transit snapshots for /today.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";

Deno.serve(async (_req: Request) => {
  try {
    // For now, transits are computed on-the-fly in the today function
    // This worker logs that the refresh ran and can be extended later
    await logEvent("transits_refreshed", { date: new Date().toISOString().split("T")[0] });

    return new Response(JSON.stringify({ ok: true, refreshed: new Date().toISOString() }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Refresh transits error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
