import { useState, useCallback, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import type { Session, User } from "@supabase/supabase-js";
import type {
  BaziView,
  ChartData,
  ChineseAstrologyData,
  HumanDesignData,
  NumerologyData,
  OnboardingStep,
  Placement,
  Planet,
  UserData,
  ZodiacSign,
} from "@/constants/mockData";
import { MOCK_BAZI, MOCK_USER, PLANETS, ZODIAC } from "@/constants/mockData";
import { supabase } from "@/lib/supabase";
import { getMe } from "@/lib/api";
import { configureRevenueCat } from "@/lib/revenuecat";
import { setSentryUser } from "@/lib/sentry";

const useMockData = process.env.EXPO_PUBLIC_USE_MOCK_DATA === "true";

export interface AppState {
  hasOnboarded: boolean;
  user: UserData | null;
  onboardingStep: OnboardingStep;
  authUser: User | null;
  session: Session | null;
  authLoading: boolean;
  authError: string | null;
}

function buildDisplayUser(payload: {
  profile?: Record<string, unknown> | null;
  birthProfile?: Record<string, unknown> | null;
  blueprint?: Record<string, unknown> | null;
}): UserData | null {
  const birthProfile = payload.birthProfile;
  if (!birthProfile) return null;

  const profile = payload.profile;
  return {
    ...MOCK_USER,
    fullName: String(birthProfile.full_birth_name ?? profile?.full_name ?? MOCK_USER.fullName),
    preferredName: String(profile?.preferred_name ?? profile?.full_name ?? MOCK_USER.preferredName),
    birthDate: String(birthProfile.birth_date ?? MOCK_USER.birthDate),
    birthTime: birthProfile.birth_time ? String(birthProfile.birth_time).slice(0, 5) : "",
    birthTimeKnown: Boolean(birthProfile.time_known ?? false),
    birthPlace: String(birthProfile.birth_place_label ?? MOCK_USER.birthPlace),
    chart: buildChartData(payload.blueprint?.astrology as Record<string, unknown> | undefined),
    numerology: buildNumerologyData(payload.blueprint?.numerology as Record<string, unknown> | undefined),
    chinese: buildChineseData(payload.blueprint?.chinese as Record<string, unknown> | undefined),
    bazi: buildBaziData(payload.blueprint?.bazi as Record<string, unknown> | undefined),
    humanDesign: buildHumanDesignData(payload.blueprint?.human_design as Record<string, unknown> | undefined),
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toZodiacSign(value: unknown, fallback: ZodiacSign): ZodiacSign {
  return typeof value === "string" && (ZODIAC as readonly string[]).includes(value) ? value as ZodiacSign : fallback;
}

function toPlanet(value: unknown, fallback: Planet): Planet {
  return typeof value === "string" && (PLANETS as readonly string[]).includes(value) ? value as Planet : fallback;
}

function buildChartData(astrology?: Record<string, unknown>): ChartData {
  const backendPlanets = Array.isArray(astrology?.planets)
    ? astrology.planets.map(toRecord).filter(Boolean) as Record<string, unknown>[]
    : [];

  const placements = MOCK_USER.chart.placements.map((fallbackPlacement) => {
    const backendPlacement = backendPlanets.find((p) => p.planet === fallbackPlacement.planet);
    return {
      planet: toPlanet(backendPlacement?.planet, fallbackPlacement.planet),
      sign: toZodiacSign(backendPlacement?.sign, fallbackPlacement.sign),
      house: toFiniteNumber(backendPlacement?.house, fallbackPlacement.house),
      degree: toFiniteNumber(backendPlacement?.degree, fallbackPlacement.degree),
    };
  });

  const sun = placements.find((p) => p.planet === "Sun") ?? MOCK_USER.chart.sun;
  const moon = placements.find((p) => p.planet === "Moon") ?? MOCK_USER.chart.moon;
  const ascendant = toRecord(astrology?.ascendant);

  return {
    sun,
    moon,
    rising: toZodiacSign(ascendant?.sign, MOCK_USER.chart.rising),
    placements,
  };
}

function buildNumerologyData(numerology?: Record<string, unknown>): NumerologyData {
  return {
    ...MOCK_USER.numerology,
    lifePath: toFiniteNumber(numerology?.lifePath, MOCK_USER.numerology.lifePath),
    expression: toFiniteNumber(numerology?.expression, MOCK_USER.numerology.expression),
    soulUrge: toFiniteNumber(numerology?.soulUrge, MOCK_USER.numerology.soulUrge),
    personalYear: toFiniteNumber(numerology?.personalYear, MOCK_USER.numerology.personalYear),
    personalMonth: toFiniteNumber(numerology?.personalMonth, MOCK_USER.numerology.personalMonth),
    personalDay: toFiniteNumber(numerology?.personalDay, MOCK_USER.numerology.personalDay),
  };
}

function buildChineseData(chinese?: Record<string, unknown>): ChineseAstrologyData {
  const animal = typeof chinese?.animal === "string" ? chinese.animal : MOCK_USER.chinese.animal;
  const element = typeof chinese?.element === "string" ? chinese.element : MOCK_USER.chinese.element;
  return {
    ...MOCK_USER.chinese,
    animal: animal as ChineseAstrologyData["animal"],
    element: element as ChineseAstrologyData["element"],
    elementAnimalLabel: `${element} ${animal}`,
  };
}

function buildBaziData(bazi?: Record<string, unknown>): BaziView {
  // Only a real provider chart (with a Day Master) is shown as BaZi. Anything
  // else renders the honest unavailable/partial state — never fabricated.
  if (!bazi || typeof bazi !== "object") return { ...MOCK_BAZI };

  const pillarsRaw = toRecord(bazi.pillars) ?? {};
  const order: [BaziView["pillars"][number]["label"], string][] = [
    ["Year", "year"], ["Month", "month"], ["Day", "day"], ["Hour", "hour"],
  ];
  const pillars = order.flatMap(([label, k]) => {
    const p = toRecord(pillarsRaw[k]);
    if (!p) return [];
    return [{
      label,
      stem: String(p.stem ?? ""),
      branch: String(p.branch ?? ""),
      element: String(p.element ?? ""),
      animal: p.animal ? String(p.animal) : undefined,
    }];
  });

  const dmRaw = toRecord(bazi.dayMaster);
  const dayMaster = dmRaw
    ? { stem: String(dmRaw.stem ?? ""), element: String(dmRaw.element ?? ""), yinYang: String(dmRaw.yinYang ?? "") }
    : null;
  const available = bazi.source === "provider" && !!dayMaster && pillars.some((p) => p.label === "Day");

  const balRaw = toRecord(bazi.fiveElementBalance) ?? {};
  const elementBalance = Object.entries(balRaw)
    .map(([element, v]) => ({ element, count: typeof v === "number" ? v : Number(v) || 0 }))
    .filter((e) => e.count > 0);
  const fav = Array.isArray(bazi.favorableElements) ? bazi.favorableElements.map(String) : [];
  const luckPillars = (Array.isArray(bazi.luckPillars) ? bazi.luckPillars : [])
    .map(toRecord).filter(Boolean).slice(0, 3)
    .map((l) => ({ stem: String(l!.stem ?? ""), branch: String(l!.branch ?? ""), startAge: typeof l!.startAge === "number" ? l!.startAge : null }));
  const notes = Array.isArray(bazi.confidenceNotes) ? bazi.confidenceNotes.map(String) : [];

  return {
    available,
    partial: Boolean(bazi.partial),
    missingInputs: Array.isArray(bazi.missingInputs) ? bazi.missingInputs.map(String) : [],
    unavailableReason: typeof bazi.unavailableReason === "string" ? bazi.unavailableReason : undefined,
    dayMaster: available ? dayMaster : null,
    dayMasterStrength: typeof bazi.dayMasterStrength === "string" ? bazi.dayMasterStrength : null,
    pillars: available ? pillars : [],
    elementBalance: available ? elementBalance : [],
    favorableElements: available ? fav : [],
    luckPillars: available ? luckPillars : [],
    notes: notes.length ? notes : MOCK_BAZI.notes,
  };
}

function buildHumanDesignData(humanDesign?: Record<string, unknown>): HumanDesignData {
  const definedCenters = Array.isArray(humanDesign?.definedCenters) ? humanDesign.definedCenters : [];

  return {
    ...MOCK_USER.humanDesign,
    type: typeof humanDesign?.type === "string" ? humanDesign.type as HumanDesignData["type"] : MOCK_USER.humanDesign.type,
    strategy: typeof humanDesign?.strategy === "string" ? humanDesign.strategy as HumanDesignData["strategy"] : MOCK_USER.humanDesign.strategy,
    authority: typeof humanDesign?.authority === "string" ? humanDesign.authority as HumanDesignData["authority"] : MOCK_USER.humanDesign.authority,
    profile: typeof humanDesign?.profile === "string" ? humanDesign.profile : MOCK_USER.humanDesign.profile,
    incarnationCross: typeof humanDesign?.incarnationCross === "string" ? humanDesign.incarnationCross : MOCK_USER.humanDesign.incarnationCross,
    centers: MOCK_USER.humanDesign.centers.map((center) => ({
      ...center,
      defined: definedCenters.includes(center.name) || definedCenters.includes(center.name.replace(" Center", "")),
    })),
  };
}

const [AppProvider, useAppStateRaw] = createContextHook(() => {
  const [state, setState] = useState<AppState>({
    hasOnboarded: useMockData,
    user: useMockData ? MOCK_USER : null,
    onboardingStep: useMockData ? "reveal" : "welcome",
    authUser: null,
    session: null,
    authLoading: !useMockData,
    authError: null,
  });

  const refreshUser = useCallback(async () => {
    if (useMockData) return;

    const { data, error } = await getMe();
    if (error) {
      setState((s) => ({
        ...s,
        hasOnboarded: false,
        user: null,
        onboardingStep: "welcome",
      }));
      return;
    }

    const displayUser = buildDisplayUser({
      profile: data?.profile as Record<string, unknown> | null,
      birthProfile: data?.birthProfile as Record<string, unknown> | null,
      blueprint: data?.blueprint as Record<string, unknown> | null,
    });

    setState((s) => ({
      ...s,
      hasOnboarded: !!displayUser,
      user: displayUser,
      onboardingStep: displayUser ? "reveal" : "welcome",
    }));
  }, []);

  useEffect(() => {
    if (useMockData) return;

    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = data.session ?? null;
      setState((s) => ({
        ...s,
        session,
        authUser: session?.user ?? null,
        authLoading: false,
      }));
      if (session) {
        setSentryUser(session.user.id);
        void configureRevenueCat(session.user.id);
        await refreshUser();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        session,
        authUser: session?.user ?? null,
        authLoading: false,
        authError: null,
        hasOnboarded: session ? s.hasOnboarded : false,
        user: session ? s.user : null,
        onboardingStep: session ? s.onboardingStep : "welcome",
      }));
      if (session) {
        setSentryUser(session.user.id);
        void configureRevenueCat(session.user.id);
        void refreshUser();
      } else {
        setSentryUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, authLoading: true, authError: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((s) => ({ ...s, authLoading: false, authError: error.message }));
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, authLoading: true, authError: null }));
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setState((s) => ({ ...s, authLoading: false, authError: error.message }));
      return { error: error.message, needsConfirmation: false };
    }
    setState((s) => ({ ...s, authLoading: false }));
    // When confirmations are on, signUp returns a user but no session.
    return { error: null, needsConfirmation: !data.session && !!data.user };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    return { error: error?.message ?? null };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      hasOnboarded: false,
      user: null,
      onboardingStep: "welcome",
      authUser: null,
      session: null,
      authLoading: false,
      authError: null,
    });
  }, []);

  const setOnboardingStep = useCallback((step: OnboardingStep) => {
    setState((s) => ({ ...s, onboardingStep: step }));
  }, []);

  const completeOnboarding = useCallback((userData: UserData) => {
    setState((s) => ({ ...s, hasOnboarded: true, user: userData, onboardingStep: "reveal" }));
  }, []);

  const updateUser = useCallback((updates: Partial<UserData>) => {
    setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, ...updates } : null,
    }));
  }, []);

  const updatePreferredName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { error: "Please enter a name." };
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return { error: "You're not signed in." };
    const { error } = await supabase.from("profiles").update({ preferred_name: trimmed }).eq("id", uid);
    if (error) return { error: error.message };
    setState((s) => ({ ...s, user: s.user ? { ...s.user, preferredName: trimmed } : s.user }));
    return { error: null };
  }, []);

  const resetOnboarding = useCallback(() => {
    setState((s) => ({ ...s, hasOnboarded: false, user: null, onboardingStep: "welcome" }));
  }, []);

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
    refreshUser,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
    updatePreferredName,
  };
});

function useAppState(): ReturnType<typeof useAppStateRaw> {
  return useAppStateRaw();
}

export { AppProvider, useAppState };
