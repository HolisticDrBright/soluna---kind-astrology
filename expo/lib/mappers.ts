// Map backend response shapes -> the mock UI shapes the screens already render.
// Real computed values (signs, numbers, animal, HD type, BaZi) come from the
// backend; descriptive copy is sourced from the mock interpretation libraries
// keyed by those real values, with sane fallbacks. This lets every existing
// screen render real data with no JSX changes.
import {
  NUMBER_MEANINGS,
  CHINESE_INTERPRETATIONS,
  HD_INTERPRETATIONS,
  type ChartData,
  type ChineseAstrologyData,
  type ChineseAnimal,
  type ChineseElement,
  type DailyReading,
  type HumanDesignData,
  type NumerologyData,
  type Placement,
  type Planet,
  type UserData,
  type ZodiacSign,
} from "@/constants/mockData";
import type {
  BackendBlueprint,
  BackendReading,
  BackendSummary,
} from "@/lib/apiClient";

const PLANET_ORDER: Planet[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

function num(meaning: number, kind: string): string {
  const m = NUMBER_MEANINGS[meaning];
  if (m) return m.description;
  return `Your ${kind} number ${meaning} colors how you move through the world.`;
}

function mapNumerology(n: any): NumerologyData {
  return {
    lifePath: n.lifePath,
    lifePathMeaning: num(n.lifePath, "Life Path"),
    expression: n.expression,
    expressionMeaning: num(n.expression, "Expression"),
    soulUrge: n.soulUrge,
    soulUrgeMeaning: num(n.soulUrge, "Soul Urge"),
    personalYear: n.personalYear,
    personalYearMeaning: `You're in a Personal Year ${n.personalYear} — a year with its own distinct rhythm and lessons. Lean into what it's asking of you.`,
    personalMonth: n.personalMonth,
    personalMonthMeaning: `Your Personal Month ${n.personalMonth} sets the tone for these few weeks.`,
    personalDay: n.personalDay,
    personalDayMeaning: `Today is a Personal Day ${n.personalDay} — a gentle theme to carry through your hours.`,
  };
}

function mapChart(astrology: any): ChartData {
  const planets: Placement[] = PLANET_ORDER.map((planet) => {
    const p = (astrology.planets ?? []).find((x: any) => x.planet === planet);
    return {
      planet,
      sign: (p?.sign ?? "Aries") as ZodiacSign,
      house: (p?.house ?? 1) as number,
      degree: Math.round(p?.degree ?? 0),
    };
  });
  const sun = planets.find((p) => p.planet === "Sun")!;
  const moon = planets.find((p) => p.planet === "Moon")!;
  const ascKnown = astrology.ascendant && !("needsBirthTime" in astrology.ascendant);
  const rising = (ascKnown ? astrology.ascendant.sign : sun.sign) as ZodiacSign;
  return { sun, moon, rising, placements: planets };
}

function mapChinese(c: any): ChineseAstrologyData {
  const animal = c.animal as ChineseAnimal;
  const element = c.element as ChineseElement;
  const key = `${element}-${animal}`;
  const interp = CHINESE_INTERPRETATIONS[key];
  const pillarRole = ["Year pillar", "Month pillar", "Day Master", "Hour pillar"];
  return {
    animal,
    element,
    elementAnimalLabel: c.elementAnimalLabel ?? `${element} ${animal}`,
    description: interp?.description ??
      `The ${element} ${animal} blends ${element}'s qualities with the warm, distinctive nature of the ${animal}.`,
    strengths: interp?.strengths ?? [
      "A genuine, recognizable character",
      "Natural resilience",
      "Warmth that puts others at ease",
    ],
    growthEdge: interp?.growthEdge ??
      "Your gifts shine brightest when you also make room to receive, not only give.",
    todayAnimal: animal,
    todayElement: element,
    todayNote: "Today's energy invites you to lean into your natural strengths.",
    bazi: (c.bazi ?? []).map((p: any, i: number) => ({
      heavenlyStem: p.heavenlyStem,
      earthlyBranch: p.earthlyBranch as ChineseAnimal,
      element: p.element as ChineseElement,
      meaning: `${pillarRole[i] ?? "Pillar"} — ${p.element} ${p.earthlyBranch}, one thread of your BaZi chart.`,
    })),
  };
}

function mapHumanDesign(hd: any): HumanDesignData {
  if (!hd || "needsBirthTime" in hd) {
    const note = hd?.note ?? "Add your birth time to unlock your full Human Design chart.";
    return {
      type: "Generator" as HumanDesignData["type"],
      typeDescription: note,
      strategy: "To Respond" as HumanDesignData["strategy"],
      strategyDescription: note,
      authority: "Sacral" as HumanDesignData["authority"],
      authorityDescription: note,
      profile: "—",
      profileDescription: note,
      incarnationCross: "Needs birth time",
      signature: "—",
      notSelf: "—",
      centers: [],
      strengths: [],
      growthEdge: note,
    };
  }
  const interp = HD_INTERPRETATIONS[hd.type];
  return {
    type: hd.type,
    typeDescription: interp?.description ?? `As a ${hd.type}, you have a distinct energetic design and rhythm.`,
    strategy: hd.strategy,
    strategyDescription: `Your strategy is "${hd.strategy}" — the way your design is meant to engage with life.`,
    authority: hd.authority,
    authorityDescription: `Your inner authority is ${hd.authority} — your most reliable compass for decisions.`,
    profile: hd.profile,
    profileDescription: `Your ${hd.profile} profile describes the role you're here to play and how you learn.`,
    incarnationCross: hd.incarnationCross ?? "",
    signature: hd.signature,
    notSelf: hd.notSelf,
    centers: (hd.centers ?? []).map((c: any) => ({
      name: c.name,
      defined: !!c.defined,
      gates: c.gates ?? [],
    })),
    strengths: interp?.strengths ?? [
      "A clear energetic signature when you honor your design",
      "Decision-making that improves when you trust your authority",
    ],
    growthEdge: interp?.growthEdge ??
      `Notice your not-self theme of ${hd.notSelf} — it's a gentle signal you're out of alignment.`,
  };
}

export function backendBlueprintToUserData(
  bp: BackendBlueprint,
  profile: {
    fullName?: string;
    preferredName: string;
    birthDate: string;
    birthTime: string;
    birthTimeKnown: boolean;
    birthPlace: string;
  },
): UserData {
  return {
    fullName: profile.fullName ?? profile.preferredName,
    preferredName: profile.preferredName,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthTimeKnown: profile.birthTimeKnown,
    birthPlace: profile.birthPlace,
    chart: mapChart(bp.astrology),
    numerology: mapNumerology(bp.numerology),
    chinese: mapChinese(bp.chinese),
    humanDesign: mapHumanDesign(bp.humanDesign),
  };
}

// ─── daily reading (backend /today) -> mock DailyReading shape ──────
const SIGN_FALLBACK: ZodiacSign = "Cancer";

export function backendReadingToDailyReading(r: BackendReading): DailyReading {
  const cw = r.cosmicWeather ?? {};
  const moon = cw.moon ?? {};
  const transits: any[] = cw.transits ?? [];
  const t1 = transits[0] ?? {};
  const t2 = transits[1] ?? {};
  const energyLevel = cw.energy?.level ?? 3;
  const agreement = r.agreement ?? {};
  const evidence: any[] = agreement.evidence ?? [];

  return {
    date: r.date,
    reading: r.hero,
    moonPhase: moon.phase ?? "Waxing Gibbous",
    moonPhaseEmoji: moon.emoji ?? "🌔",
    moonSign: (moon.sign ?? SIGN_FALLBACK) as ZodiacSign,
    transit1: {
      planet: (t1.planet ?? "Venus") as Planet,
      sign: (t1.sign ?? "Gemini") as ZodiacSign,
      blurb: `${t1.planet ?? "Venus"} is moving through ${t1.sign ?? "the sky"} today.`,
    },
    transit2: {
      planet: (t2.planet ?? "Mars") as Planet,
      sign: (t2.sign ?? "Virgo") as ZodiacSign,
      blurb: `${t2.planet ?? "Mars"} is moving through ${t2.sign ?? "the sky"} today.`,
    },
    energyLevel: Math.min(5, Math.max(1, energyLevel)),
    energyCaption: cw.caption ?? "A steady, gentle day.",
    affirmation: r.affirmation,
    do: r.doEmbraceEase?.do ?? "Do one kind thing for yourself",
    embrace: r.doEmbraceEase?.embrace ?? "What feels true",
    easeUp: r.doEmbraceEase?.ease ?? "Pressure to be perfect",
    personalDay: r.personalDay,
    personalDayMeaning: `A Personal Day ${r.personalDay} — a gentle theme for today.`,
    chineseNote: `Today carries ${r.chineseDaily?.element ?? ""} ${r.chineseDaily?.animal ?? ""} energy.`,
    systemsAgree: {
      systems: (agreement.systems ?? evidence).map((e: any) => e.label),
      summary: agreement.summary ?? agreement.title ?? "Your systems are in quiet agreement today.",
      detail: agreement.combinedTakeaway ?? agreement.detail ?? "",
      theme: agreement.theme,
      combinedTakeaway: agreement.combinedTakeaway ?? agreement.detail,
      evidence: (agreement.systems ?? []).map((s: any) => ({
        system: s.system,
        label: s.label,
        signal: s.signal,
        detail: s.detail,
        source: s.source,
        confidence: s.confidence ?? 0.7,
      })),
    },
    cardOfTheDay: r.tarotCard ?? {
      name: "The Star", arcana: "major", imageEmoji: "⭐",
      uprightMeaning: "Hope and renewal.",
    },
  };
}

export function summaryToBlueprintBits(s: BackendSummary) {
  return {
    sunSign: s.sunSign as ZodiacSign,
    moonSign: s.moonSign as ZodiacSign,
    rising: (s.rising ?? s.sunSign) as ZodiacSign,
    lifePath: s.lifePath,
    animal: s.animal as ChineseAnimal,
    element: s.element as ChineseElement,
    hdType: s.hdType,
  };
}
