// Proves the money- and security-critical webhook logic: invalid auth is
// rejected, malformed payloads are rejected, renewals are recorded as
// subscriptions (never one-time/consumable), consumables never flip the
// subscription, and cancellations keep premium only until expiry.

import { assert, assertEquals } from "../test_util.ts";
import {
  classifyEvent,
  resolveSubscription,
  validateEvent,
  verifyWebhookAuth,
} from "../billing.ts";

// ─── auth ──────────────────────────────────────────────────────────
Deno.test("verifyWebhookAuth accepts raw + Bearer, rejects everything else", () => {
  assertEquals(verifyWebhookAuth("s3cret", "s3cret"), true);
  assertEquals(verifyWebhookAuth("Bearer s3cret", "s3cret"), true);
  assertEquals(verifyWebhookAuth("wrong", "s3cret"), false);
  assertEquals(verifyWebhookAuth("", "s3cret"), false);
  assertEquals(verifyWebhookAuth(null, "s3cret"), false);
});

Deno.test("verifyWebhookAuth FAILS CLOSED when no secret configured", () => {
  // A misconfigured server must not accept anonymous webhooks.
  assertEquals(verifyWebhookAuth("anything", undefined), false);
  assertEquals(verifyWebhookAuth("anything", ""), false);
  assertEquals(verifyWebhookAuth(null, null), false);
});

// ─── payload validation ────────────────────────────────────────────
Deno.test("validateEvent accepts the {event:...} envelope and a flat event", () => {
  const env = validateEvent({ event: { type: "RENEWAL", app_user_id: "u1" } });
  assert(env.ok && env.event.type === "RENEWAL" && env.event.appUserId === "u1");
  const flat = validateEvent({ type: "INITIAL_PURCHASE", app_user_id: "u2" });
  assert(flat.ok && flat.event.appUserId === "u2");
});

Deno.test("validateEvent rejects malformed payloads", () => {
  assert(!validateEvent(null).ok);
  assert(!validateEvent("nope").ok);
  assert(!validateEvent({ event: { app_user_id: "u1" } }).ok, "missing type");
  assert(!validateEvent({ type: "RENEWAL" }).ok, "missing app_user_id");
  assert(!validateEvent({ type: "  ", app_user_id: "u1" }).ok, "blank type");
});

Deno.test("validateEvent normalizes expiration_at_ms to ISO (or null)", () => {
  const withExp = validateEvent({ type: "RENEWAL", app_user_id: "u1", expiration_at_ms: 1_900_000_000_000 });
  assert(withExp.ok && typeof withExp.event.expiresAt === "string");
  const noExp = validateEvent({ type: "RENEWAL", app_user_id: "u1" });
  assert(noExp.ok && noExp.event.expiresAt === null);
});

// ─── classification (the purchase-kind bug) ─────────────────────────
Deno.test("RENEWAL is a subscription purchase, never consumable", () => {
  const c = classifyEvent("RENEWAL");
  assertEquals(c.purchaseKind, "subscription");
  assertEquals(c.action, "activate");
  assertEquals(c.grantsPremium, true);
});

Deno.test("INITIAL_PURCHASE records a subscription + activates", () => {
  const c = classifyEvent("INITIAL_PURCHASE");
  assertEquals(c.purchaseKind, "subscription");
  assertEquals(c.action, "activate");
});

Deno.test("NON_RENEWING_PURCHASE is consumable and NEVER touches the subscription", () => {
  const c = classifyEvent("NON_RENEWING_PURCHASE");
  assertEquals(c.purchaseKind, "consumable");
  assertEquals(c.action, "none"); // must not flip premium<->free
  assertEquals(c.grantsPremium, false);
  // resolveSubscription returns null => handler skips the subscriptions upsert.
  assertEquals(resolveSubscription(c, null, 0), null);
});

Deno.test("PRODUCT_CHANGE / UNCANCELLATION activate but record NO new purchase", () => {
  for (const t of ["PRODUCT_CHANGE", "UNCANCELLATION"]) {
    const c = classifyEvent(t);
    assertEquals(c.action, "activate");
    assertEquals(c.purchaseKind, null);
  }
});

Deno.test("EXPIRATION / BILLING_ISSUE / PAUSE expire to free", () => {
  for (const t of ["EXPIRATION", "BILLING_ISSUE", "SUBSCRIPTION_PAUSED"]) {
    const c = classifyEvent(t);
    assertEquals(c.action, "expire");
    const patch = resolveSubscription(c, null, 0);
    assertEquals(patch?.entitlement, "free");
    assertEquals(patch?.status, "expired");
  }
});

Deno.test("unknown event types are acknowledged as no-ops", () => {
  const c = classifyEvent("TRANSFER");
  assertEquals(c.action, "none");
  assertEquals(c.purchaseKind, null);
  assertEquals(resolveSubscription(c, null, 0), null);
});

// ─── cancellation keeps access until expiry ─────────────────────────
Deno.test("CANCELLATION keeps premium while paid period remains, then free", () => {
  const c = classifyEvent("CANCELLATION");
  assertEquals(c.action, "cancel");
  const now = 1_000_000_000_000;
  const future = new Date(now + 86_400_000).toISOString();
  const past = new Date(now - 86_400_000).toISOString();

  const stillPaid = resolveSubscription(c, future, now);
  assertEquals(stillPaid?.entitlement, "premium");
  assertEquals(stillPaid?.status, "cancelled");

  const lapsed = resolveSubscription(c, past, now);
  assertEquals(lapsed?.entitlement, "free");
  assertEquals(lapsed?.status, "cancelled");
});
