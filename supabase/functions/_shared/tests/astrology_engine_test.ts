/**
 * computeAstrology must NEVER fabricate placements in production. With no provider
 * configured it returns a blocked chart; an explicit dev flag re-enables the
 * in-app estimate. Pure (the blocked/approximation paths make no network calls).
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assert, assertEquals } from "../test_util.ts";
import { astrologyInputHash, computeAstrology, type AstrologyOutput } from "../engines/astrology.ts";

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

// ─── Caching / anti-flapping ───────────────────────────────────────
// A previously-successful provider chart must be REUSED on recompute (stable, no
// re-call, no flapping), but only while the birth inputs are unchanged. A blocked
// result is never cached, so a transient failure can always recover next time.

function providerChart(input: typeof BIRTH): AstrologyOutput {
  return {
    planets: [{ planet: "Sun", sign: "Pisces", degree: 21.6, house: 10, retrograde: false }],
    ascendant: { sign: "Gemini", degree: 20.5 },
    mc: null,
    houses: [],
    aspects: [],
    timeRequired: false,
    source: "provider",
    provider: "freeastroapi",
    sourceInputHash: astrologyInputHash(input),
  };
}

Deno.test("cached provider chart is REUSED when inputs are unchanged (stable, no flapping)", async () => {
  clearProviders(); // no provider — so if it re-called instead of reusing, it would degrade to blocked
  const cached = providerChart(BIRTH);
  const out = await computeAstrology({ ...BIRTH }, { cachedAstrology: cached });
  assertEquals(out.source, "provider"); // reused, NOT downgraded
  assertEquals(out.sourceInputHash, cached.sourceInputHash);
  assertEquals(out.planets.length, 1);
});

Deno.test("cached provider chart is NOT reused when birth inputs change", async () => {
  clearProviders();
  const cached = providerChart(BIRTH);
  const out = await computeAstrology({ ...BIRTH, time: "09:00" }, { cachedAstrology: cached });
  // inputs changed → hash differs → cache miss → recompute → blocked (no provider configured)
  assertEquals(out.source, "blocked");
});

Deno.test("a cached blocked chart is never reused (a failure always gets retried)", async () => {
  clearProviders();
  Deno.env.set("ASTROLOGY_ALLOW_APPROXIMATION", "true"); // proves it re-ran (would be 'approximation', not the cached 'blocked')
  const cachedBlocked: AstrologyOutput = {
    planets: [], ascendant: null, mc: null, houses: [], aspects: [],
    timeRequired: false, source: "blocked", blockedReason: "provider_unavailable",
    sourceInputHash: astrologyInputHash(BIRTH),
  };
  const out = await computeAstrology({ ...BIRTH }, { cachedAstrology: cachedBlocked });
  assertEquals(out.source, "approximation");
  clearProviders();
});
