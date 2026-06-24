// RevenueCat wrapper. All calls are guarded so the app runs in Expo Go / mock
// mode (in-app purchases require a development build). Configure once with the
// Supabase user id as appUserID so the webhook maps purchases to the user.
import Purchases, { type PurchasesOffering, type PurchasesPackage } from "react-native-purchases";
import { REVENUECAT_KEY } from "@/config/api";

let configured = false;

export function configurePurchases(appUserId?: string): void {
  if (configured || !REVENUECAT_KEY) return;
  try {
    Purchases.configure({ apiKey: REVENUECAT_KEY, appUserID: appUserId });
    configured = true;
  } catch {
    // native module unavailable (Expo Go) — purchases simply won't work here
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    return (await Purchases.getOfferings()).current ?? null;
  } catch {
    return null;
  }
}

export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (e) {
    // user cancelled or native unavailable
    return false;
  }
}

export async function restore(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return Object.keys(info.entitlements.active).length > 0;
  } catch {
    return false;
  }
}

export type { PurchasesOffering, PurchasesPackage };
