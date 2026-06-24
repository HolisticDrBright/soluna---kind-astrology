/**
 * Zod-like validation schemas (hand-written for Deno compatibility).
 * Validates input to Edge Functions. Simple but effective.
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Birth Profile ───────────────────────────────────────────

export interface BirthProfileInput {
  full_birth_name: string;
  preferred_name?: string;
  birth_date: string; // ISO date
  birth_time?: string | null; // HH:MM or null
  time_known: boolean;
  birth_place_label?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  house_system?: "placidus" | "whole_sign" | "porphyry";
}

export function validateBirthProfile(input: unknown): ValidationResult<BirthProfileInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }
  const b = input as Record<string, unknown>;

  if (!b.full_birth_name || typeof b.full_birth_name !== "string") {
    return { success: false, error: "full_birth_name is required" };
  }
  if (!b.birth_date || typeof b.birth_date !== "string") {
    return { success: false, error: "birth_date is required" };
  }
  // Validate ISO date
  if (isNaN(Date.parse(b.birth_date))) {
    return { success: false, error: "birth_date must be a valid date (YYYY-MM-DD)" };
  }

  const timeKnown = b.time_known !== false;

  return {
    success: true,
    data: {
      full_birth_name: b.full_birth_name as string,
      preferred_name: b.preferred_name as string | undefined,
      birth_date: b.birth_date as string,
      birth_time: b.birth_time as string | null | undefined,
      time_known: timeKnown,
      birth_place_label: b.birth_place_label as string | undefined,
      lat: b.lat as number | undefined,
      lng: b.lng as number | undefined,
      timezone: b.timezone as string | undefined,
      house_system: b.house_system as "placidus" | "whole_sign" | "porphyry" | undefined,
    },
  };
}

// ─── Ask Message ─────────────────────────────────────────────

export interface AskMessageInput {
  conversation_id?: string; // optional — create new if missing
  message: string;
}

export function validateAskMessage(input: unknown): ValidationResult<AskMessageInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }
  const m = input as Record<string, unknown>;

  if (!m.message || typeof m.message !== "string" || m.message.trim().length === 0) {
    return { success: false, error: "message is required" };
  }
  if ((m.message as string).length > 2000) {
    return { success: false, error: "message must be under 2000 characters" };
  }

  return {
    success: true,
    data: {
      conversation_id: m.conversation_id as string | undefined,
      message: m.message as string,
    },
  };
}

// ─── Tarot Draw ──────────────────────────────────────────────

export interface TarotDrawInput {
  spread?: "daily" | "three_card" | "celtic_cross";
  question?: string;
}

export function validateTarotDraw(input: unknown): ValidationResult<TarotDrawInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }
  const t = input as Record<string, unknown>;

  const spread = (t.spread as string) || "daily";
  if (!["daily", "three_card", "celtic_cross"].includes(spread)) {
    return { success: false, error: "Invalid spread type" };
  }

  return {
    success: true,
    data: {
      spread: spread as "daily" | "three_card" | "celtic_cross",
      question: t.question as string | undefined,
    },
  };
}

// ─── Connection ──────────────────────────────────────────────

export interface ConnectionInput {
  name: string;
  birth_date: string;
  birth_time?: string | null;
  birth_place_label?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  lens?: "romance" | "friendship" | "work" | "family";
}

export function validateConnection(input: unknown): ValidationResult<ConnectionInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }
  const c = input as Record<string, unknown>;

  if (!c.name || typeof c.name !== "string") {
    return { success: false, error: "name is required" };
  }
  if (!c.birth_date || typeof c.birth_date !== "string" || isNaN(Date.parse(c.birth_date))) {
    return { success: false, error: "birth_date must be a valid date" };
  }
  const lens = (c.lens as string) || "romance";
  if (!["romance", "friendship", "work", "family"].includes(lens)) {
    return { success: false, error: "Invalid lens" };
  }

  return {
    success: true,
    data: {
      name: c.name as string,
      birth_date: c.birth_date as string,
      birth_time: c.birth_time as string | null | undefined,
      birth_place_label: c.birth_place_label as string | undefined,
      lat: c.lat as number | undefined,
      lng: c.lng as number | undefined,
      timezone: c.timezone as string | undefined,
      lens: lens as "romance" | "friendship" | "work" | "family",
    },
  };
}

// ─── Journal Entry ───────────────────────────────────────────

export interface JournalEntryInput {
  entry_date?: string;
  body: string;
  mood?: number;
  prompt?: string;
}

export function validateJournalEntry(input: unknown): ValidationResult<JournalEntryInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }
  const j = input as Record<string, unknown>;

  if (!j.body || typeof j.body !== "string" || j.body.trim().length === 0) {
    return { success: false, error: "body is required" };
  }
  const mood = j.mood as number | undefined;
  if (mood !== undefined && (mood < 1 || mood > 5)) {
    return { success: false, error: "mood must be 1-5" };
  }

  return {
    success: true,
    data: {
      entry_date: j.entry_date as string | undefined,
      body: j.body as string,
      mood,
      prompt: j.prompt as string | undefined,
    },
  };
}

// ─── Partner Invite ──────────────────────────────────────────

export interface PartnerInviteInput {
  lens?: "romance" | "friendship" | "work" | "family";
  invitee_email?: string;
}

export function validatePartnerInvite(input: unknown): ValidationResult<PartnerInviteInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }
  const p = input as Record<string, unknown>;
  const lens = (p.lens as string) || "romance";
  if (!["romance", "friendship", "work", "family"].includes(lens)) {
    return { success: false, error: "Invalid lens" };
  }

  return {
    success: true,
    data: {
      lens: lens as "romance" | "friendship" | "work" | "family",
      invitee_email: p.invitee_email as string | undefined,
    },
  };
}

// ─── Me Update ───────────────────────────────────────────────

export interface MeUpdateInput {
  preferred_name?: string;
  birth_profile?: BirthProfileInput;
  notification_prefs?: {
    daily_time?: string;
    tz?: string;
    daily_reading?: boolean;
    personal_day?: boolean;
    moon_alerts?: boolean;
    transit_alerts?: boolean;
  };
  push_token?: {
    expo_token: string;
    platform?: "ios" | "android";
  };
}

export function validateMeUpdate(input: unknown): ValidationResult<MeUpdateInput> {
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }
  // MeUpdate is permissive — partial updates allowed
  return { success: true, data: input as MeUpdateInput };
}
