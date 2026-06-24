import { assertEquals } from "../../test_util.ts";
import {
  computeNumerology,
  lifePath,
  personalDay,
  reduceKeepMaster,
  reduceToDigit,
} from "../numerology.ts";

Deno.test("reduceKeepMaster preserves 11/22/33", () => {
  assertEquals(reduceKeepMaster(11), 11);
  assertEquals(reduceKeepMaster(22), 22);
  assertEquals(reduceKeepMaster(33), 33);
  assertEquals(reduceKeepMaster(44), 8); // 4+4, not a master
  assertEquals(reduceKeepMaster(39), 3); // 39->12->3
});

Deno.test("reduceToDigit fully reduces (no masters)", () => {
  assertEquals(reduceToDigit(11), 2);
  assertEquals(reduceToDigit(22), 4);
  assertEquals(reduceToDigit(2026), 1); // 2+0+2+6=10->1
});

Deno.test("lifePath uses component method, keeps masters", () => {
  assertEquals(lifePath("1995-06-22"), 7); // 6 + 22 + 6 = 34 -> 7
  assertEquals(lifePath("2000-01-01"), 4); // 2 + 1 + 1 = 4
  assertEquals(lifePath("2003-11-22"), 11); // 5 + 11 + 22 = 38 -> 11 (master)
});

Deno.test("name numbers: JOHN", () => {
  const r = computeNumerology("John", "2000-01-01");
  assertEquals(r.expression, 2); // 1+6+8+5=20 -> 2
  assertEquals(r.soulUrge, 6); // O
  assertEquals(r.personality, 5); // J+H+N = 14 -> 5
});

Deno.test("Y as consonant when adjacent to vowels: MAYA", () => {
  const r = computeNumerology("Maya", "2000-01-01");
  assertEquals(r.expression, 4); // 4+1+7+1=13 -> 4
  assertEquals(r.soulUrge, 2); // A+A = 2
  assertEquals(r.personality, 11); // M(4)+Y(7)=11 master
});

Deno.test("Y as vowel when between consonants: RHYTHM", () => {
  const r = computeNumerology("Rhythm", "2000-01-01");
  assertEquals(r.soulUrge, 7); // only Y counts as vowel
  assertEquals(r.personality, 4); // R+H+T+H+M = 31 -> 4
  assertEquals(r.expression, 11); // 38 -> 11 master
});

Deno.test("accented names normalize to ASCII", () => {
  // "José" -> JOSE
  const r = computeNumerology("Jose", "2000-01-01");
  const r2 = computeNumerology("José", "2000-01-01");
  assertEquals(r.expression, r2.expression);
});

Deno.test("personal day formula is consistent", () => {
  // birth 1995-06-22, for 2026-06-24:
  // PY = reduce(6 + reduce(22)=4 + reduce(2026)=1) = reduce(11) = 2
  // PM = reduce(2 + 6) = 8 ; PD = reduce(8 + reduce(24)=6) = reduce(14) = 5
  assertEquals(personalDay("1995-06-22", "2026-06-24"), 5);
  const full = computeNumerology("Maya Elizabeth Chen", "1995-06-22", { forDate: "2026-06-24" });
  assertEquals(full.personalYear, 2);
  assertEquals(full.personalMonth, 8);
  assertEquals(full.personalDay, 5);
});
