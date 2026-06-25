/**
 * POST /billing/revenuecat/webhook — RevenueCat webhook handler.
 * Verifies signature, upserts subscriptions/entitlements.
 */

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseAdmin, logEvent } from "../_shared/supabase.ts";

interface RCWebhookEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id?: string;
    entitlement_ids?: string[];
    expiration_at_ms?: number;
    store?: string;
  };
}

const WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    // Basic auth header verification (simplified — RevenueCat uses Authorization header)
    const authHeader = req.headers.get("Authorization") ?? "";
    if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.warn("RevenueCat webhook received without valid auth header");
      return errorResponse("Unauthorized", 401);
    }

    const body: RCWebhookEvent = await req.json();
    const event = body.event;

    if (!event?.app_user_id) {
      return jsonResponse({ ok: false, reason: "missing app_user_id" });
    }

    const sb = getSupabaseAdmin();

    // Find user by revenuecat app_user_id or create a mapping
    // For now, we treat app_user_id as a direct mapping
    const { data: existingSub } = await sb.from("subscriptions")
      .select("id, user_id")
      .eq("revenuecat_app_user_id", event.app_user_id)
      .maybeSingle();

    let userId = existingSub?.user_id ?? null;
    if (!userId && isUuid(event.app_user_id)) {
      const { data: profile } = await sb.from("profiles")
        .select("id")
        .eq("id", event.app_user_id)
        .maybeSingle();
      userId = profile?.id ?? null;
    }

    if (!userId) {
      await logEvent("revenuecat_unmapped_user", {
        appUserId: event.app_user_id,
        type: event.type,
      });
      return errorResponse("RevenueCat user is not mapped to a Soluna profile", 400);
    }

    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL": {
        await sb.from("subscriptions").upsert({
          user_id: userId,
          revenuecat_app_user_id: event.app_user_id,
          entitlement: event.entitlement_ids?.[0] ?? "premium",
          status: "active",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          store: event.store ?? "app_store",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        await logEvent("subscription_activated", {
          type: event.type,
          entitlement: event.entitlement_ids?.[0],
        }, userId);
        break;
      }

      case "CANCELLATION":
      case "EXPIRATION": {
        await sb.from("subscriptions").upsert({
          user_id: userId,
          revenuecat_app_user_id: event.app_user_id,
          status: event.type === "EXPIRATION" ? "expired" : "inactive",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        await logEvent("subscription_ended", { type: event.type }, userId);
        break;
      }

      case "TRANSFER":
      case "PRODUCT_CHANGE": {
        await sb.from("subscriptions").upsert({
          user_id: userId,
          revenuecat_app_user_id: event.app_user_id,
          entitlement: event.entitlement_ids?.[0] ?? "premium",
          expires_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        break;
      }

      default:
        console.log("Unhandled RevenueCat event type:", event.type);
    }

    // Record purchase if product_id present
    if (event.product_id) {
      await sb.from("purchases").insert({
        user_id: userId,
        product_id: event.product_id,
        kind: event.type === "NON_RENEWING_PURCHASE" ? "one_time" : "subscription",
      });
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("RevenueCat webhook error:", err);
    return errorResponse(err instanceof Error ? err.message : "Webhook processing error", 500);
  }
});
