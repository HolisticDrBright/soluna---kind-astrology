/**
 * Input validation guards. Critically, a birth profile cannot be saved without a
 * RESOLVED location (lat/lng/timezone) — there is no silent 0,0 / UTC fallback,
 * which is what keeps blueprint accuracy honest.
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assert, assertEquals } from "../test_util.ts";
import {
  validateAskMessage,
  validateBirthProfile,
  validateConnection,
  validateJournalEntry,
  validateTarotDraw,
} from "../schemas.ts";

const validBirth = {
  full_birth_name: "Ada Lovelace",
  birth_date: "1815-12-10",
  birth_time: "13:00",
  time_known: true,
  birth_place_label: "London, UK",
  lat: 51.5074,
  lng: -0.1278,
  timezone: "Europe/London",
};

function omit(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...obj };
  delete copy[key];
  return copy;
}

Deno.test("validateBirthProfile accepts a fully resolved profile", () => {
  const r = validateBirthProfile(validBirth);
  assert(r.success, r.error);
  assertEquals(r.data?.lat, 51.5074);
  assertEquals(r.data?.timezone, "Europe/London");
});

Deno.test("validateBirthProfile rejects missing latitude (no 0,0 fallback)", () => {
  const r = validateBirthProfile(omit(validBirth, "lat"));
  assert(!r.success);
  assert((r.error ?? "").toLowerCase().includes("latitude"));
});

Deno.test("validateBirthProfile rejects missing timezone (no UTC fallback)", () => {
  const r = validateBirthProfile(omit(validBirth, "timezone"));
  assert(!r.success);
  assert((r.error ?? "").toLowerCase().includes("timezone"));
});

Deno.test("validateBirthProfile rejects out-of-range coordinates", () => {
  assert(!validateBirthProfile({ ...validBirth, lat: 120 }).success);
  assert(!validateBirthProfile({ ...validBirth, lng: -999 }).success);
});

Deno.test("validateBirthProfile rejects missing name and invalid date", () => {
  assert(!validateBirthProfile({ ...validBirth, full_birth_name: "" }).success);
  assert(!validateBirthProfile({ ...validBirth, birth_date: "not-a-date" }).success);
});

Deno.test("validateBirthProfile defaults time_known true unless explicitly false", () => {
  assertEquals(validateBirthProfile(omit(validBirth, "time_known")).data?.time_known, true);
  assertEquals(validateBirthProfile({ ...validBirth, time_known: false }).data?.time_known, false);
});

Deno.test("validateConnection requires name + valid date and bounds the lens", () => {
  assert(validateConnection({ name: "Sam", birth_date: "1990-05-05" }).success);
  assert(!validateConnection({ name: "", birth_date: "1990-05-05" }).success);
  assert(!validateConnection({ name: "Sam", birth_date: "nope" }).success);
  assert(!validateConnection({ name: "Sam", birth_date: "1990-05-05", lens: "enemy" }).success);
});

Deno.test("validateJournalEntry requires a body and bounds mood 1-5", () => {
  assert(validateJournalEntry({ body: "today felt calm" }).success);
  assert(!validateJournalEntry({ body: "   " }).success);
  assert(!validateJournalEntry({ body: "x", mood: 9 }).success);
});

Deno.test("validateAskMessage requires a non-empty, under-2000-char message", () => {
  assert(validateAskMessage({ message: "hi" }).success);
  assert(!validateAskMessage({ message: "" }).success);
  assert(!validateAskMessage({ message: "x".repeat(2001) }).success);
});

Deno.test("validateTarotDraw defaults to daily and rejects unknown spreads", () => {
  assertEquals(validateTarotDraw({}).data?.spread, "daily");
  assert(!validateTarotDraw({ spread: "tower" }).success);
});
