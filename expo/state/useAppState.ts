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
import {
  UNAVAILABLE_BAZI,
  PLANETS,
  ZODIAC,
  NUMBER_MEANINGS,
  CHINESE_INTERPRETATIONS,
  CHINESE_ANIMAL_INTERPRETATIONS,
  HD_INTERPRETATIONS,
} from "@/constants/mockData";
import { MOCK_USER } from "@/constants/demoData";
import { isDemoMode } from "@/lib/runtimeMode";
import { supabase, NO_BACKEND_ERROR } from "@/lib/supabase";
import { getMe } from "@/lib/api";
import { configureRevenueCat } from "@/lib/revenuecat";
import { setSentryUser } from "@/lib/sentry";

// Demo mode (EXPO_PUBLIC_USE_MOCK_DATA=true) shows the beautiful MOCK_USER.
// Live mode builds the user ONLY from the real /me payload — never from MOCK_USER.
const useMockData = isDemoMode;

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
  const bp = payload.blueprint ?? null;
  // Live mode builds ONLY from the real /me payload. Any lens the backend has not
  // produced yet stays null/unavailable so the UI shows an honest state — never
  // another (demo) user's chart, numbers, animal, or Human Design.
  return {
    fullName: String(birthProfile.full_birth_name ?? profile?.full_name ?? ""),
    preferredName: String(profile?.preferred_name ?? profile?.full_name ?? birthProfile.full_birth_name ?? ""),
    birthDate: String(birthProfile.birth_date ?? ""),
    birthTime: birthProfile.birth_time ? String(birthProfile.birth_time).slice(0, 5) : "",
    birthTimeKnown: Boolean(birthProfile.time_known ?? false),
    birthPlace: String(birthProfile.birth_place_label ?? ""),
    chart: buildChartData(toRecord(bp?.astrology)),
    numerology: buildNumerologyData(toRecord(bp?.numerology)),
    chinese: buildChineseData(toRecord(bp?.chinese)),
    bazi: buildBaziData(toRecord(bp?.bazi)),
    humanDesign: buildHumanDesignData(toRecord(bp?.human_design)),
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((v) => typeof v === "string") ? value as string[] : null;
}

function asZodiac(value: unknown): ZodiacSign | null {
  return typeof value === "string" && (ZODIAC as readonly string[]).includes(value) ? value as ZodiacSign : null;
}

function asPlanet(value: unknown): Planet | null {
  return typeof value === "string" && (PLANETS as readonly string[]).includes(value) ? value as Planet : null;
}

// ─── Per-lens builders ─────────────────────────────────────────────────────
// Each returns REAL backend data, or null when the lens isn't available yet.
// Generic, value-accurate descriptions come from production-safe reference
// tables (NUMBER_MEANINGS / CHINESE_INTERPRETATIONS / HD_INTERPRETATIONS) keyed
// by the user's REAL number/animal/type — never copied from a demo user.

function buildChartData(astrology: Record<string, unknown> | null): ChartData | null {
  if (!astrology) return null;
  const rawPlanets = Array.isArray(astrology.planets) ? astrology.planets : [];
  const placements: Placement[] = rawPlanets.flatMap((raw) => {
    const p = toRecord(raw);
    const planet = asPlanet(p?.planet);
    const sign = asZodiac(p?.sign);
    if (!p || !planet || !sign) return [];
    return [{ planet, sign, house: toFiniteNumber(p.house, 0), degree: toFiniteNumber(p.degree, 0) }];
  });

  const sun = placements.find((p) => p.planet === "Sun");
  const moon = placements.find((p) => p.planet === "Moon");
  // Without a real Sun and Moon there's no usable chart — stay honest (null).
  if (!sun || !moon) return null;

  const ascendant = toRecord(astrology.ascendant);
  return {
    sun,
    moon,
    rising: asZodiac(ascendant?.sign), // null when birth time is unknown
    placements,
  };
}

function buildNumerologyData(numerology: Record<string, unknown> | null): NumerologyData | null {
  const lifePath = numerology?.lifePath;
  if (typeof lifePath !== "number" || !Number.isFinite(lifePath)) return null;

  // Prefer a backend-provided meaning; otherwise use the generic, accurate
  // meaning of the REAL number (never a demo user's life-path text).
  const meaning = (n: number, provided: unknown): string =>
    asString(provided) ?? NUMBER_MEANINGS[n]?.description ?? "";

  const expression = toFiniteNumber(numerology?.expression, 0);
  const soulUrge = toFiniteNumber(numerology?.soulUrge, 0);
  const personalYear = toFiniteNumber(numerology?.personalYear, 0);
  const personalMonth = toFiniteNumber(numerology?.personalMonth, 0);
  const personalDay = toFiniteNumber(numerology?.personalDay, 0);
  return {
    lifePath,
    lifePathMeaning: meaning(lifePath, numerology?.lifePathMeaning),
    expression,
    expressionMeaning: meaning(expression, numerology?.expressionMeaning),
    soulUrge,
    soulUrgeMeaning: meaning(soulUrge, numerology?.soulUrgeMeaning),
    personalYear,
    personalYearMeaning: meaning(personalYear, numerology?.personalYearMeaning),
    personalMonth,
    personalMonthMeaning: meaning(personalMonth, numerology?.personalMonthMeaning),
    personalDay,
    personalDayMeaning: meaning(personalDay, numerology?.personalDayMeaning),
  };
}

function buildChineseData(chinese: Record<string, unknown> | null): ChineseAstrologyData | null {
  const animal = asString(chinese?.animal);
  const element = asString(chinese?.element);
  if (!animal || !element) return null;

  // Prefer the richer element-animal entry; fall back to the per-animal table so
  // every one of the 12 signs has real description/strengths/growth-edge content.
  const interp = CHINESE_INTERPRETATIONS[`${element}-${animal}`] ?? CHINESE_ANIMAL_INTERPRETATIONS[animal];
  return {
    animal: animal as ChineseAstrologyData["animal"],
    element: element as ChineseAstrologyData["element"],
    elementAnimalLabel: `${element} ${animal}`,
    description: asString(chinese?.description) ?? interp?.description ?? "",
    strengths: asStringArray(chinese?.strengths) ?? interp?.strengths ?? [],
    growthEdge: asString(chinese?.growthEdge) ?? interp?.growthEdge ?? "",
    // The backend doesn't compute a per-day Chinese forecast — don't invent one.
    todayAnimal: (asString(chinese?.todayAnimal) ?? animal) as ChineseAstrologyData["todayAnimal"],
    todayElement: (asString(chinese?.todayElement) ?? element) as ChineseAstrologyData["todayElement"],
    todayNote: asString(chinese?.todayNote) ?? "",
    // Real Four Pillars live in the separate `bazi` lens — never fake them here.
    bazi: [],
  };
}

function buildBaziData(bazi: Record<string, unknown> | null): BaziView {
  // Only a real provider chart (with a Day Master) is shown as BaZi. Anything
  // else renders the honest unavailable/partial state — never fabricated.
  if (!bazi) return { ...UNAVAILABLE_BAZI };

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
    notes: notes.length ? notes : UNAVAILABLE_BAZI.notes,
  };
}

const HD_CENTER_NAMES = [
  "Head", "Ajna", "Throat", "G Center", "Heart/Ego",
  "Sacral", "Solar Plexus", "Spleen", "Root",
] as const;

function buildHumanDesignData(humanDesign: Record<string, unknown> | null): HumanDesignData | null {
  const type = asString(humanDesign?.type);
  if (!type) return null;

  const interp = HD_INTERPRETATIONS[type];
  const defined = asStringArray(humanDesign?.definedCenters) ?? [];
  const isDefined = (name: string) =>
    defined.includes(name) || defined.includes(name.replace(" Center", ""));

  return {
    type: type as HumanDesignData["type"],
    typeDescription: asString(humanDesign?.typeDescription) ?? interp?.description ?? "",
    strategy: (asString(humanDesign?.strategy) ?? "") as HumanDesignData["strategy"],
    strategyDescription: asString(humanDesign?.strategyDescription) ?? "",
    authority: (asString(humanDesign?.authority) ?? "") as HumanDesignData["authority"],
    authorityDescription: asString(humanDesign?.authorityDescription) ?? "",
    profile: asString(humanDesign?.profile) ?? "",
    profileDescription: asString(humanDesign?.profileDescription) ?? "",
    incarnationCross: asString(humanDesign?.incarnationCross) ?? "",
    signature: asString(humanDesign?.signature) ?? "",
    notSelf: asString(humanDesign?.notSelf) ?? "",
    centers: HD_CENTER_NAMES.map((name) => ({ name, defined: isDefined(name), gates: [] })),
    strengths: asStringArray(humanDesign?.strengths) ?? interp?.strengths ?? [],
    growthEdge: asString(humanDesign?.growthEdge) ?? interp?.growthEdge ?? "",
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

    // Live mode with no configured backend: fail clearly instead of hanging on a
    // fake client. The auth gate surfaces this as a user-safe "can't connect".
    const sb = supabase;
    if (!sb) {
      setState((s) => ({ ...s, authLoading: false, authError: NO_BACKEND_ERROR }));
      return;
    }

    let mounted = true;
    sb.auth.getSession().then(async ({ data }) => {
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

    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
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
    if (!supabase) return { error: NO_BACKEND_ERROR };
    setState((s) => ({ ...s, authLoading: true, authError: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((s) => ({ ...s, authLoading: false, authError: error.message }));
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: NO_BACKEND_ERROR, needsConfirmation: false };
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
    if (!supabase) return { error: NO_BACKEND_ERROR };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    return { error: error?.message ?? null };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    if (!supabase) return { error: NO_BACKEND_ERROR };
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
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
    if (!supabase) return { error: NO_BACKEND_ERROR };
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
