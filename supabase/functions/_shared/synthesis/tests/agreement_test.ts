import { assert, assertEquals } from "../../test_util.ts";
import { detectAgreement } from "../agreement.ts";
import type { DayContext } from "../context.ts";
import type { ChineseElement, ZodiacSign } from "../../engines/types.ts";

function ctx(overrides: {
  personalDay: number;
  moonSign: ZodiacSign;
  moonPhase: string;
  element: ChineseElement;
  hdAuthority: string | null;
  bio?: { physical: number; emotional: number; intellectual: number };
}): DayContext {
  return {
    date: "2026-06-24",
    preferredName: "Test",
    summary: {
      sunSign: "Cancer", moonSign: "Pisces", rising: "Libra", lifePath: 7, expression: 7,
      animal: "Pig", element: "Wood",
      hdType: "Generator", hdAuthority: overrides.hdAuthority as never, hdProfile: "6/2",
      timeKnown: true,
    },
    transits: {
      date: "2026-06-24",
      planets: [],
      moon: { phase: overrides.moonPhase, emoji: "🌔", sign: overrides.moonSign, illumination: 0.5 },
    },
    personalDay: overrides.personalDay,
    chineseDaily: { animal: "Snake", element: overrides.element },
    biorhythm: { ...(overrides.bio ?? { physical: 0, emotional: 0, intellectual: 0 }), dayIndex: 100 },
    tarot: { name: "The Moon", arcana: "major", imageEmoji: "🌑", uprightMeaning: "..." },
  };
}

Deno.test("five systems converging on rest score 5", () => {
  const r = detectAgreement(ctx({
    personalDay: 7, // rest
    moonSign: "Cancer", // water -> rest
    moonPhase: "Waning Gibbous", // waning -> rest
    element: "Water", // rest
    hdAuthority: "Emotional", // rest
    bio: { physical: -0.5, emotional: -0.6, intellectual: -0.4 }, // low ebb -> rest
  }));
  assertEquals(r.topTheme.id, "rest");
  assertEquals(r.topTheme.score, 5); // numerology, astrology, chinese, humanDesign, biorhythm
});

Deno.test("five systems converging on action", () => {
  const r = detectAgreement(ctx({
    personalDay: 1, // action
    moonSign: "Aries", // fire -> action
    moonPhase: "New Moon", // action
    element: "Fire", // action
    hdAuthority: "Sacral", // action
    bio: { physical: 0.8, emotional: 0.1, intellectual: 0.0 }, // physical high -> action
  }));
  assertEquals(r.topTheme.id, "action");
  assert(r.topTheme.score >= 4);
});

Deno.test("scoring counts DISTINCT systems (astrology counted once per theme)", () => {
  // Moon sign water (rest) + waning phase (rest): astrology supports rest twice
  // but must count as ONE system.
  const r = detectAgreement(ctx({
    personalDay: 4, // focus (different theme)
    moonSign: "Pisces", // rest
    moonPhase: "Waning Crescent", // rest
    element: "Earth", // focus
    hdAuthority: "Sacral", // action
  }));
  const rest = r.themes.find((t) => t.id === "rest")!;
  assertEquals(rest.score, 1); // only astrology, despite two pieces of evidence
  assertEquals(rest.evidence.length, 2);
});

Deno.test("only themes with support are returned, sorted by score", () => {
  const r = detectAgreement(ctx({
    personalDay: 7, moonSign: "Cancer", moonPhase: "Waning Gibbous",
    element: "Water", hdAuthority: "Emotional",
  }));
  assert(r.themes.every((t) => t.score > 0));
  for (let i = 1; i < r.themes.length; i++) {
    assert(r.themes[i - 1].score >= r.themes[i].score);
  }
});
