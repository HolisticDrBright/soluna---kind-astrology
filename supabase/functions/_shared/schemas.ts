// Zod schemas for request validation. Shared across Edge Functions.
import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const timeStr = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Expected HH:MM");

export const houseSystem = z.enum(["placidus", "whole-sign", "porphyry"]).default("placidus");

/** Shared birth-data block (onboarding + connections). */
export const birthBlock = z.object({
  birthDate: dateStr,
  birthTime: timeStr.nullable().optional(),
  timeKnown: z.boolean().optional(),
  birthPlaceLabel: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(100).optional(),
});

export const onboardingBlueprintInput = birthBlock.extend({
  fullBirthName: z.string().min(1).max(200),
  preferredName: z.string().min(1).max(100),
  houseSystem: houseSystem.optional(),
});
export type OnboardingBlueprintInput = z.infer<typeof onboardingBlueprintInput>;

export const supportModeSchema = z.enum([
  "gentle",
  "clear",
  "motivating",
  "reflective",
  "practical",
]);

export const askInput = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  supportMode: supportModeSchema.optional(),
  /** When set, the chat may reference this active Focus (must belong to the user). */
  focusId: z.string().uuid().optional(),
});
export type AskInput = z.infer<typeof askInput>;

export const memoryThemeCreateInput = z.object({
  label: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  enabled: z.boolean().optional(),
});
export type MemoryThemeCreateInput = z.infer<typeof memoryThemeCreateInput>;

export const memoryThemePatchInput = z.object({
  label: z.string().min(1).max(80).optional(),
  description: z.string().max(400).nullable().optional(),
  enabled: z.boolean().optional(),
});
export type MemoryThemePatchInput = z.infer<typeof memoryThemePatchInput>;

// ─── Soluna Focus ──────────────────────────────────────────────────
export const focusCategorySchema = z.enum([
  "relationship", "work", "school", "big_decision", "family", "friendship",
  "money", "self_worth", "creativity", "spiritual_growth", "personal",
]);
export type FocusCategory = z.infer<typeof focusCategorySchema>;

export const focusStatusSchema = z.enum(["active", "paused", "resolved", "archived"]);

// Privacy-first: every context source is opt-in (defaults to false when omitted).
export const allowedContextSchema = z.object({
  recentJournalThemes: z.boolean().optional(),
  savedReadings: z.boolean().optional(),
  currentMood: z.boolean().optional(),
  memoryThemes: z.boolean().optional(),
  recentAskHistory: z.boolean().optional(),
  selectedBondDynamics: z.boolean().optional(),
});
export type AllowedContextInput = z.infer<typeof allowedContextSchema>;

export const focusCreateInput = z.object({
  category: focusCategorySchema,
  title: z.string().max(160).optional(),
  problemText: z.string().min(1, "Tell Soluna what you're navigating.").max(3000),
  supportMode: supportModeSchema.default("gentle"),
  selectedConnectionId: z.string().uuid().optional(),
  selectedBondId: z.string().uuid().optional(),
  allowedContext: allowedContextSchema.default({}),
});
export type FocusCreateInput = z.infer<typeof focusCreateInput>;

export const focusPatchInput = z.object({
  title: z.string().max(160).optional(),
  status: focusStatusSchema.optional(),
  supportMode: supportModeSchema.optional(),
  allowedContext: allowedContextSchema.optional(),
  selectedConnectionId: z.string().uuid().nullable().optional(),
  selectedBondId: z.string().uuid().nullable().optional(),
});
export type FocusPatchInput = z.infer<typeof focusPatchInput>;

export const focusCheckinInput = z.object({
  checkinStatus: z.enum([
    "better", "still_unclear", "harder_than_expected", "took_the_step", "not_yet",
  ]),
  checkinText: z.string().max(2000).optional(),
});
export type FocusCheckinInput = z.infer<typeof focusCheckinInput>;

export const tarotDrawInput = z.object({
  spread: z.enum(["daily", "three-card", "celtic-cross"]),
  question: z.string().max(500).optional(),
});
export type TarotDrawInput = z.infer<typeof tarotDrawInput>;

export const connectionInput = birthBlock.extend({
  name: z.string().min(1).max(120),
  relationship: z.string().max(60).optional(),
});
export type ConnectionInput = z.infer<typeof connectionInput>;

export const lensSchema = z.enum(["romance", "friendship", "work", "family"]);

export const partnerInviteInput = z.object({
  lens: lensSchema.default("romance"),
  inviteeEmail: z.string().email().max(200).optional(),
});
export type PartnerInviteInput = z.infer<typeof partnerInviteInput>;

export const sharePrefsInput = z.object({
  shareSun: z.boolean().optional(),
  shareMoon: z.boolean().optional(),
  shareNumbers: z.boolean().optional(),
  shareChinese: z.boolean().optional(),
  shareHumanDesign: z.boolean().optional(),
});
export type SharePrefsInput = z.infer<typeof sharePrefsInput>;

export const journalInput = z.object({
  entryDate: dateStr.optional(),
  title: z.string().max(200).optional(),
  prompt: z.string().max(1000).optional(),
  body: z.string().min(1).max(20000),
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
  sourceRef: z.string().max(200).optional(),
});
export type JournalInput = z.infer<typeof journalInput>;

export const savedInput = z.object({
  kind: z.enum(["reading", "insight", "tarot", "ritual", "transit", "placement"]),
  refId: z.string().min(1).max(200),
  payload: z.record(z.unknown()).optional(),
});
export type SavedInput = z.infer<typeof savedInput>;

export const notificationPrefsInput = z.object({
  dailyTime: timeStr.optional(),
  tz: z.string().max(100).optional(),
  dailyReading: z.boolean().optional(),
  personalDay: z.boolean().optional(),
  moonAlerts: z.boolean().optional(),
  transitAlerts: z.boolean().optional(),
});

export const mePatchInput = z.object({
  preferredName: z.string().min(1).max(100).optional(),
  pushToken: z.string().max(300).optional(),
  pushPlatform: z.string().max(20).optional(),
  notificationPrefs: notificationPrefsInput.optional(),
  birth: onboardingBlueprintInput.partial().optional(),
});
export type MePatchInput = z.infer<typeof mePatchInput>;

export { z };
