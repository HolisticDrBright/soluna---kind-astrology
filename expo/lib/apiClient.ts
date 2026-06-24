// Typed wrapper over supabase.functions.invoke + a streaming helper for Ask.
// On 401 we sign the user out so the auth gate takes over.
import { fetch as expoFetch } from "expo/fetch";
import { supabase } from "@/lib/supabase";
import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from "@/config/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface InvokeOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

async function invoke<T>(path: string, options: InvokeOptions = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(path, {
    method: options.method ?? "GET",
    body: options.body as Record<string, unknown> | undefined,
  });
  if (error) {
    let status = 0;
    let message = error.message;
    // FunctionsHttpError carries the original Response on `.context`.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.status === "number") {
      status = ctx.status;
      try {
        const j = await ctx.json();
        if (j?.error) message = j.error;
      } catch {
        // non-JSON error body; keep the default message
      }
    }
    if (status === 401) {
      await supabase.auth.signOut();
    }
    throw new ApiError(status, message);
  }
  return data as T;
}

const qs = (params: Record<string, string | undefined>): string => {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&");
};

// ─── endpoints ─────────────────────────────────────────────────────
export const api = {
  onboarding: (body: unknown) => invoke<OnboardingResponse>("onboarding/blueprint", { method: "POST", body }),

  blueprint: () => invoke<{ blueprint: BackendBlueprint }>("blueprint"),
  blueprintSystem: (system: string) =>
    invoke<{ system: string; data: unknown; placements: BackendPlacement[] }>(`blueprint/${system}`),

  today: (date?: string, supportMode?: SupportMode) =>
    invoke<{ reading: BackendReading; accuracy?: AccuracyReport }>(`today${qs({ date, supportMode })}`),
  insight: (system: string, key: string) =>
    invoke<{ system: string; key: string; body: string; why: string }>(`insight${qs({ system, key })}`),
  synthesis: (theme?: string) => invoke<BackendSynthesis>(`synthesis${qs({ theme })}`),

  askHistory: (conversationId?: string) =>
    invoke<{ conversations?: BackendConversation[]; messages?: BackendMessage[] }>(
      `ask/history${qs({ conversationId })}`,
    ),

  connections: () => invoke<{ connections: BackendConnection[] }>("connections"),
  addConnection: (body: unknown) => invoke<{ connection: BackendConnection }>("connections", { method: "POST", body }),
  compatibility: (id: string, lens: string) =>
    invoke<BackendCompatibility>(`connections/${id}/compatibility${qs({ lens })}`),

  // ── Partner / Bonds ──
  createInvite: (body: unknown) => invoke<InviteResponse>("partner/invite", { method: "POST", body }),
  invitePreview: (code: string) => invoke<InvitePreview>(`partner/invite/${code}`),
  acceptInvite: (code: string) => invoke<{ linkId: string; lens: string }>(`partner/invite/${code}/accept`, { method: "POST" }),
  bonds: () => invoke<{ bonds: BackendBond[] }>("partner/bonds"),
  bondSpace: (linkId: string) => invoke<BackendBondSpace>(`partner/bonds/${linkId}`),
  updateBondPrefs: (linkId: string, body: unknown) => invoke<{ ok: boolean; sharePrefs: Record<string, boolean> }>(`partner/bonds/${linkId}`, { method: "PATCH", body }),
  unlinkBond: (linkId: string) => invoke<{ ok: boolean }>(`partner/bonds/${linkId}`, { method: "DELETE" }),

  drawTarot: (body: unknown) => invoke<{ reading: BackendTarotReading }>("tarot/draw", { method: "POST", body }),
  tarotHistory: () => invoke<{ readings: BackendTarotReading[] }>("tarot"),

  journal: () => invoke<{ entries: BackendJournalEntry[] }>("journal"),
  addJournal: (body: unknown) => invoke<{ entry: BackendJournalEntry }>("journal", { method: "POST", body }),

  rituals: (phase?: string) => invoke<{ rituals: BackendRitual[] }>(`rituals${qs({ phase })}`),

  saved: (kind?: string) => invoke<{ saved: BackendSavedItem[] }>(`saved${qs({ kind })}`),
  addSaved: (body: unknown) => invoke<{ saved: BackendSavedItem }>("saved", { method: "POST", body }),
  removeSaved: (id: string) => invoke<{ ok: boolean }>(`saved/${id}`, { method: "DELETE" }),

  me: () => invoke<BackendMe>("me"),
  patchMe: (body: unknown) =>
    invoke<{ ok: boolean; recompute?: boolean; recomputeQueued?: boolean }>("me", { method: "PATCH", body }),

  // ── Personal pattern memory (user-controlled) ──
  memoryThemes: () => invoke<{ themes: BackendMemoryTheme[] }>("memory-themes"),
  addMemoryTheme: (body: { label: string; description?: string; enabled?: boolean }) =>
    invoke<{ theme: BackendMemoryTheme }>("memory-themes", { method: "POST", body }),
  updateMemoryTheme: (id: string, body: { label?: string; description?: string | null; enabled?: boolean }) =>
    invoke<{ theme: BackendMemoryTheme }>(`memory-themes/${id}`, { method: "PATCH", body }),
  deleteMemoryTheme: (id: string) =>
    invoke<{ ok: boolean }>(`memory-themes/${id}`, { method: "DELETE" }),

  // ── Weekly integration report ──
  weeklyReport: (weekStart?: string) =>
    invoke<{ report: BackendWeeklyReport; cached: boolean }>(`weekly-report${qs({ weekStart })}`),

  // ── Geo (birth-place autocomplete + resolution via Google, server-side) ──
  geoAutocomplete: (q: string) =>
    invoke<{ configured: boolean; suggestions: PlaceSuggestion[] }>(`geo/autocomplete${qs({ q })}`),
  geoResolve: (placeId: string, date: string) =>
    invoke<{ place: ResolvedPlace }>(`geo/resolve${qs({ placeId, date })}`),

  entitlements: () => invoke<BackendEntitlements>("entitlements"),
};

// ─── Ask streaming (SSE via expo/fetch, which supports response.body in RN) ──
export interface StreamHandlers {
  onToken: (token: string) => void;
  /** Explainable evidence chips for the systems this answer drew on. */
  onEvidence?: (evidence: Evidence[]) => void;
  onDone?: (conversationId: string | null) => void;
  onError?: (err: Error) => void;
}

export interface AskOptions {
  conversationId?: string;
  supportMode?: SupportMode;
}

export async function streamAsk(
  message: string,
  options: AskOptions | undefined,
  handlers: StreamHandlers,
): Promise<void> {
  const conversationId = options?.conversationId;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";
    const res = await expoFetch(`${FUNCTIONS_URL}/ask`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ message, conversationId, supportMode: options?.supportMode }),
    });
    if (!res.ok || !res.body) {
      throw new ApiError(res.status, `Ask failed (${res.status})`);
    }
    const convId = res.headers.get("x-conversation-id") ?? conversationId ?? null;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const d = t.slice(5).trim();
        if (d === "[DONE]") {
          handlers.onDone?.(convId);
          return;
        }
        try {
          const j = JSON.parse(d);
          if (j.token) handlers.onToken(j.token);
          else if (j.evidence) handlers.onEvidence?.(j.evidence as Evidence[]);
        } catch {
          // ignore partial/non-JSON frames
        }
      }
    }
    handlers.onDone?.(convId);
  } catch (e) {
    handlers.onError?.(e instanceof Error ? e : new Error(String(e)));
  }
}

// ─── backend response shapes (loose; mapped to UI shapes in lib/hooks.ts) ───
export interface OnboardingResponse {
  summary: BackendSummary;
  needsBirthTime: boolean;
  accuracy?: AccuracyReport;
  bigThree: { sun: string; moon: string; rising: string | null };
  lifePath: number;
  chinese: { animal: string; element: string };
  humanDesign: string | null;
}
export interface BackendSummary {
  sunSign: string; moonSign: string; rising: string | null;
  lifePath: number; expression: number; animal: string; element: string;
  hdType: string | null; hdAuthority: string | null; hdProfile: string | null; timeKnown: boolean;
}
// Honest accuracy: what's exact vs estimated, and how to improve it.
export interface AccuracyReport {
  accuracyLevel: "exact" | "partial" | "approximate" | "blocked";
  missingInputs: string[];
  confidenceNotes: string[];
}
export interface EngineMeta {
  source: "hosted_api" | "verified_library" | "prototype_fallback";
  precision: "high" | "medium" | "low";
  userFacingNote?: string;
}

// ─── product layer: support mode, evidence, shift, notify ───────────
export type SupportMode = "gentle" | "clear" | "motivating" | "reflective" | "practical";

export interface Evidence {
  system: "astrology" | "numerology" | "human_design" | "chinese" | "tarot" | "biorhythm";
  signal: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface SolunaShift {
  reframe: string;
  reset: string;
  braveTinyAction: string;
  journalPrompt: string;
  supportMode?: SupportMode | null;
}

export interface NotifyPayload {
  widgetTitle: string;
  widgetBody: string;
  pushTitle: string;
  pushBody: string;
}

export interface BackendMemoryTheme {
  id: string;
  label: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendWeeklyReport {
  weekStart: string;
  weekEnd: string;
  repeatingThemes: string[];
  systemsThatAgreed: { system: string; count: number }[];
  savedReadings: unknown[];
  journalHighlights: string[];
  carryForward: string;
  shiftForNextWeek: string;
  daysWithReadings: number;
  enoughData: boolean;
  accuracyLevel: AccuracyReport["accuracyLevel"];
  confidenceNotes: string[];
  notify?: NotifyPayload;
}

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

export interface BondRitual {
  supportEachOtherToday: string;
  bestDayForDeepConversation: string;
  possibleMisread: string;
  sharedJournalPrompt: string;
  lens: string;
  evidence: Evidence[];
  confidenceNotes: string[];
}
export interface BackendBlueprint {
  astrology: any; numerology: any; chinese: any; humanDesign: any;
  biorhythmSeed: { birthDate: string }; summary: BackendSummary;
  accuracy?: AccuracyReport;
}
export interface BackendPlacement { system: string; key: string; label: string; detail: any }
export interface BackendReading {
  date: string; hero: string; agreement: any; affirmation: string;
  doEmbraceEase: { do: string; embrace: string; ease: string };
  personalDay: number; chineseDaily: { animal: string; element: string };
  tarotCard: any; cosmicWeather: any;
  // Explainable guidance layer.
  shift?: SolunaShift | null;
  evidence?: Evidence[];
  notify?: NotifyPayload | null;
  supportMode?: SupportMode | null;
}
export interface BackendSynthesis {
  themes?: { id: string; title: string; systemsAgree: number; blocks: any[] }[];
  id?: string; title?: string; systemsAgree?: number; blocks?: any[]; combinedTakeaway?: string;
}
export interface BackendConversation { id: string; title: string | null; created_at: string }
export interface BackendMessage {
  id: string; role: string; content: string; systems_referenced: string[]; created_at: string;
}
export interface BackendConnection {
  id: string; name: string; relationship: string | null; birth_date: string;
  birth_place_label: string | null; blueprint: { summary?: BackendSummary }; created_at: string;
}
export interface BackendCompatibility {
  lens: string; score: number; overall: number; label: string; blendedSummary: string;
  whereYouFlow: string[]; whereYouGrow: string[]; howToSupport: string[]; tip: string;
  astrologyScore: number; numerologyScore: number; chineseScore: number;
  confidence: number;
  evidenceBySystem: { system: string; score: number | null; signal: string }[];
  // Honest, deterministic per-system notes + provenance (backend-computed).
  astrologyNote?: string; numerologyNote?: string; chineseNote?: string; humanDesignNote?: string;
  confidenceNotes?: string[]; sources?: string[];
}
export interface InviteResponse { inviteCode: string; link: string; lens: string; rewardTeaser: string }
export interface InvitePreview { valid: boolean; inviterName?: string; lens?: string; status?: string }
export interface BackendBond { linkId: string; partnerName: string; lens: string; status: string; score: number | null }
export interface BackendBondSpace {
  link: { id: string; lens: string; status: string };
  partner: { name: string };
  sharePrefs: Record<string, boolean>;
  compatibility: BackendCompatibility & { score: number };
  bond: { togetherText: string; flowGrow: { flow: string; grow: string }; sharedWeather: string };
  ritual?: BondRitual;
}
export interface BackendTarotReading {
  id: string; spread: string; cards: any[]; question: string | null;
  interpretation: string; created_at: string;
}
export interface BackendJournalEntry {
  id: string; entry_date: string; title: string | null; prompt: string | null;
  body: string; mood: number | null; transit_context: any; created_at: string;
}
export interface BackendRitual {
  id: string; moon_phase: string; title: string; description: string | null;
  steps: string[]; intention: string | null; active_window: any;
}
export interface BackendSavedItem {
  id: string; kind: string; ref_id: string; payload: any; created_at: string;
}
export interface BackendMe {
  user: { preferred_name: string | null; email: string | null } | null;
  birth: any | null;
  notificationPrefs: any | null;
  entitlement: { entitlement: string; status: string; expiresAt: string | null };
}
export interface BackendEntitlements {
  entitlement: string; status: string; expiresAt: string | null; isPremium: boolean;
  features: { unlimitedAsk: boolean; fullLenses: boolean; extraTarotSpreads: boolean };
}
