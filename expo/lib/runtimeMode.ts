// ─── Runtime mode: the single source of truth for demo vs. live ──────────────
//
// Soluna has exactly two modes (both derived from `config`):
//
//   • DEMO mode  (EXPO_PUBLIC_ENABLE_DEMO_MODE=true, or legacy
//     EXPO_PUBLIC_USE_MOCK_DATA=true)
//       For screenshots, local testing, and App Store preview. It MAY render
//       beautiful, fully-populated, *fake* sample content (Maya's chart, demo
//       connections, sample journal entries, etc.).
//
//   • LIVE mode  (anything else — the production default)
//       The commercial app. It must NEVER render fake user-specific data. When
//       real backend data is missing it shows honest states instead: "finish
//       birth details", "not available yet", "we're still calculating this",
//       loading / empty / error / retry.
//
// Every demo-data access in the app must be gated through this module so fake
// content is impossible to ship in a production build.

import { config } from "./config";

/** True only when the build is explicitly running in demo/dev mode. */
export const isDemoMode: boolean = config.demoMode;

/** True for real production/live mode (the inverse of demo mode). */
export const isLiveMode: boolean = config.liveMode;

/**
 * Returns `demoValue` ONLY in demo mode; in live mode returns `liveFallback`.
 * This makes it impossible for fake content to leak into production: the live
 * branch never even references the demo value at runtime.
 *
 *   const entries = demoOnly(JOURNAL_ENTRIES, []);
 *   const history = demoOnly([...MOCK_CHAT_HISTORY], []);
 */
export function demoOnly<T>(demoValue: T, liveFallback: T): T {
  return isDemoMode ? demoValue : liveFallback;
}

/**
 * Dev-time guard for any code path that intentionally reads demo content.
 * In demo mode it's a no-op. In live mode it throws during development
 * (so the mistake is caught before shipping) and logs in a production binary
 * (fail-safe — never crash a real user's app).
 */
export function assertNoDemoDataInProduction(context: string): void {
  if (isDemoMode) return;
  const message =
    `[Soluna] Demo data was accessed in LIVE mode: ${context}. ` +
    `Live mode must use real backend data or an honest empty state, never fake content.`;
  // __DEV__ is injected by the React Native / Expo runtime.
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    throw new Error(message);
  }
  console.error(message);
}
