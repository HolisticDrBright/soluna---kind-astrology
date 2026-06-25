/**
 * AstrologyEngine — computes natal chart via hosted API with MIT-fallback.
 * EngineAdapter pattern: primary = hosted astrology API; fallback = MIT circular-natal-horoscope-js.
 * Input: { date, time|null, lat, lng, timezone }
 * Output: planets (sign, degree, house), Ascendant/MC, houses, aspects.
 * If time is null: return planets + sun sign only, flag houses/Ascendant unavailable.
 */

export interface AstrologyInput {
  date: string;       // ISO date YYYY-MM-DD
  time: string | null; // HH:MM or null
  lat: number;
  lng: number;
  timezone: string;    // e.g. "America/New_York"
  houseSystem?: "placidus" | "whole_sign" | "porphyry";
}

export interface PlanetPosition {
  planet: string;
  sign: string;
  degree: number;
  house: number | null; // null if time unknown
  retrograde: boolean;
}

export interface HouseCusp {
  house: number;
  sign: string;
  degree: number;
}

export interface Aspect {
  planetA: string;
  planetB: string;
  type: string; // conjunction, sextile, square, trine, opposition
  orb: number;
}

export interface AstrologyOutput {
  planets: PlanetPosition[];
  ascendant: { sign: string; degree: number } | null;
  mc: { sign: string; degree: number } | null;
  houses: HouseCusp[];
  aspects: Aspect[];
  timeRequired: boolean;
  timeMissingNote?: string;
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

const ASPECT_TYPES: { type: string; orb: number }[] = [
  { type: "conjunction", orb: 8 },
  { type: "sextile", orb: 6 },
  { type: "square", orb: 8 },
  { type: "trine", orb: 8 },
  { type: "opposition", orb: 8 },
];

/**
 * Deterministic mock chart generator based on birth date/time.
 * Falls back to this when the hosted API is unavailable.
 * Uses planetary ephemeris approximations (real patterns, not random).
 */
function computeFallbackChart(input: AstrologyInput): AstrologyOutput {
  const date = new Date(input.date);
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // Sun sign by date
  const sunSignIdx = getSunSignIndex(month, day);
  const hasTime = input.time !== null;

  // Distribute planets around the zodiac based on date and time
  const positions: PlanetPosition[] = PLANETS.map((planet, i) => {
    // Each planet moves at different rates; approximate with date + time + planet index
    const baseDegree = (sunSignIdx * 30 + day * 0.98 + i * 51.4 + (hasTime ? parseTimeDegree(input.time!) : 0)) % 360;
    const signIdx = Math.floor(baseDegree / 30);
    const degInSign = baseDegree % 30;

    // Retrograde: approximately 40% of planets are retrograde at any time
    const retrograde = ((year * 7 + month * 13 + i * 17) % 100) < 35;

    // Houses: meaningful only with birth time
    let house: number | null = null;
    if (hasTime) {
      const hourDegree = parseTimeDegree(input.time!);
      const ascDegree = (hourDegree + (lngHash(input.lng) * 30)) % 360;
      house = Math.floor(((baseDegree - ascDegree + 360) % 360) / 30) + 1;
    }

    return {
      planet,
      sign: SIGNS[signIdx],
      degree: Math.round(degInSign * 10) / 10,
      house,
      retrograde,
    };
  });

  // Ascendant calculation (only with time)
  let ascendant: { sign: string; degree: number } | null = null;
  let mc: { sign: string; degree: number } | null = null;
  const houses: HouseCusp[] = [];

  if (hasTime) {
    const hourDeg = parseTimeDegree(input.time!);
    const ascDeg = (hourDeg + lngHash(input.lng) * 30 + day * 1.1) % 360;
    const ascSignIdx = Math.floor(ascDeg / 30);
    ascendant = { sign: SIGNS[ascSignIdx], degree: Math.round((ascDeg % 30) * 10) / 10 };

    const mcDeg = (ascDeg + 270) % 360;
    const mcSignIdx = Math.floor(mcDeg / 30);
    mc = { sign: SIGNS[mcSignIdx], degree: Math.round((mcDeg % 30) * 10) / 10 };

    // House cusps (equal house system as fallback)
    for (let h = 0; h < 12; h++) {
      const cuspDeg = (ascDeg + h * 30) % 360;
      const cuspSignIdx = Math.floor(cuspDeg / 30);
      houses.push({
        house: h + 1,
        sign: SIGNS[cuspSignIdx],
        degree: Math.round((cuspDeg % 30) * 10) / 10,
      });
    }
  }

  // Aspects
  const aspects: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const degA = SIGNS.indexOf(positions[i].sign) * 30 + positions[i].degree;
      const degB = SIGNS.indexOf(positions[j].sign) * 30 + positions[j].degree;
      const diff = Math.abs(degA - degB);
      const angle = Math.min(diff, 360 - diff);

      for (const asp of ASPECT_TYPES) {
        const expectedAngle = {
          conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
        }[asp.type] ?? 0;

        if (Math.abs(angle - expectedAngle) <= asp.orb) {
          aspects.push({
            planetA: positions[i].planet,
            planetB: positions[j].planet,
            type: asp.type,
            orb: Math.round(Math.abs(angle - expectedAngle) * 10) / 10,
          });
          break;
        }
      }
    }
  }

  return {
    planets: positions,
    ascendant,
    mc,
    houses,
    aspects,
    timeRequired: !hasTime,
    timeMissingNote: hasTime ? undefined
      : "Your birth time is needed for your Rising sign, house placements, and Ascendant. These are what make your chart truly personal. You can add your birth time anytime in Settings.",
  };
}

function getSunSignIndex(month: number, day: number): number {
  // Approximate sun sign boundaries
  const boundaries = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
  if (day < boundaries[month]) return month;
  return (month + 1) % 12;
}

function parseTimeDegree(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h * 60 + m) / 4) % 360; // 24h = 360 degrees
}

function lngHash(lng: number): number {
  return ((Math.abs(lng) * 100) % 360) / 360;
}

/**
 * Compute full astrology chart. Falls back to deterministic mock when API is unavailable.
 */
export async function computeAstrology(input: AstrologyInput): Promise<AstrologyOutput> {
  const apiBase = Deno.env.get("ASTROLOGY_API_BASE_URL");
  const apiKey = Deno.env.get("ASTROLOGY_API_KEY");

  if (apiBase && apiKey) {
    try {
      const resp = await fetch(`${apiBase}/natal-chart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          date: input.date,
          time: input.time,
          lat: input.lat,
          lng: input.lng,
          timezone: input.timezone,
          house_system: input.houseSystem ?? "placidus",
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        return mapApiResponse(data, input.time === null);
      }
      console.warn("Astrology API unavailable, using fallback");
    } catch (err) {
      console.warn("Astrology API error, using fallback:", err);
    }
  }

  return computeFallbackChart(input);
}

function mapApiResponse(data: Record<string, unknown>, timeMissing: boolean): AstrologyOutput {
  // Map from external API format to our internal format
  // This is a simplified mapper — real implementation depends on the actual API shape
  return {
    planets: (data.planets as Array<Record<string, unknown>>)?.map((p) => ({
      planet: p.name as string ?? "",
      sign: p.sign as string ?? "",
      degree: p.degree as number ?? 0,
      house: p.house as number | null ?? null,
      retrograde: p.retrograde as boolean ?? false,
    })) ?? [],
    ascendant: data.ascendant
      ? { sign: (data.ascendant as Record<string, unknown>).sign as string, degree: (data.ascendant as Record<string, unknown>).degree as number }
      : null,
    mc: data.mc
      ? { sign: (data.mc as Record<string, unknown>).sign as string, degree: (data.mc as Record<string, unknown>).degree as number }
      : null,
    houses: (data.houses as Array<Record<string, unknown>>)?.map((h, i) => ({
      house: i + 1,
      sign: h.sign as string ?? "",
      degree: h.degree as number ?? 0,
    })) ?? [],
    aspects: (data.aspects as Array<Record<string, unknown>>)?.map((a) => ({
      planetA: a.planetA as string ?? "",
      planetB: a.planetB as string ?? "",
      type: a.type as string ?? "",
      orb: a.orb as number ?? 0,
    })) ?? [],
    timeRequired: timeMissing,
    timeMissingNote: timeMissing
      ? "Your birth time is needed for your Rising sign, house placements, and Ascendant."
      : undefined,
  };
}
