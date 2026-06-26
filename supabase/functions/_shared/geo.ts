/**
 * Google-backed birth-place resolution.
 *
 * This is what lets Soluna refuse to compute an exact chart from a free-typed
 * city: coordinates + a date-aware IANA timezone come ONLY from a place the user
 * picked and we resolved here — never a guess, never 0,0/UTC.
 *
 * Env: GOOGLE_MAPS_API_KEY (server-side only — proxied via the `geo` function so
 * the key is never shipped to the client).
 *
 * Pure parsers are exported for unit tests; the network calls wrap them.
 */

const PLACES_AUTOCOMPLETE = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const PLACE_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const TIMEZONE = "https://maps.googleapis.com/maps/api/timezone/json";

export interface PlaceSuggestion {
  id: string; // Google place_id
  label: string;
}

export interface ResolvedPlace {
  label: string;
  lat: number;
  lng: number;
  timezone: string; // IANA, e.g. "America/Los_Angeles"
  utcOffsetSeconds: number; // raw + DST for the requested date
}

export function isGeoConfigured(): boolean {
  return !!Deno.env.get("GOOGLE_MAPS_API_KEY");
}

function apiKey(): string {
  const k = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!k) throw new Error("GOOGLE_MAPS_API_KEY not set");
  return k;
}

// ─── pure parsers (exported for tests) ─────────────────────────────

// deno-lint-ignore no-explicit-any
export function parseAutocomplete(json: any): PlaceSuggestion[] {
  const status = json?.status;
  if (status && status !== "OK" && status !== "ZERO_RESULTS") {
    throw new Error(`places autocomplete: ${status}`);
  }
  return ((json?.predictions ?? []) as unknown[])
    .map((p) => {
      const pred = p as { place_id?: string; description?: string };
      return pred.place_id && pred.description
        ? { id: pred.place_id, label: pred.description }
        : null;
    })
    .filter((x): x is PlaceSuggestion => x !== null);
}

// deno-lint-ignore no-explicit-any
export function parsePlaceDetails(json: any): { lat: number; lng: number; label: string } {
  if (!json || json.status !== "OK") {
    throw new Error(`place details: ${json?.status ?? "bad response"}`);
  }
  const loc = json.result?.geometry?.location;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    throw new Error("place details: missing geometry");
  }
  return {
    lat: loc.lat,
    lng: loc.lng,
    label: json.result?.formatted_address ?? json.result?.name ?? "",
  };
}

// deno-lint-ignore no-explicit-any
export function parseTimezone(json: any): { timezone: string; utcOffsetSeconds: number } {
  if (!json || json.status !== "OK" || !json.timeZoneId) {
    throw new Error(`timezone: ${json?.status ?? "bad response"}`);
  }
  return {
    timezone: json.timeZoneId,
    utcOffsetSeconds: Number(json.rawOffset ?? 0) + Number(json.dstOffset ?? 0),
  };
}

/** Unix seconds at noon UTC for a YYYY-MM-DD — enough for a DST-correct offset. */
export function timestampForDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0) / 1000);
}

// ─── network calls ─────────────────────────────────────────────────

export async function autocomplete(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${PLACES_AUTOCOMPLETE}?input=${encodeURIComponent(q)}&types=(cities)&key=${apiKey()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`places autocomplete ${res.status}`);
  return parseAutocomplete(await res.json());
}

/**
 * Resolve a place_id (+ birth date) to coordinates and a date-aware IANA
 * timezone. Throws on any failure so onboarding marks the chart location-unknown
 * rather than fabricating coordinates.
 */
export async function resolvePlace(placeId: string, date: string): Promise<ResolvedPlace> {
  const detailUrl =
    `${PLACE_DETAILS}?place_id=${encodeURIComponent(placeId)}&fields=geometry,name,formatted_address&key=${apiKey()}`;
  const detailRes = await fetch(detailUrl);
  if (!detailRes.ok) throw new Error(`place details ${detailRes.status}`);
  const { lat, lng, label } = parsePlaceDetails(await detailRes.json());

  const tzUrl = `${TIMEZONE}?location=${lat},${lng}&timestamp=${timestampForDate(date)}&key=${apiKey()}`;
  const tzRes = await fetch(tzUrl);
  if (!tzRes.ok) throw new Error(`timezone ${tzRes.status}`);
  const { timezone, utcOffsetSeconds } = parseTimezone(await tzRes.json());

  return { label, lat, lng, timezone, utcOffsetSeconds };
}
