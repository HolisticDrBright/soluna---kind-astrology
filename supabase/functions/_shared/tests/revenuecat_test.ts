/**
 * RevenueCat webhook auth + app_user_id mapping helpers. Pure, no network.
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assert } from "../test_util.ts";
import { isAuthorizedRevenueCatRequest, isUuid } from "../revenuecat.ts";

Deno.test("authorizes only the exact Bearer <secret> header", () => {
  assert(isAuthorizedRevenueCatRequest("Bearer s3cret", "s3cret"));
  assert(!isAuthorizedRevenueCatRequest("Bearer wrong", "s3cret"));
  assert(!isAuthorizedRevenueCatRequest("s3cret", "s3cret")); // missing Bearer prefix
  assert(!isAuthorizedRevenueCatRequest("", "s3cret")); // missing header
});

Deno.test("never authorizes when the secret is unconfigured", () => {
  assert(!isAuthorizedRevenueCatRequest("Bearer ", ""));
  assert(!isAuthorizedRevenueCatRequest("", ""));
});

Deno.test("isUuid recognizes a real app_user_id and rejects junk / anonymous ids", () => {
  assert(isUuid("3f0c2e5a-9b1d-4c2a-8e7f-1a2b3c4d5e6f"));
  assert(!isUuid("not-a-uuid"));
  assert(!isUuid("$RCAnonymousID:abc123")); // anonymous RC id must not map to a profile
});
