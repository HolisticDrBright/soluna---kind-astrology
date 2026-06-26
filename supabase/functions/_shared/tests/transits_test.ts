/**
 * Transit capability is OFF until explicitly enabled, and the normalizer maps a
 * provider transit payload without fabricating anything. These guard the "honest,
 * limited to what's available" rule for transits.
 * Run: deno test --allow-env --allow-read supabase/functions/_shared/tests
 */

import { assert, assertEquals } from "../test_util.ts";
import { getTransitCapability, normalizeTransits } from "../engines/astrology-providers.ts";

const TRANSIT_ENV = [
  "ASTROLOGY_PROVIDER",
  "ASTROLOGY_API_KEY",
  "ASTROLOGY_TRANSITS_ENABLED",
  "ASTROLOGY_TRANSITS_ENDPOINT",
  "ASTROLOGY_API_BASE_URL",
];

function clearEnv() {
  for (const k of TRANSIT_ENV) Deno.env.delete(k);
}

Deno.test("transits are disabled when no provider is configured", () => {
  clearEnv();
  const cap = getTransitCapability();
  assertEquals(cap.enabled, false);
  assert(/no astrology provider/i.test(cap.reason));
  clearEnv();
});

Deno.test("transits stay off until explicitly opted in, then need an endpoint", () => {
  clearEnv();
  Deno.env.set("ASTROLOGY_PROVIDER", "astrologyapi");
  Deno.env.set("ASTROLOGY_API_KEY", "test-key");

  // Provider configured but no opt-in → off.
  let cap = getTransitCapability();
  assertEquals(cap.enabled, false);
  assert(/off|ASTROLOGY_TRANSITS_ENABLED/i.test(cap.reason));

  // Opted in but missing endpoint → still off, with a clear reason.
  Deno.env.set("ASTROLOGY_TRANSITS_ENABLED", "true");
  cap = getTransitCapability();
  assertEquals(cap.enabled, false);
  assert(/endpoint/i.test(cap.reason));

  // Fully configured → enabled.
  Deno.env.set("ASTROLOGY_TRANSITS_ENDPOINT", "v1/natal_transits");
  cap = getTransitCapability();
  assertEquals(cap.enabled, true);

  clearEnv();
});

Deno.test("normalizeTransits maps a provider payload without inventing data", () => {
  const out = normalizeTransits({
    mercury_retrograde: true,
    moon_sign: "scorpio",
    transit_relation: [
      { transit_planet: "Mars", natal_planet: "Venus", type: "Square", orb: 1.2 },
      { transit_planet: "Jupiter", natal_planet: "Sun", aspect: "trine", orb: 3.0 },
      { transit_planet: "", natal_planet: "Moon", type: "conjunction", orb: 0.5 }, // dropped (no transiting planet)
    ],
  }, "2026-06-26");

  assertEquals(out.asOf, "2026-06-26");
  assertEquals(out.source, "provider");
  assertEquals(out.mercuryRetrograde, true);
  assertEquals(out.moonSign, "Scorpio");
  assertEquals(out.aspects.length, 2);
  assertEquals(out.aspects[0], { transitingPlanet: "Mars", natalPlanet: "Venus", type: "square", orb: 1.2 });
  assertEquals(out.aspects[1].type, "trine");
});

Deno.test("normalizeTransits yields no aspects for an empty payload", () => {
  const out = normalizeTransits({}, "2026-06-26");
  assertEquals(out.aspects, []);
  assertEquals(out.mercuryRetrograde, undefined);
});
