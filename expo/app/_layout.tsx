import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useAppState } from "@/state/useAppState";
import { AuthProvider, useAuth } from "@/state/useAuth";
import { api } from "@/lib/apiClient";
import { backendBlueprintToUserData } from "@/lib/mappers";
import { useRealtimeSync } from "@/lib/realtime";
import { useRegisterPush } from "@/lib/push";
import { configurePurchases } from "@/lib/purchases";
import { takePendingInvite } from "@/lib/pendingInvite";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Auth + blueprint gate. No-op in mock mode (the app behaves exactly as before).
// When the backend is live: unauthenticated -> /auth; authenticated without a
// blueprint -> /onboarding; otherwise hydrate the blueprint into app state and
// land on the tabs.
function AuthGate() {
  const { authActive, isAuthenticated, loading } = useAuth();
  const { hasOnboarded, completeOnboarding } = useAppState();
  const segments = useSegments();
  const router = useRouter();
  const [bootstrapped, setBootstrapped] = useState(!authActive);

  useEffect(() => {
    if (!authActive || loading) return;
    if (!isAuthenticated || hasOnboarded) {
      setBootstrapped(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { blueprint } = await api.blueprint();
        const me = await api.me().catch(() => null);
        const birth = me?.birth ?? {};
        if (!cancelled) {
          completeOnboarding(
            backendBlueprintToUserData(blueprint, {
              preferredName: me?.user?.preferred_name ?? "friend",
              birthDate: birth.birth_date ?? blueprint.biorhythmSeed?.birthDate ?? "",
              birthTime: birth.birth_time ?? "",
              birthTimeKnown: !!birth.time_known,
              birthPlace: birth.birth_place_label ?? "",
            }),
          );
        }
      } catch {
        // No blueprint yet (409) — the onboarding flow will create one.
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authActive, loading, isAuthenticated, hasOnboarded, completeOnboarding]);

  useEffect(() => {
    if (!authActive || loading || !bootstrapped) return;
    const top = segments[0];
    const inAuth = top === "auth";
    const onInvite = top === "invite";
    // Resume a deep-linked invite once the user is signed in + set up.
    if (isAuthenticated && hasOnboarded && !onInvite) {
      const pending = takePendingInvite();
      if (pending) {
        router.replace(`/invite/${pending}`);
        return;
      }
    }
    if (!isAuthenticated && !inAuth && !onInvite) {
      router.replace("/auth");
    } else if (isAuthenticated && inAuth) {
      router.replace(hasOnboarded ? "/(tabs)" : "/onboarding");
    }
  }, [authActive, loading, bootstrapped, isAuthenticated, hasOnboarded, segments, router]);

  return null;
}

// Wires realtime sync, push registration, and RevenueCat once authenticated.
function BackendEffects() {
  const { authActive, isAuthenticated, user } = useAuth();
  useRealtimeSync();
  useRegisterPush();
  useEffect(() => {
    if (authActive && isAuthenticated && user) configurePurchases(user.id);
  }, [authActive, isAuthenticated, user]);
  return null;
}

function RootNavigator() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthGate />
      <BackendEffects />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ animation: "fade" }} />
        <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal", animation: "fade" }} />
        <Stack.Screen name="invite/[code]" options={{ presentation: "fullScreenModal", animation: "fade" }} />
        <Stack.Screen name="bond-space" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="placement-detail" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="transit-detail" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="compatibility-detail" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="insight-detail" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="synthesis-detail" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="tarot" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="rituals" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="journal" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="saved" options={{ presentation: "card", animation: "slide_from_right" }} />
        <Stack.Screen name="paywall" options={{ presentation: "modal", animation: "fade" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
