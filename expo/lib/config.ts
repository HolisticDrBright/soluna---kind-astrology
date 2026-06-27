/**
 * Central runtime configuration — the single source of truth for env-driven
 * behaviour in the Soluna client.
 *
 * Only `EXPO_PUBLIC_*` values exist in the app bundle; Expo/Metro inlines them at
 * build time. NOTHING secret belongs here. Service-role keys, model/provider API
 * keys, and the RevenueCat *secret* REST key are backend-only (Supabase Edge
 * Function secrets) and must never appear in `EXPO_PUBLIC_*` or in this file.
 *
 * Production posture (the default when the flags are unset/false):
 *   • real Supabase auth + real user data, real empty states
 *   • no demo user, no canned readings, no test billing key
 * Demo/sample content is reachable ONLY when `EXPO_PUBLIC_ENABLE_DEMO_MODE=true`
 * (or the legacy `EXPO_PUBLIC_USE_MOCK_DATA=true`).
 */

/** Parse a boolean-ish env flag. Anything other than "true"/"1" is false. */
function flag(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

// ─── Supabase (publishable) ──────────────────────────────────────────────────
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ─── Mode flags ──────────────────────────────────────────────────────────────
// Canonical demo switch is EXPO_PUBLIC_ENABLE_DEMO_MODE. The older
// EXPO_PUBLIC_USE_MOCK_DATA is still honoured for back-compat. Production /
// TestFlight / App Store builds MUST leave both unset or false.
const demoMode =
  flag(process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE) ||
  flag(process.env.EXPO_PUBLIC_USE_MOCK_DATA);

// Canned readings (daily / tarot / chat sample content). Only meaningful in demo
// mode; never renders in production.
const enableMockReadings = flag(process.env.EXPO_PUBLIC_ENABLE_MOCK_READINGS);

// Allow the shared RevenueCat *test* key when no real key is configured. OFF in
// production: a missing key then shows an honest "billing unavailable" state
// instead of silently running against a sandbox key.
const enableBillingFallback = flag(process.env.EXPO_PUBLIC_ENABLE_BILLING_FALLBACK);

// ─── RevenueCat (publishable keys only) ──────────────────────────────────────
// New canonical names first, legacy names as fallback.
const revenueCat = {
  iosKey:
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ??
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ??
    "",
  androidKey:
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ??
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ??
    "",
  sharedKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "",
  entitlement: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? "premium",
};

const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "support@soluna.app";

export const config = {
  /** Supabase project URL (publishable). */
  supabaseUrl,
  /** Supabase anon/publishable key. */
  supabaseAnonKey,
  /** True only when both Supabase values are present. */
  supabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  /** True only in explicit demo/dev mode. */
  demoMode,
  /** True for real production/live mode (the inverse of demoMode). */
  liveMode: !demoMode,
  /** Whether canned sample readings may render (demo only). */
  enableMockReadings,
  /** Whether the RevenueCat test key may be used when no real key is set. */
  enableBillingFallback,
  /** RevenueCat publishable keys + entitlement id. */
  revenueCat,
  /** Support / data-request email shown in the app. */
  supportEmail,
} as const;

export type AppConfig = typeof config;
