// Supabase client for React Native. Sessions persist in AsyncStorage and the
// access token auto-refreshes while the app is foregrounded.
import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/api";

// Placeholders keep createClient from throwing when env is unset (mock mode).
// The client is never actually called unless the backend is configured.
const url = SUPABASE_URL || "https://placeholder.supabase.co";
const key = SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Mobile deep links handle auth, not URL query params.
    detectSessionInUrl: false,
  },
});

// Supabase recommends pausing token auto-refresh when the app is backgrounded.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
