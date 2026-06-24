// Shared types for the "explainable guidance" product layer: support mode,
// explainable evidence chips, the Soluna Shift, and notification/widget copy.
// Kept dependency-light so every Edge Function can import them.

import type { AccuracyLevel, AccuracyReport } from "../engines/types.ts";
export type { AccuracyLevel, AccuracyReport } from "../engines/types.ts";
export { type SupportMode, SUPPORT_MODES } from "../voice.ts";

// ─── explainable evidence chip ─────────────────────────────────────
// The canonical, UI-renderable "why" behind any piece of guidance. Confidence
// is a coarse label (not a raw number) so the frontend never has to interpret.
export type EvidenceSystemId =
  | "astrology"
  | "numerology"
  | "human_design"
  | "chinese"
  | "tarot"
  | "biorhythm";

export type Confidence = "high" | "medium" | "low";

export interface Evidence {
  system: EvidenceSystemId;
  /** Short headline of what this system is showing (e.g. "Moon in Cancer"). */
  signal: string;
  /** A fuller, plain-language explanation. */
  detail: string;
  confidence: Confidence;
  /** Concrete provenance — the actual data point this came from. */
  source: string;
}

// ─── Soluna Shift ──────────────────────────────────────────────────
// Turns a reading into practical, explainable action. Warm, grounded,
// never fear-based, never imitating a specific public figure.
export interface SolunaShift {
  /** A kind reframe of the day's energy. */
  reframe: string;
  /** A tiny (≈2-minute) reset/grounding practice. */
  reset: string;
  /** One small, brave, doable action. */
  braveTinyAction: string;
  /** A reflective journaling prompt. */
  journalPrompt: string;
  /** The tone the Shift was written in, echoed back for the UI. */
  supportMode?: import("../voice.ts").SupportMode;
}

// ─── notification / widget copy ────────────────────────────────────
// Short, useful, non-fortune-cookie copy derived from Today / Weekly data.
export interface NotifyPayload {
  widgetTitle: string;
  widgetBody: string;
  pushTitle: string;
  pushBody: string;
}

/** Convenience: an accuracy-shaped trust block attached to new responses. */
export type TrustBlock = AccuracyReport;
export type { AccuracyLevel as TrustLevel };
