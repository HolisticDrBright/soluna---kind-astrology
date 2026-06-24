/**
 * Worker: reconcile-entitlements
 * Runs daily at 2am UTC. Sweeps subscriptions to reconcile status.
 */

import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";

Deno.serve(async (_req: Request) => {
  try {
    const sb = getSupabaseAdmin();

    // Expire subscriptions past their expiration date
    const { data: expired } = await sb.from("subscriptions")
      .select("id, user_id")
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString())
      .limit(100);

    if (expired?.length) {
      for (const sub of expired) {
        await sb.from("subscriptions")
          .update({ status: "expired" })
          .eq("id", sub.id);

        await logEvent("entitlement_expired", { subId: sub.id }, sub.user_id);
      }
    }

    await logEvent("entitlements_reconciled", { expired: expired?.length ?? 0 });

    return new Response(JSON.stringify({ ok: true, expired: expired?.length ?? 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Reconcile entitlements error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
