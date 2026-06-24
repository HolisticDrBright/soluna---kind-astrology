// Backend configuration. No hardcoded URLs/keys — everything comes from
// EXPO_PUBLIC_* env vars (inlined by the Expo bundler; see .env.example).

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Edge Functions base. Defaults to "<project>.functions.supabase.co" derived
// from SUPABASE_URL, overridable via EXPO_PUBLIC_FUNCTIONS_URL (e.g. local dev:
// http://127.0.0.1:54321/functions/v1).
export const FUNCTIONS_URL = process.env.EXPO_PUBLIC_FUNCTIONS_URL ??
  (SUPABASE_URL ? `${SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co")}` : "");

export const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? "";

/** True when the backend is configured enough to talk to. */
export const BACKEND_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
