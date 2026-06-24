// Astrology provider selector. ASTROLOGY_PROVIDER picks the implementation;
// when unset we auto-detect from whichever credentials are present. Returns null
// when nothing is configured, so the engine uses its in-process library (an
// honest "verified_library" precision — never fake-exact).

import type { AstrologyProvider, ProviderId } from "./types.ts";
import { ProkeralaProvider } from "./prokerala.ts";
import { AstrologyApiProvider } from "./astrologyapi.ts";
import { CustomProvider } from "./custom.ts";

export type { AstrologyProvider, NatalRequest, NormalizedNatal, ProviderId } from "./types.ts";

function make(id: ProviderId): AstrologyProvider {
  switch (id) {
    case "prokerala":
      return new ProkeralaProvider();
    case "astrologyapi":
      return new AstrologyApiProvider();
    case "custom":
      return new CustomProvider();
  }
}

/**
 * The active astrology provider, or null if none is configured. Explicit
 * ASTROLOGY_PROVIDER wins; otherwise the first configured provider is used.
 */
export function getAstrologyProvider(): AstrologyProvider | null {
  const explicit = (Deno.env.get("ASTROLOGY_PROVIDER") ?? "").trim().toLowerCase();
  if (explicit === "prokerala" || explicit === "astrologyapi" || explicit === "custom") {
    const p = make(explicit);
    return p.isConfigured() ? p : null;
  }
  // Auto-detect by configured credentials (preference order).
  for (const id of ["prokerala", "astrologyapi", "custom"] as ProviderId[]) {
    const p = make(id);
    if (p.isConfigured()) return p;
  }
  return null;
}
