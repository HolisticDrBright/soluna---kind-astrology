/**
 * Supabase client for Soluna — native Supabase Auth mode.
 * Uses AsyncStorage for session persistence.
 */
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables not set — API calls will fail.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/**
 * Invoke a Soluna Edge Function by name.
 * Automatically attaches the auth token from the current session.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>,
  method?: "GET" | "POST" | "PATCH" | "DELETE",
): Promise<{ data: T | null; error: string | null }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      data: null,
      error: "Supabase environment variables are not configured",
    };
  }

  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

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
      },
    );

    const json = await resp.json();
    if (!resp.ok) {
      return { data: null, error: json.error ?? `HTTP ${resp.status}` };
    }
    return { data: json as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Network error" };
  }
}
