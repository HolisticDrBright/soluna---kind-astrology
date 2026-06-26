/**
 * RevenueCat subscriptions. The SDK is configured with the Supabase user id as
 * the RevenueCat app_user_id, so the billing webhook can map purchases straight
 * back to the Soluna account. Premium is ALWAYS confirmed by the backend
 * entitlement (getEntitlements); customerInfo here is only for immediate UX.
 *
 * Native-only: the native module is lazily required so the web bundle never
 * evaluates it, and every call no-ops safely on web / when the key is missing.
 */
import { Platform } from "react-native";
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import { supabase } from "./supabase";

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "";
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? "premium";

let configuredFor: string | null = null;

type PurchasesModule = typeof import("react-native-purchases").default;

function getPurchases(): PurchasesModule | null {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only lazy load so web never bundles it
    return require("react-native-purchases").default as PurchasesModule;
  } catch {
    return null;
  }
}

export function isRevenueCatAvailable(): boolean {
  return Platform.OS !== "web" && !!API_KEY;
}

function hasPremium(info: CustomerInfo): boolean {
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

/** Configure + identify with the Supabase user id, and persist the mapping. */
export async function configureRevenueCat(userId: string): Promise<void> {
  const Purchases = getPurchases();
  if (!Purchases || !API_KEY || configuredFor === userId) return;
  try {
    Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    configuredFor = userId;
    // app_user_id === Supabase uid because we identify with it; record the mapping
    // so the webhook (and support tooling) can resolve it.
    await supabase.from("revenuecat_user_mappings").upsert(
      { user_id: userId, revenuecat_app_user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  } catch (e) {
    console.warn("RevenueCat configure failed:", e);
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const Purchases = getPurchases();
  if (!Purchases || !API_KEY) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn("RevenueCat getOfferings failed:", e);
    return null;
  }
}

export interface PurchaseResult {
  ok: boolean;
  isPremium: boolean;
  userCancelled?: boolean;
  error?: string;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  const Purchases = getPurchases();
  if (!Purchases || !API_KEY) {
    return { ok: false, isPremium: false, error: "Purchases aren't available on this platform." };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, isPremium: hasPremium(customerInfo) };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) return { ok: false, isPremium: false, userCancelled: true };
    return { ok: false, isPremium: false, error: err?.message ?? "Purchase failed." };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  const Purchases = getPurchases();
  if (!Purchases || !API_KEY) {
    return { ok: false, isPremium: false, error: "Purchases aren't available on this platform." };
  }
  try {
    const info = await Purchases.restorePurchases();
    return { ok: true, isPremium: hasPremium(info) };
  } catch (e: unknown) {
    return { ok: false, isPremium: false, error: (e as { message?: string })?.message ?? "Restore failed." };
  }
}
