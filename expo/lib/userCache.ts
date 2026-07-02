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

const CACHE_KEY = "soluna.cache.user.v2";

/** Last-known user, or null if nothing cached / cache unreadable. The cache is
 *  keyed to the auth uid that wrote it: on a shared device, account B must
 *  NEVER see account A's name, birth data, or chart restored from cache. */
export async function loadCachedUser(expectedUid?: string | null): Promise<UserData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { uid?: string | null; user?: UserData } | UserData;
    if (parsed && typeof parsed === "object" && "user" in parsed) {
      const wrapped = parsed as { uid?: string | null; user?: UserData };
      if (!wrapped.user) return null;
      if (expectedUid && wrapped.uid !== expectedUid) return null;
      return wrapped.user;
    }
    // Legacy v1 payload (no uid) — untrusted across accounts; ignore it.
    return null;
  } catch {
    return null;
  }
}

/** Persist the user for this uid (or clear when passed null). Never throws. */
export async function saveCachedUser(user: UserData | null, uid?: string | null): Promise<void> {
  try {
    if (user) await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ uid: uid ?? null, user }));
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
