// POST /billing-webhook  (RevenueCat -> entitlements)
// verify_jwt is disabled for this function; we verify RevenueCat's configured
// Authorization header instead (fail-closed). The client sets RevenueCat
// appUserID = the Supabase user id, but we never trust it blindly — every event
// is matched against an existing users row before we touch any state.
import { CORS_HEADERS, json, preflight } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";
import {
  classifyEvent,
  resolveSubscription,
  validateEvent,
  verifyWebhookAuth,
} from "../_shared/billing.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // 1. Reject anything without the configured shared secret. Fail closed.
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!verifyWebhookAuth(req.headers.get("Authorization"), secret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  // 2. Parse + validate the payload shape before doing anything else.
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const validated = validateEvent(payload);
  if (!validated.ok) return json({ error: validated.error }, 400);
  const { type, appUserId, expiresAt, store, productId } = validated.event;

  const svc = serviceClient();

  // 3. Never trust the app_user_id — only act if it maps to a real user.
  const { data: userRow } = await svc.from("users").select("id").eq("id", appUserId).maybeSingle();
  if (!userRow) {
    await logEvent("webhook", { provider: "revenuecat", type, note: "unknown app_user_id" });
    return json({ ok: true, note: "user not found; ignored" });
  }

  const cls = classifyEvent(type);

  // 4. Record a purchases row ONLY for real money events, with the correct kind.
  //    Renewals are "subscription", never "consumable".
  if (cls.purchaseKind && productId) {
    await svc.from("purchases").insert({
      user_id: appUserId,
      product_id: productId,
      kind: cls.purchaseKind,
    });
  }

  // 5. Move the subscription row only when the event implies a lifecycle change.
  //    Consumables and ignored types leave entitlement untouched.
  const patch = resolveSubscription(cls, expiresAt, Date.now());
  if (patch) {
    await svc.from("subscriptions").upsert(
      {
        user_id: appUserId,
        revenuecat_app_user_id: appUserId,
        entitlement: patch.entitlement,
        status: patch.status,
        expires_at: expiresAt,
        store,
      },
      { onConflict: "user_id" },
    );
  }

  await logEvent("webhook", {
    provider: "revenuecat",
    type,
    action: cls.action,
    grantsPremium: patch?.entitlement === "premium",
    purchaseKind: cls.purchaseKind,
  }, appUserId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
});
