/**
 * Honest accuracy metadata for a generated reading, derived from the blueprint's
 * astrology provenance + whether birth time is known. Pure (no IO) so it's
 * unit-testable and reusable by `today` and `generate-daily-readings`.
 *
 * Rules (no silent fake precision):
 *  - no chart at all              -> "blocked"
 *  - in-app approximation         -> "approximate" (never "exact")
 *  - real provider, time unknown  -> "partial"
 *  - real provider, time known    -> "exact"
 */

import type { AstrologyOutput } from "./engines/astrology.ts";

export type AccuracyLevel = "exact" | "partial" | "approximate" | "blocked";

export interface ReadingAccuracy {
  accuracy_level: AccuracyLevel;
  missing_inputs: string[];
  confidence_notes: string[];
}

export function deriveReadingAccuracy(astrology: AstrologyOutput | null): ReadingAccuracy {
  if (!astrology) {
    return {
      accuracy_level: "blocked",
      missing_inputs: ["birth_profile"],
      confidence_notes: ["Complete onboarding so Soluna can generate an accurate reading from your real chart."],
    };
  }

  const missing_inputs: string[] = [];
  const confidence_notes: string[] = [];

  if (astrology.timeRequired) {
    missing_inputs.push("birth_time");
    confidence_notes.push(
      "Your birth time is needed for your Rising sign, houses, and the most precise reading. You can add it anytime in Settings.",
    );
  }

  let accuracy_level: AccuracyLevel;
  if (astrology.source === "approximation") {
    accuracy_level = "approximate";
    missing_inputs.push("verified_ephemeris");
    confidence_notes.push(
      "These placements are Soluna's in-app estimate. Connecting a precise ephemeris provider makes them exact.",
    );
  } else {
    accuracy_level = astrology.timeRequired ? "partial" : "exact";
  }

  return { accuracy_level, missing_inputs, confidence_notes };
}
