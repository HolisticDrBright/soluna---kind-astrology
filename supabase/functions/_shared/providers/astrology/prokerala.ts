// Prokerala provider. OAuth2 client-credentials → bearer token, then the
// western natal-chart endpoints. Docs: https://api.prokerala.com/
//
// Env: PROKERALA_CLIENT_ID, PROKERALA_CLIENT_SECRET
//
// We request tropical/placidus western data and normalize it. Any transport or
// shape problem throws, so the engine degrades to an honest "approximate" state
// rather than inventing precision.

import type { AspectHit } from "../../engines/types.ts";
import type { AstrologyProvider, NatalRequest, NormalizedNatal, NormalizedPlanet } from "./types.ts";
import { coerceSign, normalizeAspect, normalizePlanet, round2 } from "./normalize.ts";

const TOKEN_URL = "https://api.prokerala.com/token";
const BASE = "https://api.prokerala.com/v2/astrology";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(id: string, secret: string): Promise<string> {
  // Reuse a still-valid token (Prokerala tokens last ~1h).
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`prokerala token ${res.status}`);
  const json = await res.json();
  const token = json?.access_token;
  if (!token) throw new Error("prokerala token: missing access_token");
  cachedToken = { value: token, expiresAt: Date.now() + Number(json.expires_in ?? 3600) * 1000 };
  return token;
}

function coordsParam(req: NatalRequest): string {
  // Prokerala wants "lat,lng".
  return `${req.lat},${req.lng}`;
}

function datetimeParam(req: NatalRequest): string {
  // ISO 8601 with offset; if no timezone we send Z and the engine flags it.
  const time = req.time ?? "12:00";
  return `${req.date}T${time}:00`;
}

export class ProkeralaProvider implements AstrologyProvider {
  readonly id = "prokerala" as const;
  private clientId = Deno.env.get("PROKERALA_CLIENT_ID") ?? "";
  private clientSecret = Deno.env.get("PROKERALA_CLIENT_SECRET") ?? "";

  isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }

  async natal(req: NatalRequest): Promise<NormalizedNatal> {
    if (!this.isConfigured()) throw new Error("prokerala not configured");
    if (req.lat == null || req.lng == null) throw new Error("prokerala requires coordinates");
    const token = await getToken(this.clientId, this.clientSecret);

    const params = new URLSearchParams({
      profile: "western",
      ayanamsa: "0", // tropical
      coordinates: coordsParam(req),
      datetime: datetimeParam(req),
      house_system: req.houseSystem ?? "placidus",
      la: "en",
    });
    const res = await fetch(`${BASE}/western-chart-info?${params.toString()}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    });
    if (!res.ok) throw new Error(`prokerala natal ${res.status}`);
    const json = await res.json();
    return normalizeProkerala(json);
  }
}

/** Pure normalizer for a Prokerala western chart response. Exported for tests. */
// deno-lint-ignore no-explicit-any
export function normalizeProkerala(json: any): NormalizedNatal {
  const data = json?.data ?? json;
  const rawPlanets: unknown[] = data?.planet_positions ?? data?.planets ?? [];
  const planets: NormalizedPlanet[] = [];
  for (const p of rawPlanets) {
    const np = normalizePlanet(p, {
      nameKeys: ["name", "planet"],
      lonKeys: ["longitude", "full_degree", "degree"],
      signKeys: ["sign", "rasi", "zodiac"],
      houseKeys: ["house", "house_number"],
    });
    if (np) planets.push(np);
  }
  if (!planets.length) throw new Error("prokerala: no planets in response");

  const asc = data?.ascendant ?? data?.angles?.ascendant;
  const mc = data?.midheaven ?? data?.angles?.midheaven ?? data?.mc;
  const rawHouses: unknown[] = data?.houses ?? data?.house_cusps ?? [];
  const houses = rawHouses
    .map((h) => round2(Number((h as { longitude?: number; degree?: number })?.longitude ??
      (h as { degree?: number })?.degree ?? Number(h))))
    .filter((n) => Number.isFinite(n));

  const aspects: AspectHit[] = [];
  for (const a of (data?.aspects ?? []) as unknown[]) {
    const na = normalizeAspect(a);
    if (na) aspects.push(na);
  }

  const moonPlanet = planets.find((p) => p.planet === "Moon");
  return {
    planets,
    ascendant: asc ? { sign: coerceSign(asc.sign, num(asc.longitude)), degree: round2(num(asc.degree ?? mod30(asc.longitude))) } : undefined,
    midheaven: mc ? { sign: coerceSign(mc.sign, num(mc.longitude)), degree: round2(num(mc.degree ?? mod30(mc.longitude))) } : undefined,
    houses: houses.length === 12 ? houses : undefined,
    aspects,
    moon: moonPlanet ? { sign: moonPlanet.sign } : undefined,
    provider: "prokerala",
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function mod30(v: unknown): number {
  return ((num(v) % 30) + 30) % 30;
}
