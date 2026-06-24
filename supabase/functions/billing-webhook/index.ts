// POST /billing-webhook  (RevenueCat -> entitlements)
// verify_jwt is disabled for this function; we verify RevenueCat's configured
// Authorization header instead. The client sets RevenueCat appUserID = the
// Supabase user id, so event.app_user_id maps directly to user_id.
import { CORS_HEADERS, json, preflight } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { logEvent } from "../_shared/log.ts";

const ACTIVE_TYPES = new Set([
  "INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION", "NON_RENEWING_PURCHASE",
]);
const INACTIVE_TYPES = new Set(["CANCELLATION", "EXPIRATION", "BILLING_ISSUE", "SUBSCRIPTION_PAUSED"]);

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // Verify the shared secret RevenueCat sends in the Authorization header.
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (!secret || (auth !== secret && auth !== `Bearer ${secret}`)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let event: Record<string, unknown>;
  try {
    const payload = await req.json();
    event = (payload.event ?? payload) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const type = String(event.type ?? "");
  const appUserId = String(event.app_user_id ?? "");
  if (!appUserId) return json({ error: "Missing app_user_id" }, 400);

  const svc = serviceClient();

  // Ensure the user exists (defensive; should already from signup).
  const { data: userRow } = await svc.from("users").select("id").eq("id", appUserId).maybeSingle();
  if (!userRow) {
    await logEvent("webhook", { provider: "revenuecat", type, note: "unknown app_user_id" });
    return json({ ok: true, note: "user not found; ignored" });
  }

  const expiresMs = Number(event.expiration_at_ms ?? 0);
  const expiresAt = expiresMs ? new Date(expiresMs).toISOString() : null;
  const store = (event.store as string) ?? null;
  const productId = (event.product_id as string) ?? null;

  const isActive = ACTIVE_TYPES.has(type);
  const isInactive = INACTIVE_TYPES.has(type);
  // Non-renewing consumables (e.g. a single tarot reading) don't grant premium.
  const grantsPremium = isActive && type !== "NON_RENEWING_PURCHASE";

  await svc.from("subscriptions").upsert(
    {
      user_id: appUserId,
      revenuecat_app_user_id: appUserId,
      entitlement: grantsPremium ? "premium" : isInactive ? "free" : "free",
      status: isActive ? "active" : isInactive ? "expired" : "inactive",
      expires_at: expiresAt,
      store,
    },
    { onConflict: "user_id" },
  );

  if (type === "NON_RENEWING_PURCHASE" && productId) {
    await svc.from("purchases").insert({
      user_id: appUserId,
      product_id: productId,
      kind: "consumable",
    });
  }

  await logEvent("webhook", { provider: "revenuecat", type, grantsPremium }, appUserId);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
});
