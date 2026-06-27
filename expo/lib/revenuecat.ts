/**
 * RevenueCat subscriptions (SDK + RevenueCatUI Paywall + Customer Center).
 *
 * - Configured with the Supabase user id as the RevenueCat app_user_id, so the
 *   billing webhook maps purchases straight back to the Soluna account.
 * - Premium is ALWAYS confirmed by the backend entitlement (getEntitlements);
 *   the client check here is for immediate UX only.
 * - Native-only: the native modules are lazily required so the web bundle never
 *   evaluates them, and every call no-ops safely on web.
 */
import { Platform } from "react-native";
import type { CustomerInfo } from "react-native-purchases";
import { supabase } from "./supabase";

// Public SDK key (publishable — safe in the client). Prefer platform-specific
// keys (appl_… / goog_…) in production; falls back to the shared test key.
const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
    android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
    default: undefined,
  }) ??
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
  "test_mmcZLBWDRvQaAduoydFRbsMNIsV";

// Entitlement identifier from the RevenueCat dashboard. Set this to the exact id
// of "Saluna: Astrology Pro" if it differs from the default.
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? "Saluna: Astrology Pro";

let configuredFor: string | null = null;

type RCModule = typeof import("react-native-purchases");
type RCUIModule = typeof import("react-native-purchases-ui");

function rcModule(): RCModule | null {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only lazy load so web never bundles it
    return require("react-native-purchases");
  } catch {
    return null;
  }
}

function rcUiModule(): RCUIModule | null {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only lazy load so web never bundles it
    return require("react-native-purchases-ui");
  } catch {
    return null;
  }
}

export function isRevenueCatAvailable(): boolean {
  return Platform.OS !== "web" && !!API_KEY;
}

/** The RevenueCatUI module default (for `<RevenueCatUI.Paywall/>`), or null on web. */
export function getRevenueCatUI(): RCUIModule["default"] | null {
  return rcUiModule()?.default ?? null;
}

/** True when the configured entitlement — or any active entitlement — is owned. */
export function hasPremium(info: CustomerInfo): boolean {
  if (info.entitlements.active[ENTITLEMENT_ID]) return true;
  // Single premium tier: any active entitlement counts (resilient to id naming).
  return Object.keys(info.entitlements.active).length > 0;
}

/** Configure + identify with the Supabase user id, and persist the mapping. */
export async function configureRevenueCat(userId: string): Promise<void> {
  const rc = rcModule();
  if (!rc || configuredFor === userId) return;
  try {
    const Purchases = rc.default;
    if (__DEV__) Purchases.setLogLevel(rc.LOG_LEVEL.VERBOSE);
    Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    configuredFor = userId;
    // app_user_id === Supabase uid because we identify with it; record the mapping
    // so the webhook (and support tooling) can resolve it.
    await supabase?.from("revenuecat_user_mappings").upsert(
      { user_id: userId, revenuecat_app_user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  } catch (e) {
    console.warn("RevenueCat configure failed:", e);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  const rc = rcModule();
  if (!rc) return null;
  try {
    return await rc.default.getCustomerInfo();
  } catch (e) {
    console.warn("RevenueCat getCustomerInfo failed:", e);
    return null;
  }
}

/** Client-side premium check (UX only — the backend entitlement is authoritative). */
export async function isPremiumActive(): Promise<boolean> {
  const info = await getCustomerInfo();
  return info ? hasPremium(info) : false;
}

export interface RestoreResult {
  ok: boolean;
  isPremium: boolean;
  error?: string;
}

export async function restorePurchases(): Promise<RestoreResult> {
  const rc = rcModule();
  if (!rc) return { ok: false, isPremium: false, error: "Purchases aren't available on this platform." };
  try {
    const info = await rc.default.restorePurchases();
    return { ok: true, isPremium: hasPremium(info) };
  } catch (e: unknown) {
    return { ok: false, isPremium: false, error: (e as { message?: string })?.message ?? "Restore failed." };
  }
}

/** Present the RevenueCat-hosted paywall. Returns whether the user is now entitled. */
export async function presentPaywall(): Promise<{ purchased: boolean }> {
  const ui = rcUiModule();
  if (!ui) return { purchased: false };
  try {
    const result = await ui.default.presentPaywall();
    return { purchased: result === ui.PAYWALL_RESULT.PURCHASED || result === ui.PAYWALL_RESULT.RESTORED };
  } catch (e) {
    console.warn("RevenueCat presentPaywall failed:", e);
    return { purchased: false };
  }
}

/** Present the RevenueCat Customer Center (manage / cancel / restore / refund). */
export async function presentCustomerCenter(): Promise<void> {
  const ui = rcUiModule();
  if (!ui) return;
  try {
    await ui.default.presentCustomerCenter();
  } catch (e) {
    console.warn("RevenueCat presentCustomerCenter failed:", e);
  }
}
