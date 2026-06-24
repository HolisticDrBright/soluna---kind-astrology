// Custom provider — a generic JSON endpoint you control. Preserves Soluna's
// original hosted-adapter contract: POST {date,time,latitude,longitude,timezone,
// house_system} to ASTROLOGY_API_BASE_URL/natal and read back a normalized-ish body.
//
// Env: ASTROLOGY_API_BASE_URL, ASTROLOGY_API_KEY (optional bearer)

import type { AspectHit } from "../../engines/types.ts";
import type { AstrologyProvider, NatalRequest, NormalizedNatal, NormalizedPlanet } from "./types.ts";
import { coerceSign, normalizeAspect, normalizePlanet, round2 } from "./normalize.ts";

export class CustomProvider implements AstrologyProvider {
  readonly id = "custom" as const;
  private base = Deno.env.get("ASTROLOGY_API_BASE_URL") ?? "";
  private key = Deno.env.get("ASTROLOGY_API_KEY") ?? "";

  isConfigured(): boolean {
    return !!this.base;
  }

  async natal(req: NatalRequest): Promise<NormalizedNatal> {
    if (!this.isConfigured()) throw new Error("custom astrology API not configured");
    const res = await fetch(`${this.base.replace(/\/$/, "")}/natal`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.key ? { authorization: `Bearer ${this.key}` } : {}),
      },
      body: JSON.stringify({
        date: req.date,
        time: req.time,
        latitude: req.lat,
        longitude: req.lng,
        timezone: req.timezone,
        house_system: req.houseSystem ?? "placidus",
      }),
    });
    if (!res.ok) throw new Error(`custom astrology API ${res.status}`);
    return normalizeCustom(await res.json());
  }
}

/** Pure normalizer for the custom endpoint. Exported for tests. */
// deno-lint-ignore no-explicit-any
export function normalizeCustom(data: any): NormalizedNatal {
  const planets: NormalizedPlanet[] = [];
  for (const p of (data?.planets ?? []) as unknown[]) {
    const np = normalizePlanet(p);
    if (np) planets.push(np);
  }
  if (!planets.length) throw new Error("custom astrology API: no planets");
  const aspects: AspectHit[] = [];
  for (const a of (data?.aspects ?? []) as unknown[]) {
    const na = normalizeAspect(a);
    if (na) aspects.push(na);
  }
  const houses = Array.isArray(data?.houses)
    ? (data.houses as unknown[]).map((h) => round2(Number(h))).filter((n) => Number.isFinite(n))
    : [];
  const moonPlanet = planets.find((p) => p.planet === "Moon");
  return {
    planets,
    ascendant: data?.ascendant
      ? { sign: coerceSign(data.ascendant.sign, Number(data.ascendant.longitude ?? 0)), degree: round2(Number(data.ascendant.degree ?? 0)) }
      : undefined,
    midheaven: data?.midheaven
      ? { sign: coerceSign(data.midheaven.sign, Number(data.midheaven.longitude ?? 0)), degree: round2(Number(data.midheaven.degree ?? 0)) }
      : undefined,
    houses: houses.length === 12 ? houses : undefined,
    aspects,
    moon: moonPlanet ? { sign: moonPlanet.sign } : undefined,
    provider: "custom",
  };
}
