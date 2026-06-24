/**
 * Soluna API client — typed wrappers around Edge Function calls.
 * All calls go through invokeEdgeFunction which handles auth.
 */
import { invokeEdgeFunction } from "./supabase";

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
}

// ─── API Functions ─────────────────────────────────────────────

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

/** Get today's daily reading */
export async function getToday() {
  return invokeEdgeFunction<DailyReading>("today");
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
    notificationPrefs: unknown;
    subscription: unknown;
    summaryChip: string;
  }>("me");
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

/** Add a connection */
export async function addConnection(input: {
  name: string;
  birth_date: string;
  birth_time?: string | null;
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
    cards: unknown[];
    interpretation: string;
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

/** Get synthesis (where systems agree) */
export async function getSynthesis(theme?: string) {
  const url = theme ? `synthesis?theme=${theme}` : "synthesis";
  return invokeEdgeFunction(url);
}

/** Check premium entitlements */
export async function getEntitlements() {
  return invokeEdgeFunction<{ isPremium: boolean; entitlement: string }>("entitlements");
}
