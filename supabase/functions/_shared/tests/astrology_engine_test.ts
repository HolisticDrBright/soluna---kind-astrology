/**
 * computeAstrology must NEVER fabricate placements in production. With no provider
 * configured it returns a blocked chart; an explicit dev flag re-enables the
 * in-app estimate. Pure (the blocked/approximation paths make no network calls).
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assert, assertEquals } from "../test_util.ts";
import { computeAstrology } from "../engines/astrology.ts";

const PROVIDER_KEYS = [
  "ASTROLOGY_PROVIDER",
  "ASTROLOGY_API_KEY",
  "ASTROLOGY_API_BASE_URL",
  "ASTROLOGY_API_USER_ID",
  "PROKERALA_CLIENT_ID",
  "PROKERALA_CLIENT_SECRET",
  "ASTROLOGY_ALLOW_APPROXIMATION",
];
const clearProviders = () => PROVIDER_KEYS.forEach((k) => Deno.env.delete(k));

const BIRTH = { date: "1993-03-12", time: "14:15", lat: 19.076, lng: 72.8777, timezone: "Asia/Kolkata" };

Deno.test("no provider configured => blocked (no fabricated placements)", async () => {
  clearProviders();
  const out = await computeAstrology({ ...BIRTH });
  assertEquals(out.source, "blocked");
  assertEquals(out.blockedReason, "provider_not_configured");
  assertEquals(out.planets.length, 0);
});

Deno.test("provider set but coordinates missing => blocked (missing_location), no network", async () => {
  clearProviders();
  Deno.env.set("ASTROLOGY_PROVIDER", "astrologyapi");
  Deno.env.set("ASTROLOGY_API_KEY", "x");
  const out = await computeAstrology({ ...BIRTH, lat: Number.NaN, lng: Number.NaN });
  assertEquals(out.source, "blocked");
  assertEquals(out.blockedReason, "missing_location");
  clearProviders();
});

Deno.test("ASTROLOGY_ALLOW_APPROXIMATION=true re-enables the in-app estimate (dev only)", async () => {
  clearProviders();
  Deno.env.set("ASTROLOGY_ALLOW_APPROXIMATION", "true");
  const out = await computeAstrology({ ...BIRTH });
  assertEquals(out.source, "approximation");
  assert(out.planets.length > 0);
  clearProviders();
});
