// Astrology provider abstraction. A provider returns a NORMALIZED natal payload
// (and optionally transits/synastry); the AstrologyEngine maps it onto the
// app's AstrologyResult and applies honest confidence gating. Swapping providers
// (Prokerala, AstrologyAPI, a custom endpoint) never touches the engine.

import type { AspectHit, HouseSystem, ZodiacSign } from "../../engines/types.ts";

export type ProviderId = "prokerala" | "astrologyapi" | "custom";

export interface NatalRequest {
  /** YYYY-MM-DD (civil date at birth place). */
  date: string;
  /** HH:MM (24h) at birth place, or null if unknown. */
  time: string | null;
  lat?: number;
  lng?: number;
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timezone?: string;
  houseSystem?: HouseSystem;
}

export interface NormalizedPlanet {
  planet: string;
  sign: ZodiacSign;
  /** ecliptic longitude 0..360 */
  longitude: number;
  /** degree within sign 0..30 */
  degree: number;
  house?: number | null;
  retrograde?: boolean;
}

export interface NormalizedAngle {
  sign: ZodiacSign;
  degree: number;
}

export interface NormalizedMoon {
  sign?: ZodiacSign;
  phase?: string;
  illumination?: number;
}

/** Provider output AFTER normalization — provider-agnostic, before engine gating. */
export interface NormalizedNatal {
  planets: NormalizedPlanet[];
  ascendant?: NormalizedAngle;
  midheaven?: NormalizedAngle;
  /** 12 house cusp longitudes (0..360), if the provider returns them. */
  houses?: number[];
  aspects?: AspectHit[];
  moon?: NormalizedMoon;
  /** Which provider produced this. */
  provider: ProviderId;
}

export interface AstrologyProvider {
  readonly id: ProviderId;
  /** True only when the necessary credentials/config are present. */
  isConfigured(): boolean;
  /** Throws on transport/parse failure so the engine can degrade honestly. */
  natal(req: NatalRequest): Promise<NormalizedNatal>;
}
