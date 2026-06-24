import { useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import type { UserData, OnboardingStep, ChartData, Placement } from "@/constants/mockData";
import { MOCK_USER } from "@/constants/mockData";

export interface AppState {
  hasOnboarded: boolean;
  user: UserData | null;
  onboardingStep: OnboardingStep;
}

const [AppProvider, useAppStateRaw] = createContextHook(() => {
  const [state, setState] = useState<AppState>({
    hasOnboarded: false,
    user: null,
    onboardingStep: "welcome",
  });

  const setOnboardingStep = useCallback((step: OnboardingStep) => {
    setState((s) => ({ ...s, onboardingStep: step }));
  }, []);

  const completeOnboarding = useCallback((userData: UserData) => {
    setState({ hasOnboarded: true, user: userData, onboardingStep: "reveal" });
  }, []);

  const updateUser = useCallback((updates: Partial<UserData>) => {
    setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, ...updates } : null,
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState({ hasOnboarded: false, user: null, onboardingStep: "welcome" });
  }, []);

  // Convenience: get a placement by planet
  const getPlacement = useCallback(
    (planet: string): Placement | null => {
      if (!state.user?.chart) return null;
      return (
        state.user.chart.placements.find((p) => p.planet === planet) ?? null
      );
    },
    [state.user],
  );

  return {
    ...state,
    setOnboardingStep,
    completeOnboarding,
    updateUser,
    resetOnboarding,
    getPlacement,
  };
});

function useAppState(): ReturnType<typeof useAppStateRaw> {
  return useAppStateRaw();
}

export { AppProvider, useAppState };
