// Push registration. Requests permission, gets the Expo push token, and sends
// it to the backend via PATCH /me. Safe in Expo Go (it simply no-ops if the
// token can't be obtained — real tokens require a development build).
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/state/useAuth";

export function useRegisterPush(): void {
  const { authActive, isAuthenticated } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (!authActive || !isAuthenticated || done.current) return;
    done.current = true;
    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== "granted") {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== "granted") return;
        const tokenResp = await Notifications.getExpoPushTokenAsync();
        const token = tokenResp.data;
        if (token) {
          await api.patchMe({ pushToken: token, pushPlatform: Platform.OS });
        }
      } catch {
        // Expo Go / simulator without a projectId — skip silently.
      }
    })();
  }, [authActive, isAuthenticated]);
}
