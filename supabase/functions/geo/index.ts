// GET /geo/autocomplete?q=<text>            -> { configured, suggestions[] }
// GET /geo/resolve?placeId=<id>&date=<YMD>   -> { place: {label,lat,lng,timezone,utcOffsetSeconds} }
//
// Server-side proxy for Google Places + Time Zone so the API key never ships to
// the client AND so a birth chart's coordinates/timezone come only from a
// RESOLVED place — never a free-typed guess. Auth-gated to prevent key abuse.
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, serve, subPath, ValidationError } from "../_shared/http.ts";
import { autocomplete, isGeoConfigured, resolvePlace } from "../_shared/providers/geo/index.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(serve(async (req) => {
  await getUser(req); // authenticated users only
  const segs = subPath(req, "geo");
  const url = new URL(req.url);

  if (req.method === "GET" && segs[0] === "autocomplete") {
    // Degrade gracefully: if no key is configured, tell the client so it can
    // fall back to manual entry (which yields an approximate, honest chart).
    if (!isGeoConfigured()) return json({ configured: false, suggestions: [] });
    const q = url.searchParams.get("q") ?? "";
    try {
      return json({ configured: true, suggestions: await autocomplete(q) });
    } catch (_e) {
      return json({ configured: true, suggestions: [], error: "Place search is briefly unavailable." });
    }
  }

  if (req.method === "GET" && segs[0] === "resolve") {
    if (!isGeoConfigured()) {
      // No fake coordinates: tell the caller resolution is unavailable.
      throw new HttpError(503, "Location resolution isn't configured. Your chart will be approximate.");
    }
    const placeId = url.searchParams.get("placeId") ?? "";
    const date = url.searchParams.get("date") ?? "";
    if (!placeId) throw new ValidationError("placeId is required");
    if (!DATE_RE.test(date)) throw new ValidationError("date must be YYYY-MM-DD");
    try {
      return json({ place: await resolvePlace(placeId, date) });
    } catch (_e) {
      throw new HttpError(502, "We couldn't resolve that place right now. Please try again.");
    }
  }

  throw new ValidationError("Use GET /geo/autocomplete?q= or GET /geo/resolve?placeId=&date=");
}));
