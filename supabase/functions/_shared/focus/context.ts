// buildFocusContext — gathers ONLY the context the user allowed, prefers
// summaries over raw data, and never includes another person's private data
// beyond what their share prefs permit. Every gap becomes a confidence note.

import { serviceClient } from "../supabase.ts";
import { loadAccuracy, loadBlueprint, loadEnabledMemoryThemes, loadPreferredName, todayISO } from "../repo.ts";
import { buildContext } from "../synthesis/context.ts";
import { detectCrisis } from "../voice.ts";
import { shareFacets, type SharedFacets } from "../synthesis/synthesis.ts";
import type { AccuracyReport, Confidence } from "../synthesis/types.ts";
import type { FocusCategory } from "../schemas.ts";
import type { SupportMode } from "../voice.ts";
import {
  type AllowedContext,
  type FocusContext,
  type FocusEvidence,
  type FocusGuidance,
  type FocusRelationship,
  resolveAllowedContext,
} from "./types.ts";

export interface FocusInput {
  category: FocusCategory;
  title?: string;
  problemText: string;
  supportMode: SupportMode;
  selectedConnectionId?: string | null;
  selectedBondId?: string | null;
  allowedContext: Partial<AllowedContext>;
}

const EMPTY_ACCURACY: AccuracyReport = {
  accuracyLevel: "approximate",
  missingInputs: [],
  confidenceNotes: [],
};

function lensForCategory(category: FocusCategory): string {
  switch (category) {
    case "relationship": return "romance";
    case "friendship": return "friendship";
    case "family": return "family";
    case "work": case "school": return "work";
    default: return "romance";
  }
}

/**
 * Build the focus context. `focusId` (when updating/checking-in) lets us include
 * the user's own prior guidance + check-ins. All relationship lookups are scoped
 * to the calling user and respect share prefs.
 */
export async function buildFocusContext(
  userId: string,
  input: FocusInput,
  focusId?: string,
): Promise<FocusContext> {
  const svc = serviceClient();
  const allowed = resolveAllowedContext(input.allowedContext);

  const [bp, preferredName, accuracy] = await Promise.all([
    loadBlueprint(userId),
    loadPreferredName(userId),
    loadAccuracy(userId),
  ]);

  const blueprint = {
    sunSign: bp?.summary.sunSign ?? "—",
    moonSign: bp?.summary.moonSign ?? "—",
    rising: bp?.summary.rising ?? null,
    lifePath: bp?.summary.lifePath ?? 0,
    element: bp?.summary.element ?? "—",
    animal: bp?.summary.animal ?? "—",
    hdType: bp?.summary.hdType ?? null,
    hdAuthority: bp?.summary.hdAuthority ?? null,
    timeKnown: bp?.summary.timeKnown ?? false,
  };

  const confidenceNotes: string[] = [...((accuracy as AccuracyReport)?.confidenceNotes ?? [])];

  // ── current day snapshot (gated by currentMood) ──
  let day: FocusContext["day"];
  if (allowed.currentMood && bp) {
    const ctx = await buildContext(userId, todayISO(), bp, preferredName);
    day = {
      personalDay: ctx.personalDay,
      moonSign: ctx.transits.moon.sign,
      moonPhase: ctx.transits.moon.phase,
      chineseDaily: `${ctx.chineseDaily.element} ${ctx.chineseDaily.animal}`,
      tarot: ctx.tarot.name,
      biorhythm: {
        physical: ctx.biorhythm.physical,
        emotional: ctx.biorhythm.emotional,
        intellectual: ctx.biorhythm.intellectual,
      },
    };
  }

  // ── memory themes (gated, enabled-only) ──
  const memoryThemes = allowed.memoryThemes ? await loadEnabledMemoryThemes(userId) : [];

  // ── recent journal THEMES only — tags + titles, never raw bodies ──
  let journalThemes: string[] = [];
  if (allowed.recentJournalThemes) {
    const { data } = await svc.from("journal_entries")
      .select("title, tags, entry_date").eq("user_id", userId)
      .order("entry_date", { ascending: false }).limit(20);
    journalThemes = summarizeJournalThemes(data ?? []);
  }

  // ── saved readings (titles only) ──
  let savedReadings: string[] = [];
  if (allowed.savedReadings) {
    const { data } = await svc.from("saved_items")
      .select("kind, payload, created_at").eq("user_id", userId)
      .in("kind", ["reading", "insight", "synthesis", "tarot"])
      .order("created_at", { ascending: false }).limit(10);
    savedReadings = (data ?? []).map((s) => {
      const title = (s.payload as { title?: string } | null)?.title;
      return title ? `${title} (${s.kind})` : s.kind;
    });
  }

  // ── recent Ask history (limited + truncated user turns only) ──
  let askSnippets: string[] = [];
  if (allowed.recentAskHistory) {
    const { data: convs } = await svc.from("ask_conversations").select("id").eq("user_id", userId);
    const convIds = (convs ?? []).map((c) => c.id);
    if (convIds.length) {
      const { data: msgs } = await svc.from("ask_messages")
        .select("content, created_at").in("conversation_id", convIds).eq("role", "user")
        .order("created_at", { ascending: false }).limit(5);
      askSnippets = (msgs ?? []).map((m) => truncate(m.content, 140));
    }
  }

  // ── selected relationship (connection or bond) ──
  let relationship: FocusRelationship | undefined;
  if (allowed.selectedBondDynamics && (input.selectedConnectionId || input.selectedBondId)) {
    relationship = input.selectedBondId
      ? await buildBondRelationship(userId, input.selectedBondId, input.category, blueprint)
      : await buildConnectionRelationship(userId, input.selectedConnectionId!, input.category, blueprint);
    if (relationship) confidenceNotes.push(...relationship.confidenceNotes);
  }

  // ── prior guidance + check-ins for THIS focus (the user's own) ──
  let priorGuidance: FocusGuidance | undefined;
  const priorCheckins: { status: string; text?: string }[] = [];
  if (focusId) {
    const { data: g } = await svc.from("focus_guidance")
      .select("guidance").eq("focus_id", focusId).eq("user_id", userId)
      .order("generated_at", { ascending: false }).limit(1).maybeSingle();
    if (g?.guidance) priorGuidance = g.guidance as FocusGuidance;
    const { data: c } = await svc.from("focus_checkins")
      .select("checkin_status, checkin_text").eq("focus_id", focusId).eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(5);
    for (const row of c ?? []) {
      priorCheckins.push({ status: row.checkin_status, text: row.checkin_text ?? undefined });
    }
  }

  // ── honest gaps ──
  if (!bp) {
    confidenceNotes.push("Complete your blueprint for guidance grounded in your actual chart.");
  }
  if (!day && !allowed.currentMood) {
    confidenceNotes.push("Today's cosmic weather isn't included — enable it for more timely guidance.");
  }

  const base = (accuracy as AccuracyReport) ?? EMPTY_ACCURACY;
  const mergedAccuracy: AccuracyReport = {
    accuracyLevel: base.accuracyLevel ?? "approximate",
    missingInputs: base.missingInputs ?? [],
    // `confidenceNotes` already started from base.confidenceNotes and gathered
    // relationship + gap notes along the way; de-dupe for a clean list.
    confidenceNotes: [...new Set(confidenceNotes)],
  };

  return {
    preferredName,
    input: {
      category: input.category,
      title: input.title,
      problemText: input.problemText,
      supportMode: input.supportMode,
    },
    blueprint,
    day,
    memoryThemes,
    journalThemes,
    savedReadings,
    askSnippets,
    relationship,
    priorGuidance,
    priorCheckins,
    accuracy: mergedAccuracy,
    included: allowed,
    crisis: detectCrisis(input.problemText),
  };
}

// ─── helpers ───────────────────────────────────────────────────────
function truncate(s: string, n: number): string {
  const t = (s ?? "").trim();
  return t.length > n ? t.slice(0, n).trim() + "…" : t;
}

// deno-lint-ignore no-explicit-any
function summarizeJournalThemes(rows: any[]): string[] {
  const tagCount = new Map<string, number>();
  const titles: string[] = [];
  for (const r of rows) {
    for (const tag of (r.tags ?? []) as string[]) tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    if (r.title && titles.length < 3) titles.push(truncate(String(r.title), 60));
  }
  const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  // Themes = recurring tags first, then a few recent titles for texture.
  return [...topTags, ...titles];
}

function evidenceFor(
  selfFacets: SharedFacets,
  other: SharedFacets,
): FocusEvidence[] {
  const out: FocusEvidence[] = [];
  if (selfFacets.sun && other.sun) {
    out.push({
      system: "bond",
      signal: `${selfFacets.sun} × ${other.sun} suns`,
      detail: "Your core temperaments set the overall tone between you.",
      confidence: "high",
      source: "Both Sun signs (exact from birth dates).",
    });
  }
  if (selfFacets.lifePath && other.lifePath) {
    out.push({
      system: "bond",
      signal: `Life Paths ${selfFacets.lifePath} & ${other.lifePath}`,
      detail: "What each of you is here to learn shapes where you meet and where you stretch.",
      confidence: "high",
      source: "Both Life Path numbers (exact from birth dates).",
    });
  }
  if (selfFacets.hdType && other.hdType) {
    out.push({
      system: "bond",
      signal: `${selfFacets.hdType} & ${other.hdType}`,
      detail: "How each of you is built to engage and decide affects your rhythm together.",
      confidence: "high",
      source: "Both Human Design types (need each birth time to be precise).",
    });
  }
  return out;
}

async function buildBondRelationship(
  userId: string,
  bondId: string,
  category: FocusCategory,
  selfBp: FocusContext["blueprint"],
): Promise<FocusRelationship | undefined> {
  const svc = serviceClient();
  const { data: link } = await svc.from("partner_links").select("*").eq("id", bondId).maybeSingle();
  if (!link || (link.user_a !== userId && link.user_b !== userId) || link.status !== "active") return undefined;
  const isA = link.user_a === userId;
  const otherId = isA ? link.user_b : link.user_a;
  const otherBp = await loadBlueprint(otherId);
  if (!otherBp) {
    return {
      kind: "bond",
      name: "Your partner",
      lens: link.lens,
      evidence: [],
      confidenceNotes: ["Your partner hasn't finished their blueprint yet, so this part is limited."],
    };
  }
  // Respect the OTHER person's share prefs — only what they chose to share.
  const otherPrefs = isA ? link.b_share_prefs : link.a_share_prefs;
  const other = shareFacets("them", otherBp.summary, otherPrefs);
  const self = shareFacets("you", {
    sunSign: selfBp.sunSign, moonSign: selfBp.moonSign, lifePath: selfBp.lifePath,
    element: selfBp.element, animal: selfBp.animal, hdType: selfBp.hdType,
  }, { /* all true: it's the user's own data */ });
  const notes: string[] = [];
  if (!selfBp.timeKnown || !otherBp.summary.timeKnown) {
    notes.push("One or both birth times aren't set, so the relationship read is approximate.");
  }
  const { data: u } = await svc.from("users").select("preferred_name").eq("id", otherId).maybeSingle();
  return {
    kind: "bond",
    name: u?.preferred_name ?? "Your partner",
    lens: link.lens,
    evidence: evidenceFor(self, other),
    confidenceNotes: notes,
  };
}

async function buildConnectionRelationship(
  userId: string,
  connectionId: string,
  category: FocusCategory,
  selfBp: FocusContext["blueprint"],
): Promise<FocusRelationship | undefined> {
  const svc = serviceClient();
  const { data: conn } = await svc.from("connections")
    .select("name, time_known, blueprint").eq("id", connectionId).eq("user_id", userId).maybeSingle();
  if (!conn) return undefined;
  const summary = (conn.blueprint as { summary?: Record<string, unknown> } | null)?.summary;
  const other: SharedFacets = {
    name: conn.name,
    sun: summary?.sunSign as string | undefined,
    lifePath: summary?.lifePath as number | undefined,
    chinese: summary ? `${summary.element} ${summary.animal}` : undefined,
    hdType: summary?.hdType as string | undefined,
  };
  const self: SharedFacets = {
    name: "you", sun: selfBp.sunSign, lifePath: selfBp.lifePath,
    chinese: `${selfBp.element} ${selfBp.animal}`, hdType: selfBp.hdType ?? undefined,
  };
  const notes: string[] = [];
  if (!summary) notes.push("This connection's chart is incomplete, so the relationship read is limited.");
  if (!conn.time_known) notes.push(`${conn.name}'s birth time isn't set, so the relationship read is approximate.`);
  return {
    kind: "connection",
    name: conn.name,
    lens: lensForCategory(category),
    evidence: evidenceFor(self, other),
    confidenceNotes: notes,
  };
}
