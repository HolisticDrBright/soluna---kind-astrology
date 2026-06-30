/**
 * Local cache of the signed-in user's OWN real data, so the app can open straight
 * to the dashboard on relaunch — even before the backend responds, or when a
 * cold-start `/me` call fails (a slow or rate-limited backend should never bounce
 * a returning, already-onboarded user back through onboarding).
 *
 * This stores the user's REAL profile/blueprint only. It is never written in demo
 * mode and never contains another (demo) user's chart, so it does not violate the
 * "no demo data in live" invariant. Best-effort: any storage error degrades to
 * "no cache" rather than throwing into the auth flow.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserData } from "@/constants/mockData";

const CACHE_KEY = "soluna.cache.user.v1";

/** Last-known user, or null if nothing cached / cache unreadable. */
export async function loadCachedUser(): Promise<UserData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
}

/** Persist the user (or clear the cache when passed null). Never throws. */
export async function saveCachedUser(user: UserData | null): Promise<void> {
  try {
    if (user) await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // Best-effort cache — ignore storage failures.
  }
}

/** Remove the cached user (on sign-out / onboarding reset). Never throws. */
export async function clearCachedUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
