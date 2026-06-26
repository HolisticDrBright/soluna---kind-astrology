/**
 * GET /geo/autocomplete?q=<text>           -> { configured, suggestions[] }
 * GET /geo/resolve?place_id=<id>&date=<YMD> -> { place: {label,lat,lng,timezone,utcOffsetSeconds} }
 *
 * Server-side proxy for Google Places + Time Zone so the API key never reaches
 * the client, AND so a birth chart's coordinates/timezone come only from a
 * RESOLVED place — never a free-typed guess. JWT-verified (user-facing).
 */

import { requireAuth, AuthError } from "../_shared/auth.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { autocomplete, isGeoConfigured, resolvePlace } from "../_shared/geo.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    await requireAuth(req); // authenticated users only (protects the API key)
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname.endsWith("/autocomplete")) {
      // Degrade gracefully: if no key is configured, tell the client so it can
      // fall back to manual entry (which yields an honest, approximate chart).
      if (!isGeoConfigured()) return jsonResponse({ configured: false, suggestions: [] });
      const q = url.searchParams.get("q") ?? "";
      try {
        return jsonResponse({ configured: true, suggestions: await autocomplete(q) });
      } catch (_e) {
        return jsonResponse({ configured: true, suggestions: [], error: "Place search is briefly unavailable." });
      }
    }

    if (req.method === "GET" && url.pathname.endsWith("/resolve")) {
      if (!isGeoConfigured()) {
        // No fake coordinates — tell the caller resolution is unavailable.
        return errorResponse("Location resolution is not configured.", 503);
      }
      const placeId = url.searchParams.get("place_id") ?? "";
      const date = url.searchParams.get("date") ?? "";
      if (!placeId) return errorResponse("place_id is required", 400);
      if (!DATE_RE.test(date)) return errorResponse("date must be YYYY-MM-DD", 400);
      try {
        return jsonResponse({ place: await resolvePlace(placeId, date) });
      } catch (_e) {
        return errorResponse("We couldn't resolve that place right now. Please try again.", 502);
      }
    }

    return errorResponse("Use GET /geo/autocomplete?q= or GET /geo/resolve?place_id=&date=", 404);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse("Unauthorized", 401);
    console.error("Geo error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
