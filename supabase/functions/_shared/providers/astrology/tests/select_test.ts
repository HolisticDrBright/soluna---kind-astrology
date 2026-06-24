// Provider selection + the "no fake-precise chart" guard in computeAstrology.

import { assert, assertEquals } from "../../../test_util.ts";
import { getAstrologyProvider } from "../index.ts";
import { computeAstrology } from "../../../engines/astrology.ts";

const KEYS = [
  "ASTROLOGY_PROVIDER",
  "PROKERALA_CLIENT_ID",
  "PROKERALA_CLIENT_SECRET",
  "ASTROLOGY_API_USER_ID",
  "ASTROLOGY_API_KEY",
  "ASTROLOGY_API_BASE_URL",
];
function clearEnv() {
  for (const k of KEYS) Deno.env.delete(k);
}

Deno.test("no configuration => no provider (engine uses its library)", () => {
  clearEnv();
  assertEquals(getAstrologyProvider(), null);
});

Deno.test("explicit provider without credentials => null", () => {
  clearEnv();
  Deno.env.set("ASTROLOGY_PROVIDER", "prokerala");
  assertEquals(getAstrologyProvider(), null);
  clearEnv();
});

Deno.test("credentials select the matching provider", () => {
  clearEnv();
  Deno.env.set("PROKERALA_CLIENT_ID", "id");
  Deno.env.set("PROKERALA_CLIENT_SECRET", "secret");
  assertEquals(getAstrologyProvider()?.id, "prokerala");
  clearEnv();

  Deno.env.set("ASTROLOGY_API_USER_ID", "u");
  Deno.env.set("ASTROLOGY_API_KEY", "k");
  assertEquals(getAstrologyProvider()?.id, "astrologyapi");
  clearEnv();
});

Deno.test("a configured provider is NOT called without coordinates — no fake precision, no network", async () => {
  clearEnv();
  // Provider 'configured', but the user gave no birth place.
  Deno.env.set("ASTROLOGY_PROVIDER", "custom");
  Deno.env.set("ASTROLOGY_API_BASE_URL", "https://example.invalid");
  try {
    const r = await computeAstrology({ date: "1990-03-14", time: "09:30", fullName: "Test" });
    // Falls back to the in-process library; angles withheld; never "hosted_api".
    assert("needsBirthTime" in r.ascendant, "Rising must be withheld without a place");
    assertEquals(r.locationKnown, false);
    assertEquals(r.meta.source, "verified_library");
  } finally {
    clearEnv();
  }
});
