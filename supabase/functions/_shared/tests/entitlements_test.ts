import { assert } from "../test_util.ts";
import { isEntitlementActive } from "../entitlements.ts";

const NOW = Date.parse("2026-06-24T00:00:00Z");

Deno.test("active + future expiry => premium", () => {
  assert(isEntitlementActive("active", "2026-07-24T00:00:00Z", NOW));
  assert(isEntitlementActive("active", null, NOW)); // no expiry = ongoing
});

Deno.test("expired or inactive => not premium", () => {
  assert(!isEntitlementActive("active", "2026-05-24T00:00:00Z", NOW)); // expired
  assert(!isEntitlementActive("expired", "2026-07-24T00:00:00Z", NOW));
  assert(!isEntitlementActive("inactive", null, NOW));
});
