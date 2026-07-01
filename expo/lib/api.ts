/**
 * Soluna API client — typed wrappers around Edge Function calls.
 * All calls go through invokeEdgeFunction which handles auth.
 */
import { invokeEdgeFunction } from "./supabase";
import { config } from "./config";

// ─── Types ─────────────────────────────────────────────────────

export interface OnboardingInput {
  full_birth_name: string;
  preferred_name?: string;
  birth_date: string;
  birth_time?: string | null;
  time_known: boolean;
  birth_place_label?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  house_system?: "placidus" | "whole_sign" | "porphyry";
}

export interface BlueprintData {
  astrology?: unknown;
  numerology?: unknown;
  chinese?: unknown;
  /** Provider-backed BaZi / Four Pillars (BaziOutput); "unavailable" when absent. */
  bazi?: unknown;
  human_design?: unknown;
  biorhythm_seed?: unknown;
  computed_at?: string;
}

export interface DailyReading {
  id: string;
  user_id: string;
  reading_date: string;
  hero_text: string;
  agreement: unknown;
  affirmation: string;
  do_embrace_ease: unknown;
  personal_day?: number;
  chinese_daily?: unknown;
  tarot_card?: unknown;
  generated_at: string;
}

export interface Connection {
  id: string;
  name: string;
  birth_date: string;
  lens: string;
  created_at: string;
}

export interface CompatibilityReport {
  score: number;
  label: string;
  whereYouFlow: string[];
  whereYouGrow: string[];
  howToSupport: string[];
  astrologyNote?: string;
  numerologyNote?: string;
  /** Honest note about what the reading is (and isn't) based on. */
  confidenceNote?: string;
  /** Transparency: which real signals each side contributed. */
  basis?: { you: string[]; them: string[] };
  /** BaZi compatibility note — present only when BOTH sides have a real chart. */
  baziNote?: string;
}

// ─── API Functions ─────────────────────────────────────────────

// ─── Birth place resolution (Google, server-proxied) ───────────

export interface PlaceSuggestion {
  id: string;
  label: string;
}

export interface ResolvedPlace {
  label: string;
  lat: number;
  lng: number;
  timezone: string;
  utcOffsetSeconds: number;
}

/** Autocomplete birth-city search via the geo Edge Function. */
export async function geoAutocomplete(q: string) {
  return invokeEdgeFunction<{ configured: boolean; suggestions: PlaceSuggestion[] }>(
    `geo/autocomplete?q=${encodeURIComponent(q)}`,
  );
}

/** Resolve a picked place + birth date to real lat/lng + a date-aware timezone. */
export async function geoResolve(placeId: string, date: string) {
  return invokeEdgeFunction<{ place: ResolvedPlace }>(
    `geo/resolve?place_id=${encodeURIComponent(placeId)}&date=${encodeURIComponent(date)}`,
  );
}

/** Submit onboarding data and receive blueprint summary */
export async function submitOnboarding(input: OnboardingInput) {
  return invokeEdgeFunction<{ summary: Record<string, unknown>; timeKnown: boolean }>(
    "onboarding",
    input as unknown as Record<string, unknown>,
  );
}

/** Get the full user blueprint */
export async function getBlueprint() {
  return invokeEdgeFunction<{ blueprint: BlueprintData }>("blueprint");
}

/** Get today's daily reading. Pass a support mood (Gentle/Clear/Motivating/
 *  Reflective/Practical) to get the same reading reframed in that tone. */
export async function getToday(support?: string) {
  const path = support ? `today?support=${encodeURIComponent(support)}` : "today";
  return invokeEdgeFunction<DailyReading>(path);
}

/** Solar Return ("year ahead") reading for the currently-active return year. */
export interface SolarReturnData {
  year: number;
  returnDate: string | null;
  ascendantSign: string | null;
  sunHouse: number | null;
  moonSign: string | null;
  source: "provider" | "unavailable";
  missingInputs?: string[];
  unavailableReason?: string;
  confidenceNotes?: string[];
}

/** Fetch the Solar Return "year ahead" reading. Degrades honestly (returns an
 *  `unavailable` source) when birth time/place are missing or the provider is down. */
export async function getYearAhead() {
  return invokeEdgeFunction<{ solarReturn: SolarReturnData | null }>("year-ahead");
}

/** Ask Soluna a question */
export async function askSoluna(message: string, conversationId?: string) {
  return invokeEdgeFunction<{
    conversation_id: string;
    message: { role: string; content: string; systems_referenced: string[] };
  }>("ask", { message, conversation_id: conversationId || undefined });
}

/** Get ask conversation history */
export async function getAskHistory(conversationId?: string) {
  const url = conversationId ? `ask/history?conversation_id=${conversationId}` : "ask/history";
  return invokeEdgeFunction<{ conversations: unknown[]; messages: unknown[] }>(url);
}

/** Get user profile and settings */
export async function getMe() {
  return invokeEdgeFunction<{
    profile: unknown;
    birthProfile: unknown;
    blueprint: BlueprintData | null;
    notificationPrefs: unknown;
    subscription: unknown;
    summaryChip: string;
  }>("me");
}

/** Birth profile fields accepted by PATCH /me — same shape onboarding sends.
 *  When real lat/lng/timezone are present the server recomputes the blueprint. */
export interface BirthProfileUpdate {
  full_birth_name: string;
  birth_date: string;
  birth_time?: string | null;
  time_known: boolean;
  birth_place_label?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  house_system?: "placidus" | "whole_sign" | "porphyry";
}

/** Update profile: preferred name, birth profile, notification prefs, and/or push token (PATCH /me).
 *  Re-sending `birth_profile` with real lat/lng/timezone triggers a server-side blueprint recompute. */
export async function updateMe(payload: {
  preferred_name?: string;
  birth_profile?: BirthProfileUpdate;
  notification_prefs?: Record<string, unknown>;
  push_token?: { expo_token: string; platform?: "ios" | "android" };
}) {
  return invokeEdgeFunction("me", payload as unknown as Record<string, unknown>, "PATCH");
}

/** Permanently delete the signed-in user's account and all associated data. */
export async function deleteAccount() {
  return invokeEdgeFunction<{ ok: boolean }>("delete-account", {}, "POST");
}

/** Get saved items */
export async function getSaved() {
  return invokeEdgeFunction<{ items: unknown[] }>("saved");
}

/** Save an item */
export async function saveItem(kind: string, refId: string) {
  return invokeEdgeFunction("saved", { kind, ref_id: refId });
}

/** Get connections */
export async function getConnections() {
  return invokeEdgeFunction<{ connections: Connection[] }>("connections");
}

/** Add a connection. Birth time + a resolved place (lat/lng/timezone) are
 *  optional, but sending them unlocks BaZi / Four Pillars and full-chart
 *  astrology compatibility for this person (the backend stores + uses them). */
export async function addConnection(input: {
  name: string;
  birth_date: string;
  birth_time?: string | null;
  birth_place_label?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  lens?: string;
}) {
  return invokeEdgeFunction("connections", input as unknown as Record<string, unknown>);
}

/** Get compatibility report */
export async function getCompatibility(connectionId: string, lens = "romance") {
  return invokeEdgeFunction<CompatibilityReport>(
    `connections/${connectionId}/compatibility?lens=${lens}`,
  );
}

/** Draw tarot cards */
export async function drawTarot(spread: string = "daily", question?: string) {
  return invokeEdgeFunction<{
    cards: { name?: string; reversed?: boolean; arcana?: string }[];
    interpretation: string;
    positions?: { name: string; meaning: string }[];
    nudge: string;
  }>("tarot", { spread, question });
}

/** Get rituals */
export async function getRituals(phase?: string) {
  const url = phase ? `rituals?phase=${phase}` : "rituals";
  return invokeEdgeFunction<{ rituals: unknown[] }>(url);
}

/** Get journal entries */
export async function getJournal(limit = 20) {
  return invokeEdgeFunction<{ entries: unknown[] }>(`journal?limit=${limit}`);
}

/** Create journal entry */
export async function createJournalEntry(body: string, mood?: number) {
  return invokeEdgeFunction("journal", { body, mood });
}

/** Get insight for a blueprint item */
export async function getInsight(system: string, key: string) {
  return invokeEdgeFunction(`insight?system=${system}&key=${key}`);
}

/** One cross-system theme where ≥2 systems point the same way. Mirrors the
 *  `synthesis` Edge Function's `AgreementResult` (see _shared/synthesis). */
export interface SynthesisAgreement {
  theme: string;
  label: string;
  /** How many DISTINCT systems align on this theme (≥2). */
  score: number;
  /** Plain-language meaning of this convergence (reflective, not fate). */
  takeaway?: string;
  evidence: { system: string; signal: string; detail: string }[];
}

export interface SynthesisResponse {
  agreements: SynthesisAgreement[];
  /** Present only when a `theme` filter is passed. */
  allAgreements?: SynthesisAgreement[];
}

/** Get synthesis (where systems agree) */
export async function getSynthesis(theme?: string) {
  const url = theme ? `synthesis?theme=${theme}` : "synthesis";
  return invokeEdgeFunction<SynthesisResponse>(url);
}

/** Check premium entitlements */
export async function getEntitlements() {
  return invokeEdgeFunction<{ isPremium: boolean; entitlement: string }>("entitlements");
}

// ─── Resonance feedback / personalization ──────────────────────

export type ResonanceSource = "today" | "ask" | "focus" | "compatibility" | "tarot" | "blueprint";
export type ResonanceValue = "yes" | "partly" | "no";

export interface ResonanceFeedbackPayload {
  sourceType: ResonanceSource;
  sourceId?: string;
  resonance: ResonanceValue;
  reasonTags?: string[];
  freeText?: string;
  reframeRequested?: string;
  systemsReferenced?: string[];
}

export interface ResonanceResult {
  ok: boolean;
  message: string;
  summary: string | null;
}

const RESONANCE_USE_MOCK_DATA = config.demoMode;

/**
 * Submit "Did this resonate?" feedback. Adjusts how Soluna communicates over
 * time — never the underlying chart facts. In demo mode this is a no-op that
 * resolves successfully (no real write), keeping demo separate from live.
 */
export async function submitResonanceFeedback(payload: ResonanceFeedbackPayload) {
  if (RESONANCE_USE_MOCK_DATA) {
    return {
      data: { ok: true, message: "Got it. Soluna will tune future guidance to you.", summary: null } as ResonanceResult,
      error: null,
    };
  }
  return invokeEdgeFunction<ResonanceResult>(
    "resonance",
    payload as unknown as Record<string, unknown>,
    "POST",
  );
}

/** Per-system "fit" — how strongly each lens resonates with this user. */
export interface SystemFit {
  system: string;
  yes: number;
  low: number;
  total: number;
  /** Resonance rate 0..1 (yes / total). */
  score: number;
  /** True once there's enough feedback to trust the signal. */
  enoughSignal: boolean;
}

/** The learned personalization profile (delivery preferences + resonant lenses). */
export interface PersonalizationProfile {
  preferred_tone: string | null;
  detail_level: string | null;
  spirituality_level: string | null;
  action_style: string | null;
  preferred_focus_areas: string[];
  resonant_systems: string[];
  less_resonant_systems: string[];
  summary: string | null;
  feedback_count: number;
}

/**
 * Fetch the caller's personalization profile + per-system fit ranking. The
 * ranking is computed live from the user's own 👍/🤔/👎 feedback — it only
 * reflects what they've said resonates, never changes any chart fact. Demo mode
 * returns an empty result (no real read).
 */
export async function getPersonalizationProfile() {
  if (RESONANCE_USE_MOCK_DATA) {
    return { data: { profile: null as PersonalizationProfile | null, systemFit: [] as SystemFit[] }, error: null };
  }
  return invokeEdgeFunction<{ profile: PersonalizationProfile | null; systemFit: SystemFit[] }>(
    "resonance/profile",
  );
}
