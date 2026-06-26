/**
 * Pure RevenueCat webhook helpers — no network, no Deno.serve — so the auth and
 * user-mapping logic stays unit-testable. The billing-webhook Edge Function
 * imports these. See _shared/tests/revenuecat_test.ts.
 */

/** A Soluna profile id is a UUID. RevenueCat anonymous ids ($RCAnonymousID:…) are not. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * RevenueCat is configured to send `Authorization: Bearer <secret>`. The request
 * is authorized only when the header matches the configured secret exactly. An
 * empty configured secret never authorizes (the caller treats that as misconfig).
 */
export function isAuthorizedRevenueCatRequest(authHeader: string, configuredSecret: string): boolean {
  if (!configuredSecret) return false;
  return authHeader === `Bearer ${configuredSecret}`;
}
