/**
 * Pure RevenueCat webhook helpers — no network, no Deno.serve — so the auth and
 * user-mapping logic stays unit-testable. The billing-webhook Edge Function
 * imports these. See _shared/tests/revenuecat_test.ts.
 */

/** A Soluna profile id is a UUID. RevenueCat anonymous ids ($RCAnonymousID:…) are not. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Length-independent constant-time string compare (resists timing attacks). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * RevenueCat is configured to send `Authorization: Bearer <secret>`. The request
 * is authorized only when the header matches the configured secret exactly
 * (constant-time). An empty configured secret never authorizes — the caller
 * treats that as a misconfiguration and rejects the request (HTTP 500), and an
 * invalid header is rejected (HTTP 401); neither is merely logged.
 */
export function isAuthorizedRevenueCatRequest(authHeader: string, configuredSecret: string): boolean {
  if (!configuredSecret) return false;
  return timingSafeEqual(authHeader, `Bearer ${configuredSecret}`);
}
