import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component } from "react";
import { View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/state/useAppState";
import SolunaColors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="onboarding"
              options={{
                presentation: "fullScreenModal",
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="placement-detail"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="transit-detail"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="compatibility-detail"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="insight-detail"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="synthesis-detail"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="tarot"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="rituals"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="journal"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="paywall"
              options={{
                presentation: "modal",
                animation: "fade",
              }}
            />
  </Stack>
  );
}

// ─── Global Error Boundary ───────────────────────────────────
class GlobalErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string; errorStack: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: "", errorStack: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMsg: error?.message ?? String(error),
      errorStack: error?.stack ?? "",
    };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={geS.wrap}>
          <Text style={geS.title}>App Error</Text>
          <Text style={geS.msg}>{this.state.errorMsg}</Text>
          <Text style={geS.stack} numberOfLines={20}>{this.state.errorStack}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
const geS = StyleSheet.create({
  wrap: {
    flex: 1, backgroundColor: SolunaColors.deepIndigo,
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  title: { fontSize: 22, fontWeight: "700", color: SolunaColors.warmGold, marginBottom: 16 },
  msg: { fontSize: 15, color: SolunaColors.cream, textAlign: "center", marginBottom: 12, lineHeight: 22 },
  stack: { fontSize: 10, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 15, fontFamily: "monospace" },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="light" />
          <GlobalErrorBoundary>
            <RootStack />
          </GlobalErrorBoundary>
        </GestureHandlerRootView>
      </AppProvider>
    </QueryClientProvider>
  );
}
