/**
 * FreeAstroAPI BaZi normalization — proves the adapter maps the provider's REAL
 * response shape (array pillars with nested gan_info/zhi_info/ten_gods, nested
 * day_master.info, elements.points, professional.*, luck_cycle.pillars,
 * typed interactions[]) into the stable BaziOutput, and never fabricates the
 * hour pillar when birth time is missing.
 */

import { assert, assertEquals } from "../test_util.ts";
import { normalizeBazi, type BaziFetchCtx } from "../engines/bazi-providers.ts";

// A representative slice of a real FreeAstroAPI BaZi response.
const SAMPLE = {
  day_master: { stem: "丙", info: { name: "Bing", element: "Fire", polarity: "Yang" } },
  pillars: [
    {
      label: "year", gan: "己", zhi: "卯",
      gan_info: { name: "Ji", element: "Earth", polarity: "Yin" },
      zhi_info: { element: "Wood", polarity: "Yin", zodiac: "Rabbit", hidden: ["乙"] },
      ten_gods: { stem: "Hurting Officer", hidden: [{ gan: "乙", ten_god: "Direct Resource" }] },
      nayin: "城头土", life_stage: { chinese: "沐浴", name: "Bath" },
    },
    {
      label: "month", gan: "丁", zhi: "卯",
      gan_info: { name: "Ding", element: "Fire", polarity: "Yin" },
      zhi_info: { element: "Wood", zodiac: "Rabbit", hidden: ["乙"] },
      ten_gods: { stem: "Rob Wealth" },
    },
    {
      label: "day", gan: "丙", zhi: "申",
      gan_info: { name: "Bing", element: "Fire", polarity: "Yang" },
      zhi_info: { element: "Metal", zodiac: "Monkey", hidden: ["庚", "壬", "戊"] },
      ten_gods: { stem: "Day Master" },
      nayin: "山下火", life_stage: { chinese: "病", name: "Sickness" },
    },
    {
      label: "hour", gan: "甲", zhi: "午",
      gan_info: { name: "Jia", element: "Wood", polarity: "Yang" },
      zhi_info: { element: "Fire", zodiac: "Horse", hidden: ["丁", "己"] },
      ten_gods: { stem: "Indirect Resource" },
    },
  ],
  luck_cycle: {
    start_age_years: 2,
    is_forward: false,
    pillars: [
      { start_age: 3, start_year: 1881, gan: "丙", zhi: "寅" },
      { start_age: 13, start_year: 1891, gan: "乙", zhi: "丑" },
      { start_age: 23, start_year: 1901, gan: "甲", zhi: "子" },
      { start_age: 33, start_year: 1911, gan: "癸", zhi: "亥" },
      { start_age: 43, start_year: 1921, gan: "壬", zhi: "戌" },
      { start_age: 53, start_year: 1931, gan: "辛", zhi: "酉" },
      { start_age: 63, start_year: 1941, gan: "庚", zhi: "申" },
      { start_age: 73, start_year: 1951, gan: "己", zhi: "未" },
      { start_age: 83, start_year: 1961, gan: "戊", zhi: "午" },
    ],
  },
  elements: {
    scoring_model: "basic_weighted",
    points: { Wood: 70, Fire: 65, Earth: 30, Metal: 25, Water: 5 },
    percentages: { Wood: 35.9, Fire: 33.3, Earth: 15.4, Metal: 12.8, Water: 2.6 },
    dominant: "Wood",
  },
  professional: {
    dm_strength: "Strong",
    structure: "Direct Resource Structure",
    favorable_elements: ["Earth (Tu)", "Water (Shui)", "Earth (Tu)"],
    unfavorable_elements: ["Fire (Huo)", "Wood (Mu)"],
  },
  interactions: [
    { id: "stem_combo_year_hour", type: "Stem Combination", stems: ["己", "甲"], transform_to: "Earth" },
    { id: "break_year_hour", type: "Branch Break (Po)", branches: ["卯", "午"] },
    { id: "break_month_hour", type: "Branch Break (Po)", branches: ["卯", "午"] },
  ],
  stars: [
    { name: "General Star", pillar: "year", zhi: "卯", desc: "Leadership, authority, and command" },
    { name: "Academic Star", pillar: "day", zhi: "申", desc: "Intelligence, learning, and literary talent" },
  ],
  xun_kong: { void_branches: ["辰", "巳"], xun_name: "甲午" },
  astro_debug: { effective_solar_time_local: "1879-03-14T11:30:00" },
};

const FULL_CTX: BaziFetchCtx = { hash: "h1", missingInputs: [], hasTime: true, hasLocation: true, provider: "freeastroapi" };

Deno.test("FreeAstroAPI: day master + pillars map correctly", () => {
  const b = normalizeBazi(SAMPLE, FULL_CTX);
  assertEquals(b.source, "provider");
  assertEquals(b.dayMaster?.stem, "丙");
  assertEquals(b.dayMaster?.element, "fire");
  assertEquals(b.dayMaster?.yinYang, "Yang");

  assertEquals(b.pillars.year?.stem, "己");
  assertEquals(b.pillars.year?.branch, "卯");
  assertEquals(b.pillars.year?.element, "Earth");
  assertEquals(b.pillars.year?.animal, "Rabbit");
  assertEquals(b.pillars.year?.hiddenStems, ["乙"]);
  assertEquals(b.pillars.year?.tenGod, "Hurting Officer");

  assertEquals(b.pillars.day?.stem, "丙");
  assertEquals(b.pillars.day?.branch, "申");
  assertEquals(b.pillars.day?.tenGod, "Day Master");
  assertEquals(b.pillars.day?.hiddenStems, ["庚", "壬", "戊"]);
});

Deno.test("FreeAstroAPI: strength, elements, favorable/unfavorable, ten gods", () => {
  const b = normalizeBazi(SAMPLE, FULL_CTX);
  assertEquals(b.dayMasterStrength, "Strong");

  // five-element balance comes from elements.points (keys lowercased)
  assertEquals(b.fiveElementBalance.wood, 70);
  assertEquals(b.fiveElementBalance.fire, 65);
  assertEquals(b.fiveElementBalance.water, 5);

  // "Earth (Tu)" → "earth"; deduped
  assertEquals(b.favorableElements, ["earth", "water"]);
  assertEquals(b.unfavorableElements, ["fire", "wood"]);

  for (const g of ["Hurting Officer", "Rob Wealth", "Day Master", "Indirect Resource"]) {
    assert(b.tenGods.includes(g), `expected ten god ${g}`);
  }
});

Deno.test("FreeAstroAPI: luck cycle + interactions + true solar time", () => {
  const b = normalizeBazi(SAMPLE, FULL_CTX);
  assertEquals(b.luckPillars.length, 9);
  assertEquals(b.luckPillars[0].startAge, 3);
  assertEquals(b.luckPillars[0].startYear, 1881);
  assertEquals(b.luckPillars[0].stem, "丙");
  assertEquals(b.luckPillars[0].branch, "寅");

  assertEquals(b.interactions.combinations.length, 1); // Stem Combination
  assertEquals(b.interactions.clashes.length, 2);       // two Branch Breaks
  assert(b.interactions.combinations[0].includes("Earth")); // transform_to surfaced

  assert(b.trueSolarTime.applied);
  assertEquals(b.trueSolarTime.adjustedTime, "1879-03-14T11:30:00");
});

Deno.test("FreeAstroAPI: rich extras — structure, symbolic stars, void branches, na yin, life stage", () => {
  const b = normalizeBazi(SAMPLE, FULL_CTX);
  assertEquals(b.structure, "Direct Resource Structure");
  assertEquals(b.voidBranches, ["辰", "巳"]);

  assertEquals(b.stars?.length, 2);
  assertEquals(b.stars?.[0].name, "General Star");
  assertEquals(b.stars?.[0].pillar, "year");
  assert((b.stars?.[1].description ?? "").includes("Intelligence"));

  // Na Yin + 12 Life Stage map onto the pillars ({ chinese, name } → name).
  assertEquals(b.pillars.year?.nayin, "城头土");
  assertEquals(b.pillars.year?.lifeStage, "Bath");
  assertEquals(b.pillars.day?.nayin, "山下火");
  assertEquals(b.pillars.day?.lifeStage, "Sickness");
});

Deno.test("FreeAstroAPI: no birth time → hour pillar is never fabricated", () => {
  const b = normalizeBazi(SAMPLE, { hash: "h2", missingInputs: ["birth_time"], hasTime: false, hasLocation: true });
  assertEquals(b.pillars.hour, null);
  assert(b.partial);
  assert(b.pillars.day !== null); // the rest of the chart still resolves
  assert(b.confidenceNotes.some((n) => n.toLowerCase().includes("hour pillar")));
});

Deno.test("empty / unrecognized response throws (so caller degrades to 'unavailable')", () => {
  let threw = false;
  try {
    normalizeBazi({ foo: "bar" }, FULL_CTX);
  } catch {
    threw = true;
  }
  assert(threw, "expected normalizeBazi to throw on a response with no pillars");
});
