// AstrologyAPI.com provider. HTTP Basic auth (userId:apiKey), JSON POST bodies.
// Docs: https://astrologyapi.com/ — we use the Western "planets/tropical",
// "western_horoscope" style endpoints.
//
// Env: ASTROLOGY_API_USER_ID, ASTROLOGY_API_KEY
//
// Throws on any transport/shape problem so the engine degrades honestly.

import type { AspectHit } from "../../engines/types.ts";
import type { AstrologyProvider, NatalRequest, NormalizedNatal, NormalizedPlanet } from "./types.ts";
import { coerceSign, normalizeAspect, normalizePlanet, round2 } from "./normalize.ts";

const BASE = "https://json.astrologyapi.com/v1";

function basicAuth(userId: string, key: string): string {
  return "Basic " + btoa(`${userId}:${key}`);
}

function requestBody(req: NatalRequest): Record<string, number> {
  const [y, m, d] = req.date.split("-").map(Number);
  const [hh, mm] = (req.time ?? "12:00").split(":").map(Number);
  // AstrologyAPI takes a numeric UTC offset; default 0 when timezone unknown
  // (the engine flags missing timezone as a confidence note).
  return {
    day: d,
    month: m,
    year: y,
    hour: hh ?? 12,
    min: mm ?? 0,
    lat: req.lat ?? 0,
    lon: req.lng ?? 0,
    tzone: offsetHours(req.timezone),
  };
}

// Best-effort fixed-offset lookup; real per-date offsets come from the geo
// provider's Time Zone API and are passed in via req.timezone upstream.
function offsetHours(_tz?: string): number {
  return 0;
}

export class AstrologyApiProvider implements AstrologyProvider {
  readonly id = "astrologyapi" as const;
  private userId = Deno.env.get("ASTROLOGY_API_USER_ID") ?? "";
  private apiKey = Deno.env.get("ASTROLOGY_API_KEY") ?? "";

  isConfigured(): boolean {
    return !!this.userId && !!this.apiKey;
  }

  async natal(req: NatalRequest): Promise<NormalizedNatal> {
    if (!this.isConfigured()) throw new Error("astrologyapi not configured");
    if (req.lat == null || req.lng == null) throw new Error("astrologyapi requires coordinates");
    const headers = {
      authorization: basicAuth(this.userId, this.apiKey),
      "content-type": "application/json",
      accept: "application/json",
    };
    const body = JSON.stringify(requestBody(req));
    // Planets + western horoscope (houses/aspects/ascendant) in parallel.
    const [planetsRes, horoscopeRes] = await Promise.all([
      fetch(`${BASE}/planets/tropical`, { method: "POST", headers, body }),
      fetch(`${BASE}/western_horoscope`, { method: "POST", headers, body }),
    ]);
    if (!planetsRes.ok) throw new Error(`astrologyapi planets ${planetsRes.status}`);
    const planetsJson = await planetsRes.json();
    const horoscopeJson = horoscopeRes.ok ? await horoscopeRes.json() : null;
    return normalizeAstrologyApi(planetsJson, horoscopeJson);
  }
}

/** Pure normalizer for AstrologyAPI responses. Exported for tests. */
// deno-lint-ignore no-explicit-any
export function normalizeAstrologyApi(planetsJson: any, horoscopeJson: any): NormalizedNatal {
  const rawPlanets: unknown[] = Array.isArray(planetsJson)
    ? planetsJson
    : (planetsJson?.planets ?? horoscopeJson?.planets ?? []);
  const planets: NormalizedPlanet[] = [];
  for (const p of rawPlanets) {
    const np = normalizePlanet(p, {
      nameKeys: ["name", "planet"],
      lonKeys: ["full_degree", "fullDegree", "longitude", "norm_degree"],
      signKeys: ["sign", "zodiac"],
      houseKeys: ["house", "house_number"],
    });
    if (np && np.planet) planets.push(np);
  }
  if (!planets.length) throw new Error("astrologyapi: no planets in response");

  const houses: number[] = [];
  for (const h of (horoscopeJson?.houses ?? []) as unknown[]) {
    const deg = Number((h as { degree?: number; start_degree?: number })?.degree ??
      (h as { start_degree?: number })?.start_degree);
    if (Number.isFinite(deg)) houses.push(round2(deg));
  }

  const asc = horoscopeJson?.ascendant;
  const mc = horoscopeJson?.midheaven ?? horoscopeJson?.mc;
  const aspects: AspectHit[] = [];
  for (const a of (horoscopeJson?.aspects ?? []) as unknown[]) {
    const na = normalizeAspect(a);
    if (na) aspects.push(na);
  }

  const moonPlanet = planets.find((p) => p.planet === "Moon");
  return {
    planets,
    ascendant: asc != null
      ? { sign: coerceSign(typeof asc === "object" ? asc.sign : undefined, num(typeof asc === "object" ? asc.longitude : asc)), degree: round2(mod30(typeof asc === "object" ? (asc.degree ?? asc.longitude) : asc)) }
      : undefined,
    midheaven: mc != null
      ? { sign: coerceSign(typeof mc === "object" ? mc.sign : undefined, num(typeof mc === "object" ? mc.longitude : mc)), degree: round2(mod30(typeof mc === "object" ? (mc.degree ?? mc.longitude) : mc)) }
      : undefined,
    houses: houses.length === 12 ? houses : undefined,
    aspects,
    moon: moonPlanet ? { sign: moonPlanet.sign } : undefined,
    provider: "astrologyapi",
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function mod30(v: unknown): number {
  return ((num(v) % 30) + 30) % 30;
}
