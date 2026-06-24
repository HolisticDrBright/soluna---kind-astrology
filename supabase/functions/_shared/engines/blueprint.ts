// BlueprintService — the orchestrator + single source of truth.
// Runs every engine ONCE for a birth profile and returns a normalized blueprint
// plus a flattened list of placements for querying. Recompute only when birth
// data changes.

import { computeAstrology } from "./astrology.ts";
import { computeNumerology } from "./numerology.ts";
import { computeChinese } from "./chinese.ts";
import { computeHumanDesign } from "./humandesign.ts";
import type {
  AstrologyResult,
  BirthInput,
  ChineseAnimal,
  ChineseElement,
  ChineseResult,
  HDAuthority,
  HDType,
  HumanDesignResult,
  NeedsBirthTime,
  NumerologyResult,
  ZodiacSign,
} from "./types.ts";

export interface BlueprintSummary {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  rising: ZodiacSign | null;
  lifePath: number;
  expression: number;
  animal: ChineseAnimal;
  element: ChineseElement;
  hdType: HDType | null;
  hdAuthority: HDAuthority | null;
  hdProfile: string | null;
  timeKnown: boolean;
}

export interface Blueprint {
  astrology: AstrologyResult;
  numerology: NumerologyResult;
  chinese: ChineseResult;
  humanDesign: HumanDesignResult | NeedsBirthTime;
  biorhythmSeed: { birthDate: string };
  summary: BlueprintSummary;
}

export interface PlacementRow {
  system: "astrology" | "numerology" | "chinese" | "human_design";
  key: string;
  label: string;
  detail: Record<string, unknown>;
}

function isHD(x: HumanDesignResult | NeedsBirthTime): x is HumanDesignResult {
  return !("needsBirthTime" in x);
}

export async function computeBlueprint(
  input: BirthInput,
): Promise<{ blueprint: Blueprint; placements: PlacementRow[] }> {
  const astrology = await computeAstrology(input);
  const numerology = computeNumerology(input.fullName ?? "", input.date);
  const chinese = computeChinese(input.date, input.time);
  const humanDesign = computeHumanDesign(input);

  const sun = astrology.planets.find((p) => p.planet === "Sun")!;
  const moon = astrology.planets.find((p) => p.planet === "Moon")!;
  const rising = "needsBirthTime" in astrology.ascendant ? null : astrology.ascendant.sign;

  const summary: BlueprintSummary = {
    sunSign: sun.sign,
    moonSign: moon.sign,
    rising,
    lifePath: numerology.lifePath,
    expression: numerology.expression,
    animal: chinese.animal,
    element: chinese.element,
    hdType: isHD(humanDesign) ? humanDesign.type : null,
    hdAuthority: isHD(humanDesign) ? humanDesign.authority : null,
    hdProfile: isHD(humanDesign) ? humanDesign.profile : null,
    timeKnown: !!input.time,
  };

  const blueprint: Blueprint = {
    astrology,
    numerology,
    chinese,
    humanDesign,
    biorhythmSeed: { birthDate: input.date },
    summary,
  };

  return { blueprint, placements: flattenPlacements(blueprint) };
}

function flattenPlacements(bp: Blueprint): PlacementRow[] {
  const rows: PlacementRow[] = [];

  // Astrology: planets + Rising
  for (const p of bp.astrology.planets) {
    const house = p.house ? `, ${ordinal(p.house)} House` : "";
    rows.push({
      system: "astrology",
      key: p.planet,
      label: `${p.planet} in ${p.sign}${house}`,
      detail: { sign: p.sign, degree: p.degree, house: p.house, retrograde: p.retrograde },
    });
  }
  if (!("needsBirthTime" in bp.astrology.ascendant)) {
    rows.push({
      system: "astrology",
      key: "Rising",
      label: `${bp.astrology.ascendant.sign} Rising`,
      detail: { sign: bp.astrology.ascendant.sign, degree: bp.astrology.ascendant.degree },
    });
  }

  // Numerology
  const n = bp.numerology;
  const numItems: Array<[string, string, number]> = [
    ["lifePath", "Life Path", n.lifePath],
    ["expression", "Expression", n.expression],
    ["soulUrge", "Soul Urge", n.soulUrge],
    ["personality", "Personality", n.personality],
    ["birthday", "Birthday", n.birthday],
  ];
  for (const [key, label, value] of numItems) {
    rows.push({
      system: "numerology",
      key,
      label: `${label} ${value}`,
      detail: { value },
    });
  }

  // Chinese
  rows.push({
    system: "chinese",
    key: "animal",
    label: bp.chinese.elementAnimalLabel,
    detail: {
      animal: bp.chinese.animal,
      element: bp.chinese.element,
      yinYang: bp.chinese.yinYang,
      bazi: bp.chinese.bazi,
    },
  });

  // Human Design
  if (isHD(bp.humanDesign)) {
    const hd = bp.humanDesign;
    rows.push({
      system: "human_design",
      key: "type",
      label: `${hd.type} · ${hd.authority} Authority · ${hd.profile}`,
      detail: {
        type: hd.type,
        strategy: hd.strategy,
        authority: hd.authority,
        profile: hd.profile,
        definition: hd.definition,
        signature: hd.signature,
        notSelf: hd.notSelf,
        centers: hd.centers,
        incarnationCross: hd.incarnationCross,
      },
    });
  }

  return rows;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
