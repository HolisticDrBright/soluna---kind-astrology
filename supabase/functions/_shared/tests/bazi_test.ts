/**
 * BaZi engine + provider: the normalizer maps a real-shaped payload, NEVER
 * fabricates an hour pillar without a birth time, degrades to "unavailable" with
 * no provider, and caches by input fingerprint. Offline (no network).
 * Run: deno test --allow-env --allow-read supabase/functions/_shared/tests
 */

import { assert, assertEquals } from "../test_util.ts";
import { getBaziCapability, normalizeBazi, type BaziFetchCtx } from "../engines/bazi-providers.ts";
import { computeBazi, baziInputHash, hasRealBazi, type BaziOutput } from "../engines/bazi.ts";

const BAZI_ENV = ["BAZI_PROVIDER", "BAZI_API_KEY", "BAZI_API_BASE_URL", "BAZI_API_ENDPOINT"];
function clearEnv() {
  for (const k of BAZI_ENV) Deno.env.delete(k);
}

const SAMPLE = {
  day_master: { stem: "Jia", element: "wood", yin_yang: "Yang" },
  day_master_strength: "strong",
  pillars: {
    year: { heavenly_stem: "Geng", earthly_branch: "Wu", element: "metal", animal: "Horse", hidden_stems: ["Ding", "Ji"], ten_god: "Seven Killings" },
    month: { heavenly_stem: "Ji", earthly_branch: "Mao", element: "earth", animal: "Rabbit" },
    day: { heavenly_stem: "Jia", earthly_branch: "Zi", element: "wood", animal: "Rat" },
    hour: { heavenly_stem: "Bing", earthly_branch: "Yin", element: "fire", animal: "Tiger" },
  },
  five_elements: { wood: 3, fire: 1, earth: 2, metal: 2, water: 0 },
  favorable_elements: ["water", "wood"],
  ten_gods: ["Direct Wealth"],
  luck_pillars: [{ start_age: 3, heavenly_stem: "Wu", earthly_branch: "Yin" }],
  true_solar_time: { adjusted_time: "13:42" },
};

const fullCtx: BaziFetchCtx = { hash: "h", missingInputs: [], hasTime: true, hasLocation: true, provider: "freeastroapi" };

Deno.test("normalizeBazi maps a provider payload into the stable shape", () => {
  const out = normalizeBazi(SAMPLE, fullCtx);
  assertEquals(out.source, "provider");
  assertEquals(out.partial, false);
  assertEquals(out.dayMaster?.element, "wood");
  assertEquals(out.pillars.day?.stem, "Jia");
  assertEquals(out.pillars.hour?.branch, "Yin");
  assertEquals(out.fiveElementBalance.wood, 3);
  assert(out.favorableElements.includes("water"));
  assert(out.tenGods.includes("Seven Killings")); // collected from the pillar
  assertEquals(out.luckPillars.length, 1);
  assertEquals(out.trueSolarTime.applied, true);
});

Deno.test("missing birth time → the hour pillar is never fabricated", () => {
  const out = normalizeBazi(SAMPLE, { hash: "h", missingInputs: ["birth_time"], hasTime: false, hasLocation: true });
  assertEquals(out.pillars.hour, null);
  assertEquals(out.partial, true);
  assert(out.missingInputs.includes("birth_time"));
  assert(out.confidenceNotes.some((n) => /hour pillar/i.test(n)));
});

Deno.test("missing birth location → partial, true solar time not applied", () => {
  const out = normalizeBazi(SAMPLE, { hash: "h", missingInputs: ["birth_location"], hasTime: true, hasLocation: false });
  assertEquals(out.partial, true);
  assertEquals(out.trueSolarTime.applied, false);
});

Deno.test("an empty/unrecognized response throws so the caller degrades honestly", () => {
  let threw = false;
  try {
    normalizeBazi({}, fullCtx);
  } catch {
    threw = true;
  }
  assert(threw);
});

Deno.test("computeBazi returns unavailable when no provider is configured (no network)", async () => {
  clearEnv();
  const out = await computeBazi({ date: "1990-01-15", time: "08:30", lat: 40, lng: -73, timezone: "America/New_York" });
  assertEquals(out.source, "unavailable");
  assertEquals(out.unavailableReason, "provider_not_configured");
  assert(!hasRealBazi(out));
  clearEnv();
});

Deno.test("getBaziCapability needs both a provider and a key", () => {
  clearEnv();
  assertEquals(getBaziCapability().enabled, false);
  Deno.env.set("BAZI_PROVIDER", "freeastroapi");
  assertEquals(getBaziCapability().enabled, false); // still no key
  Deno.env.set("BAZI_API_KEY", "test-key");
  assertEquals(getBaziCapability().enabled, true);
  clearEnv();
});

Deno.test("computeBazi reuses a cached chart for the same birth inputs (no re-charge)", async () => {
  clearEnv();
  const input = { date: "1990-01-15", time: "08:30", lat: 40, lng: -73, timezone: "America/New_York" };
  const cached = { source: "provider", sourceInputHash: baziInputHash(input) } as unknown as BaziOutput;
  const out = await computeBazi(input, { cachedBazi: cached });
  assert(out === cached); // returned the cached object — no provider call attempted
  clearEnv();
});
