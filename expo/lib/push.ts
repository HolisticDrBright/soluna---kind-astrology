/**
 * Expo push registration. Requests permission, gets the Expo push token, and
 * hands it back so the caller can persist it to `push_tokens` via PATCH /me.
 * Native-only: no-ops on web.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export function setNotificationHandler(): void {
  if (Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export interface PushRegistration {
  token: string | null;
  platform: "ios" | "android";
  error?: string;
}

export async function registerForPushNotifications(): Promise<PushRegistration> {
  const platform: "ios" | "android" = Platform.OS === "android" ? "android" : "ios";
  if (Platform.OS === "web") {
    return { token: null, platform, error: "Push notifications aren't available on web." };
  }
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") {
      return { token: null, platform, error: "Notifications permission was not granted." };
    }

    const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
    const projectId = extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return { token: tokenResponse.data, platform };
  } catch (e) {
    return { token: null, platform, error: e instanceof Error ? e.message : "Could not register for notifications." };
  }
}
