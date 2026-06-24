// Weekly Integration Report — looks back across the week's daily readings,
// saved items, journal entries, and agreement evidence to surface repeating
// themes and a gentle carry-forward. Deterministic aggregation + an optional
// LLM narrative with a safe fallback. Never overstates certainty.

import { llm } from "./llm.ts";
import { z } from "zod";
import type { EvidenceSystemId } from "./synthesis/types.ts";

// Normalize agreement's camelCase system ids to the product-wide vocabulary.
const SYSTEM_NORMALIZE: Record<string, EvidenceSystemId> = {
  astrology: "astrology",
  numerology: "numerology",
  chinese: "chinese",
  humanDesign: "human_design",
  human_design: "human_design",
  biorhythm: "biorhythm",
  tarot: "tarot",
};

export interface WeeklyReadingRow {
  reading_date: string;
  hero_text?: string | null;
  // deno-lint-ignore no-explicit-any
  agreement?: any;
}
// deno-lint-ignore no-explicit-any
export interface WeeklyJournalRow { entry_date: string; title?: string | null; body?: string | null }
// deno-lint-ignore no-explicit-any
export type WeeklySavedRow = any;

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  repeatingThemes: string[];
  systemsThatAgreed: { system: EvidenceSystemId; count: number }[];
  savedReadings: WeeklySavedRow[];
  journalHighlights: string[];
  carryForward: string;
  shiftForNextWeek: string;
  // trust + meta
  daysWithReadings: number;
  enoughData: boolean;
  accuracyLevel: "exact" | "partial" | "approximate" | "blocked";
  confidenceNotes: string[];
}

/** weekEnd = weekStart + 6 days, both inclusive (YYYY-MM-DD, UTC-safe). */
export function weekEndFor(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + 6));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${end.getUTCFullYear()}-${p(end.getUTCMonth() + 1)}-${p(end.getUTCDate())}`;
}

function firstLine(body: string, max = 90): string {
  const line = (body ?? "").split(/[.\n]/)[0].trim();
  return line.length > max ? line.slice(0, max).trim() + "…" : line;
}

/** Pure aggregation over the week's data (no LLM). */
export function summarizeWeek(
  readings: WeeklyReadingRow[],
  saved: WeeklySavedRow[],
  journal: WeeklyJournalRow[],
) {
  const themeCount = new Map<string, number>();
  const systemCount = new Map<EvidenceSystemId, number>();
  for (const r of readings) {
    const title: string | undefined = r.agreement?.title;
    if (title) themeCount.set(title, (themeCount.get(title) ?? 0) + 1);
    const systems: { system?: string }[] = r.agreement?.systems ?? [];
    const distinct = new Set<EvidenceSystemId>();
    for (const s of systems) {
      const id = s.system ? SYSTEM_NORMALIZE[s.system] : undefined;
      if (id) distinct.add(id);
    }
    for (const id of distinct) systemCount.set(id, (systemCount.get(id) ?? 0) + 1);
  }

  // "Repeating" = surfaced on 2+ days; fall back to the most frequent if none repeat.
  const sortedThemes = [...themeCount.entries()].sort((a, b) => b[1] - a[1]);
  let repeatingThemes = sortedThemes.filter(([, c]) => c >= 2).map(([t]) => t);
  if (repeatingThemes.length === 0) repeatingThemes = sortedThemes.slice(0, 2).map(([t]) => t);

  const systemsThatAgreed = [...systemCount.entries()]
    .map(([system, count]) => ({ system, count }))
    .sort((a, b) => b.count - a.count);

  const journalHighlights = journal
    .filter((j) => (j.title && j.title.trim()) || (j.body && j.body.trim()))
    .slice(0, 5)
    .map((j) => (j.title?.trim() ? j.title.trim() : firstLine(j.body ?? "")));

  return {
    repeatingThemes,
    systemsThatAgreed,
    journalHighlights,
    savedReadings: saved,
    daysWithReadings: readings.length,
  };
}

const narrativeSchema = z.object({
  carryForward: z.string().min(10),
  shiftForNextWeek: z.string().min(10),
});

function fallbackNarrative(repeatingThemes: string[]): { carryForward: string; shiftForNextWeek: string } {
  const lead = repeatingThemes[0]?.toLowerCase();
  return {
    carryForward: lead
      ? `This week kept gently returning to ${lead}. Carry forward what you learned there — ` +
        `you don't have to solve it all at once, just keep noticing.`
      : "Carry forward a little kindness toward yourself, and the small practices that actually helped this week.",
    shiftForNextWeek:
      "Next week, pick one small, repeatable thing that supports you and let the rest be lighter.",
  };
}

/** Warm narrative for the week. Falls back cleanly when the LLM is unavailable. */
export async function generateWeeklyNarrative(
  preferredName: string,
  repeatingThemes: string[],
  systemsThatAgreed: { system: string; count: number }[],
  daysWithReadings: number,
): Promise<{ carryForward: string; shiftForNextWeek: string; usedFallback: boolean }> {
  if (daysWithReadings === 0) {
    return { ...fallbackNarrative(repeatingThemes), usedFallback: true };
  }
  const prompt = [
    `Write a brief weekly integration note for ${preferredName}, based ONLY on this summary.`,
    `Days with readings: ${daysWithReadings}.`,
    `Repeating themes: ${repeatingThemes.join(", ") || "(none clear yet)"}.`,
    `Systems that agreed most: ${systemsThatAgreed.slice(0, 3).map((s) => s.system).join(", ") || "(varied)"}.`,
    "",
    "Return JSON {carryForward (1-2 warm sentences on what to carry from this week, no " +
    "overstated certainty), shiftForNextWeek (one small, doable focus for next week)}. " +
    "Reflective and honest — if the week was sparse, say so kindly rather than inventing patterns.",
  ].join("\n");
  try {
    const parsed = await llm.completeJSON([{ role: "user", content: prompt }], narrativeSchema, {
      temperature: 0.6,
      maxTokens: 350,
    });
    return { ...parsed, usedFallback: false };
  } catch (_e) {
    return { ...fallbackNarrative(repeatingThemes), usedFallback: true };
  }
}

/** A useful, warm empty state when there isn't enough data to integrate yet. */
export function emptyWeeklyBody(weekStart: string, weekEnd: string, daysWithReadings: number): WeeklyReport {
  return {
    weekStart,
    weekEnd,
    repeatingThemes: [],
    systemsThatAgreed: [],
    savedReadings: [],
    journalHighlights: [],
    carryForward:
      "There isn't quite enough here to weave a pattern yet — and that's completely okay. " +
      "Open your daily reading a few times this week and your story will start to take shape.",
    shiftForNextWeek: "Next week, simply check in with your reading on the days you can. That's enough.",
    daysWithReadings,
    enoughData: false,
    accuracyLevel: "approximate",
    confidenceNotes: [
      `Based on ${daysWithReadings} ${daysWithReadings === 1 ? "day" : "days"} of readings this week — ` +
      "a few more will make your weekly reflection much richer.",
    ],
  };
}
