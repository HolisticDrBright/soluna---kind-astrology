/**
 * todayInTz — the user's LOCAL calendar date. This is what keeps a Los Angeles
 * user's evening from flipping to "tomorrow's reading" at 4–8pm (the old
 * `toISOString()` derivation used the UTC date everywhere).
 */

import { assert, assertEquals } from "../test_util.ts";
import { todayInTz } from "../dates.ts";

// 2026-07-02 01:30 UTC — already "tomorrow" in UTC, still July 1 in the Americas.
const AT = new Date("2026-07-02T01:30:00Z");

Deno.test("todayInTz: evening in LA is still the previous UTC date", () => {
  assertEquals(todayInTz("America/Los_Angeles", AT), "2026-07-01");
  assertEquals(todayInTz("America/New_York", AT), "2026-07-01");
});

Deno.test("todayInTz: UTC and east-of-UTC roll forward correctly", () => {
  assertEquals(todayInTz("UTC", AT), "2026-07-02");
  assertEquals(todayInTz("Asia/Tokyo", AT), "2026-07-02");
});

Deno.test("todayInTz: missing/invalid timezone degrades to UTC, never throws", () => {
  assertEquals(todayInTz(null, AT), "2026-07-02");
  assertEquals(todayInTz("", AT), "2026-07-02");
  assertEquals(todayInTz("Not/AZone", AT), "2026-07-02");
});

Deno.test("todayInTz: always YYYY-MM-DD", () => {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(todayInTz("Australia/Sydney", AT)));
});
