// Soluna Focus types. Reuses the shared Confidence label and AccuracyReport, and
// EXTENDS the evidence system set to include the personal/relational sources a
// focus can draw on (journal, memory, bond, saved readings, Ask history).

import type { AccuracyReport, Confidence } from "../synthesis/types.ts";
import type { SupportMode } from "../voice.ts";
import type { FocusCategory } from "../schemas.ts";

export type FocusEvidenceSystem =
  | "astrology"
  | "numerology"
  | "human_design"
  | "chinese"
  | "tarot"
  | "biorhythm"
  | "journal"
  | "memory"
  | "bond"
  | "saved_reading"
  | "ask_history";

export interface FocusEvidence {
  system: FocusEvidenceSystem;
  signal: string;
  detail: string;
  confidence: Confidence;
  source: string;
}

export interface AllowedContext {
  recentJournalThemes: boolean;
  savedReadings: boolean;
  currentMood: boolean;
  memoryThemes: boolean;
  recentAskHistory: boolean;
  selectedBondDynamics: boolean;
}

/** Resolve a (possibly partial) allowed-context input to explicit booleans. */
export function resolveAllowedContext(raw: Partial<AllowedContext> = {}): AllowedContext {
  return {
    recentJournalThemes: !!raw.recentJournalThemes,
    savedReadings: !!raw.savedReadings,
    currentMood: !!raw.currentMood,
    memoryThemes: !!raw.memoryThemes,
    recentAskHistory: !!raw.recentAskHistory,
    selectedBondDynamics: !!raw.selectedBondDynamics,
  };
}

// ─── guidance shapes ───────────────────────────────────────────────
export interface FocusGuidance {
  whatSolunaNotices: string;
  deeperPattern: string;
  watchFor: string;
  tryThisNext: string;
  relationshipGuidance?: string;
  reflectionPrompt: string;
  followUpQuestion: string;
  evidence: FocusEvidence[];
  /** Only present for genuine crisis/self-harm/abuse content. */
  safetyNote?: string;
  /** A theme guidance noticed — REQUIRES explicit user approval before storing. */
  suggestedMemoryTheme?: { label: string; description: string } | null;
}

export interface FocusCheckinGuidance {
  whatShifted: string;
  nextStep: string;
  keepPauseOrResolve: "keep" | "pause" | "resolve";
  reflectionPrompt: string;
  evidence: FocusEvidence[];
}

// ─── context the generator consumes ────────────────────────────────
export interface FocusRelationship {
  kind: "connection" | "bond";
  name: string;
  lens?: string;
  /** Compatibility / dynamic evidence (privacy-respecting). */
  evidence: FocusEvidence[];
  confidenceNotes: string[];
}

export interface FocusDaySnapshot {
  personalDay: number;
  moonSign: string;
  moonPhase: string;
  chineseDaily: string;
  tarot: string;
  biorhythm: { physical: number; emotional: number; intellectual: number };
}

export interface FocusContext {
  preferredName: string;
  input: {
    category: FocusCategory;
    title?: string;
    problemText: string;
    supportMode: SupportMode;
  };
  blueprint: {
    sunSign: string;
    moonSign: string;
    rising: string | null;
    lifePath: number;
    element: string;
    animal: string;
    hdType: string | null;
    hdAuthority: string | null;
    timeKnown: boolean;
  };
  day?: FocusDaySnapshot;
  memoryThemes: { label: string; description: string | null }[];
  journalThemes: string[];
  savedReadings: string[];
  askSnippets: string[];
  relationship?: FocusRelationship;
  priorGuidance?: FocusGuidance;
  priorCheckins: { status: string; text?: string }[];
  accuracy: AccuracyReport;
  /** Which sources were actually included (for transparency + tests). */
  included: AllowedContext;
  /** True only for crisis/self-harm/abuse content in the problem text. */
  crisis: boolean;
}
