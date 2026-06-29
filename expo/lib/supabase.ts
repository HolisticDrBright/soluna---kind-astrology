/**
 * Supabase client for Soluna — native Supabase Auth mode.
 * Uses AsyncStorage for session persistence.
 *
 * Production safety: we NEVER fabricate a working-looking client in a live build.
 * A placeholder client is created ONLY in explicit demo/dev mode (where the app
 * runs on bundled sample data and never touches the network). In live mode
 * without real credentials, `supabase` is `null` and every caller fails through a
 * clear, user-safe error path instead of silently hitting a fake endpoint.
 *
 * Only the public anon key ever lives here (it is safe in the client). The
 * service-role key and any private provider keys are backend-only secrets and
 * must never be exposed through `EXPO_PUBLIC_*` env vars.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "./config";

const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

// Demo/dev mode (sample data, no real backend) is the ONLY place a placeholder
// client is acceptable.
const isDemoMode = config.demoMode;

/** True only when real Supabase credentials are present. */
export const supabaseConfigured = config.supabaseConfigured;

/** User-safe message for when there is no backend to talk to. */
export const NO_BACKEND_ERROR =
  "Soluna isn't connected right now. Please try again in a little while.";

if (!supabaseConfigured && !isDemoMode) {
  // A live build with no Supabase credentials is a deployment misconfiguration.
  // Fail loudly in logs; the UI surfaces a user-safe "can't connect" path.
  console.error(
    "[Soluna] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "The app will not connect to a backend until they are configured.",
  );
}

const authOptions = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
} as const;

/**
 * The Supabase client, or `null` when running live without configured
 * credentials. Callers must treat `null` as "backend unavailable" and surface
 * {@link NO_BACKEND_ERROR} rather than assuming a client exists.
 */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, authOptions)
  : isDemoMode
    ? // Inert placeholder for demo/dev only — never used for real network calls.
      createClient("https://demo.placeholder.supabase.co", "demo-anon-key", authOptions)
    : null;

/** Max time any single Edge Function call may take before we give up. Without
 *  this a hung or very slow backend freezes the UI forever — e.g. the onboarding
 *  "weaving" screen. Every caller handles the { error } shape, so a timeout just
 *  becomes a normal, retryable error instead of an endless spinner. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Invoke a Soluna Edge Function by name.
 * Automatically attaches the auth token from the current session.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>,
  method?: "GET" | "POST" | "PATCH" | "DELETE",
): Promise<{ data: T | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: NO_BACKEND_ERROR };
  }

  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  // Abort if the request outlives REQUEST_TIMEOUT_MS so the UI can never hang
  // forever. AbortController + setTimeout is used (not AbortSignal.timeout) for
  // broad React Native compatibility.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: method ?? (body ? "POST" : "GET"),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      },
    );

    const json = await resp.json();
    if (!resp.ok) {
      return { data: null, error: json.error ?? `HTTP ${resp.status}` };
    }
    return { data: json as T, error: null };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { data: null, error: "This is taking longer than usual. Please check your connection and try again." };
    }
    return { data: null, error: err instanceof Error ? err.message : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}
