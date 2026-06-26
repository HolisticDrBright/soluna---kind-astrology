import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/state/useAppState";
import React from "react";
import { initSentry, wrapRoot } from "@/lib/sentry";
import { setNotificationHandler } from "@/lib/push";

// Initialize crash monitoring + notification presentation as early as possible.
// Both no-op safely when their keys / platform aren't available.
initSentry();
setNotificationHandler();

const queryClient = new QueryClient();

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </QueryClientProvider>
  );
}

export default wrapRoot(RootLayout);
