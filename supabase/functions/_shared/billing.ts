// Pure, unit-testable helpers for the RevenueCat webhook. Keeping the auth
// check, payload validation, and event classification out of the HTTP handler
// lets us prove the security- and money-critical paths without a live request.

export type PurchaseKind = "subscription" | "consumable";

/** What an event implies for the user's subscription lifecycle. */
export type SubscriptionAction = "activate" | "cancel" | "expire" | "none";

export interface EventClass {
  /** How to move the subscription row (or leave it alone). */
  action: SubscriptionAction;
  /**
   * Whether premium should be granted. For "cancel" this is conditional on the
   * expiration still being in the future (RevenueCat keeps access until then).
   */
  grantsPremium: boolean;
  /**
   * When set, a purchases row should be recorded — only for events where money
   * actually changed hands. Renewals are "subscription", one-off consumables are
   * "consumable". Never null-vs-consumable confusion: a renewal is NEVER a
   * one-time/consumable purchase.
   */
  purchaseKind: PurchaseKind | null;
}

export interface NormalizedEvent {
  type: string;
  appUserId: string;
  expiresAt: string | null;
  store: string | null;
  productId: string | null;
}

/**
 * Verify the shared secret RevenueCat sends in the Authorization header.
 * Fails closed: if no secret is configured, NO request is authorized.
 */
export function verifyWebhookAuth(
  authHeader: string | null,
  secret: string | undefined | null,
): boolean {
  if (!secret) return false;
  if (!authHeader) return false;
  return authHeader === secret || authHeader === `Bearer ${secret}`;
}

/**
 * Validate + normalize the webhook payload. RevenueCat wraps the event in an
 * `event` envelope; we accept either shape. Returns a typed error string when
 * the payload is unusable so the handler can answer 400.
 */
export function validateEvent(
  payload: unknown,
): { ok: true; event: NormalizedEvent } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const root = payload as Record<string, unknown>;
  const raw = (root.event ?? root) as Record<string, unknown>;
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Missing event object" };
  }

  const type = typeof raw.type === "string" ? raw.type.trim() : "";
  if (!type) return { ok: false, error: "Missing event.type" };

  const appUserId = typeof raw.app_user_id === "string" ? raw.app_user_id.trim() : "";
  if (!appUserId) return { ok: false, error: "Missing event.app_user_id" };

  const expiresMs = Number(raw.expiration_at_ms ?? 0);
  const expiresAt = Number.isFinite(expiresMs) && expiresMs > 0
    ? new Date(expiresMs).toISOString()
    : null;

  return {
    ok: true,
    event: {
      type,
      appUserId,
      expiresAt,
      store: typeof raw.store === "string" ? raw.store : null,
      productId: typeof raw.product_id === "string" ? raw.product_id : null,
    },
  };
}

const ACTIVATE = new Set(["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"]);
const EXPIRE = new Set(["EXPIRATION", "BILLING_ISSUE", "SUBSCRIPTION_PAUSED"]);
// Real money events that warrant a purchases row, and the kind to record.
const PURCHASE_KIND: Record<string, PurchaseKind> = {
  INITIAL_PURCHASE: "subscription",
  RENEWAL: "subscription",
  NON_RENEWING_PURCHASE: "consumable",
};

/**
 * Classify a RevenueCat event type into a subscription action + purchase kind.
 * Pure function of the type string — no side effects, fully testable.
 */
export function classifyEvent(type: string): EventClass {
  const purchaseKind = PURCHASE_KIND[type] ?? null;

  // A non-renewing consumable must NEVER touch the subscription row — buying a
  // single tarot reading should not flip a premium user to free, nor a free
  // user to active.
  if (type === "NON_RENEWING_PURCHASE") {
    return { action: "none", grantsPremium: false, purchaseKind };
  }
  if (ACTIVATE.has(type)) {
    return { action: "activate", grantsPremium: true, purchaseKind };
  }
  if (type === "CANCELLATION") {
    // Auto-renew off, but access continues until expiration.
    return { action: "cancel", grantsPremium: true, purchaseKind };
  }
  if (EXPIRE.has(type)) {
    return { action: "expire", grantsPremium: false, purchaseKind };
  }
  // TRANSFER, SUBSCRIBER_ALIAS, TEST, and anything unknown: acknowledge, no-op.
  return { action: "none", grantsPremium: false, purchaseKind };
}

export interface SubscriptionPatch {
  entitlement: "free" | "premium";
  status: "active" | "cancelled" | "expired";
}

/**
 * Resolve the final subscription row state from the classification + expiration.
 * Returns null when the event should not modify the subscription row at all
 * (consumables / ignored types).
 */
export function resolveSubscription(
  cls: EventClass,
  expiresAt: string | null,
  now: number,
): SubscriptionPatch | null {
  switch (cls.action) {
    case "activate":
      return { entitlement: "premium", status: "active" };
    case "cancel": {
      // Keep premium only while the paid period is still in the future.
      const stillActive = !!expiresAt && Date.parse(expiresAt) > now;
      return { entitlement: stillActive ? "premium" : "free", status: "cancelled" };
    }
    case "expire":
      return { entitlement: "free", status: "expired" };
    case "none":
      return null;
  }
}
