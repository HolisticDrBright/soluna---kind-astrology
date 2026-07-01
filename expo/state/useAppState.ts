import { useState, useCallback, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import type { Session, User } from "@supabase/supabase-js";
import type {
  BaziView,
  VedicView,
  VedicDashaView,
  VedicDashaPeriodView,
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
  UNAVAILABLE_VEDIC,
  PLANETS,
  ZODIAC,
  NUMBER_MEANINGS,
  CHINESE_INTERPRETATIONS,
  CHINESE_ANIMAL_INTERPRETATIONS,
  HD_INTERPRETATIONS,
  HD_TYPE_GUIDANCE,
  HD_AUTHORITY_MEANINGS,
  HD_PROFILE_LINES,
} from "@/constants/mockData";
import { MOCK_USER } from "@/constants/demoData";
import { isDemoMode } from "@/lib/runtimeMode";
import { supabase, NO_BACKEND_ERROR } from "@/lib/supabase";
import { getMe } from "@/lib/api";
import { configureRevenueCat } from "@/lib/revenuecat";
import { setSentryUser } from "@/lib/sentry";
import { loadCachedUser, saveCachedUser, clearCachedUser } from "@/lib/userCache";

// Demo mode (EXPO_PUBLIC_USE_MOCK_DATA=true) shows the beautiful MOCK_USER.
// Live mode builds the user ONLY from the real /me payload — never from MOCK_USER.
const useMockData = isDemoMode;
const AUTH_TIMEOUT_MS = 15000;

async function withAuthTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Authentication timed out. Please try again.")), AUTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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
    vedic: buildVedicData(toRecord(bp?.vedic)),
    humanDesign: buildHumanDesignData(toRecord(bp?.human_design)),
  };
}

function nonStaleOnboardingStep(step: OnboardingStep): OnboardingStep {
  return step === "calculating" ? "welcome" : step;
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
      nayin: p.nayin ? String(p.nayin) : undefined,
      lifeStage: p.lifeStage ? String(p.lifeStage) : undefined,
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
  const structure = typeof bazi.structure === "string" ? bazi.structure : null;
  const stars = (Array.isArray(bazi.stars) ? bazi.stars : [])
    .map(toRecord).filter(Boolean)
    .map((s) => ({
      name: String(s!.name ?? ""),
      pillar: s!.pillar ? String(s!.pillar) : undefined,
      description: s!.description ? String(s!.description) : undefined,
    }))
    .filter((s) => s.name);
  const voidBranches = Array.isArray(bazi.voidBranches) ? bazi.voidBranches.map(String) : [];
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
    structure: available ? structure : null,
    stars: available ? stars : [],
    voidBranches: available ? voidBranches : [],
    notes: notes.length ? notes : UNAVAILABLE_BAZI.notes,
  };
}

// Vimshottari Dasha — read the fixed timeline stored on the chart and recompute
// which period is active TODAY (pure date math), so a cached blueprint never shows
// a stale "current period". Only real provider data is surfaced; else undefined.
function buildDashaView(vedic: Record<string, unknown> | null): VedicDashaView | undefined {
  const dasha = toRecord(vedic?.dasha);
  if (!dasha || dasha.source !== "provider") return undefined;
  const rawTimeline = Array.isArray(dasha.timeline) ? dasha.timeline : [];
  const period = (p: Record<string, unknown> | null): VedicDashaPeriodView | null => {
    if (!p) return null;
    const planet = String(p.planet ?? "");
    const start = String(p.start ?? "");
    const end = String(p.end ?? "");
    return planet && start && end ? { planet, start, end } : null;
  };
  const maha = rawTimeline.map(toRecord).filter(Boolean) as Record<string, unknown>[];
  const timeline = maha.map(period).filter((p): p is VedicDashaPeriodView => p !== null)
    .sort((a, b) => a.start.localeCompare(b.start));
  if (!timeline.length) return undefined;

  const today = new Date().toISOString().split("T")[0];
  const activeMahaRaw = maha.find((m) => String(m.start ?? "") <= today && today < String(m.end ?? "")) ?? null;
  const currentMaha = period(activeMahaRaw);
  let currentAntar: VedicDashaPeriodView | null = null;
  if (activeMahaRaw) {
    const subs = Array.isArray(activeMahaRaw.subPeriods) ? activeMahaRaw.subPeriods.map(toRecord).filter(Boolean) as Record<string, unknown>[] : [];
    const activeAntar = subs.find((sp) => String(sp.start ?? "") <= today && today < String(sp.end ?? "")) ?? null;
    currentAntar = period(activeAntar);
  }
  return {
    system: typeof dasha.system === "string" && dasha.system ? dasha.system : "Vimshottari",
    maha: currentMaha,
    antar: currentAntar,
    timeline,
  };
}

// Vedic / sidereal lens — only a real provider chart is shown; otherwise the
// honest unavailable/partial state. Never fabricated.
function buildVedicData(vedic: Record<string, unknown> | null): VedicView {
  if (!vedic) return { ...UNAVAILABLE_VEDIC };

  const ascRaw = toRecord(vedic.ascendant);
  const ascendant = ascRaw
    ? {
        sign: String(ascRaw.sign ?? ""),
        degree: typeof ascRaw.degree === "number" ? ascRaw.degree : Number(ascRaw.degree) || 0,
        nakshatra: ascRaw.nakshatra ? String(ascRaw.nakshatra) : undefined,
      }
    : null;

  const planets = (Array.isArray(vedic.planets) ? vedic.planets : [])
    .map(toRecord).filter(Boolean)
    .map((p) => ({
      planet: String(p!.planet ?? ""),
      sign: String(p!.sign ?? ""),
      degree: typeof p!.degree === "number" ? p!.degree : Number(p!.degree) || 0,
      house: typeof p!.house === "number" ? p!.house : null,
      retrograde: Boolean(p!.retrograde),
      nakshatra: p!.nakshatra ? String(p!.nakshatra) : undefined,
      nakshatraLord: p!.nakshatraLord ? String(p!.nakshatraLord) : undefined,
    }))
    .filter((p) => p.planet);

  const available = vedic.source === "provider" && planets.length > 0;
  const sadeRaw = toRecord(vedic.sadeSati);
  const sadeSati = sadeRaw
    ? { active: Boolean(sadeRaw.active), phase: sadeRaw.phase != null ? String(sadeRaw.phase) : null, note: String(sadeRaw.note ?? "") }
    : null;
  const notes = Array.isArray(vedic.confidenceNotes) ? vedic.confidenceNotes.map(String) : [];

  return {
    available,
    partial: Boolean(vedic.partial),
    missingInputs: Array.isArray(vedic.missingInputs) ? vedic.missingInputs.map(String) : [],
    unavailableReason: typeof vedic.unavailableReason === "string" ? vedic.unavailableReason : undefined,
    ascendant: available ? ascendant : null,
    planets: available ? planets : [],
    moonNakshatra: available && typeof vedic.moonNakshatra === "string" ? vedic.moonNakshatra : undefined,
    sadeSati: available ? sadeSati : null,
    ayanamsha: typeof vedic.ayanamsha === "string" ? vedic.ayanamsha : undefined,
    dasha: available ? buildDashaView(vedic) : undefined,
    notes: notes.length ? notes : UNAVAILABLE_VEDIC.notes,
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
  const typeGuide = HD_TYPE_GUIDANCE[type];
  const defined = asStringArray(humanDesign?.definedCenters) ?? [];
  const isDefined = (name: string) =>
    defined.includes(name) || defined.includes(name.replace(" Center", ""));

  // Authority description keyed by the leading label (before the dash) of the
  // engine's string, e.g. "Emotional Authority — wait…" → "Emotional Authority".
  const authorityRaw = asString(humanDesign?.authority) ?? "";
  const authorityLabel = authorityRaw.split(/[—–]/)[0].trim();
  const authorityDesc = HD_AUTHORITY_MEANINGS[authorityLabel] ?? "";

  // Profile description composed from its two lines (e.g. "1/3").
  const profileStr = asString(humanDesign?.profile) ?? "";
  const [pl1, pl2] = profileStr.split("/").map((n) => Number(n.trim()));
  const composeProfile = (): string => {
    const a = HD_PROFILE_LINES[pl1], b = HD_PROFILE_LINES[pl2];
    if (!a || !b) return "";
    return `Line ${pl1} the ${a.name} over Line ${pl2} the ${b.name}: you lead with ${a.theme}, expressed through ${b.theme}.`;
  };

  return {
    type: type as HumanDesignData["type"],
    typeDescription: asString(humanDesign?.typeDescription) ?? interp?.description ?? "",
    strategy: (asString(humanDesign?.strategy) ?? "") as HumanDesignData["strategy"],
    strategyDescription: asString(humanDesign?.strategyDescription) ?? typeGuide?.strategyDescription ?? "",
    authority: (asString(humanDesign?.authority) ?? "") as HumanDesignData["authority"],
    authorityDescription: asString(humanDesign?.authorityDescription) ?? authorityDesc,
    profile: profileStr,
    profileDescription: asString(humanDesign?.profileDescription) ?? composeProfile(),
    incarnationCross: asString(humanDesign?.incarnationCross) ?? "",
    signature: asString(humanDesign?.signature) ?? typeGuide?.signature ?? "",
    notSelf: asString(humanDesign?.notSelf) ?? typeGuide?.notSelf ?? "",
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

    // Retry transient failures so a single cold-start network blip can't drop a
    // returning, already-onboarded user back into onboarding.
    let res = await getMe();
    for (let attempt = 1; res.error && attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
      res = await getMe();
    }

    if (res.error) {
      // Couldn't reach the backend. Do NOT conclude "not onboarded" — that would
      // wrongly send a returning user through onboarding again. Restore the
      // last-known cached user (if any) so a cold-start backend blip still opens
      // straight to the dashboard; otherwise just stop the spinner and keep what
      // we know, and screens show a retry path.
      const cached = await loadCachedUser();
      setState((s) => {
        if (s.user) return { ...s, authLoading: false };
        if (cached) {
          return { ...s, user: cached, hasOnboarded: true, onboardingStep: "reveal", authLoading: false };
        }
        return { ...s, authLoading: false };
      });
      return;
    }

    const displayUser = buildDisplayUser({
      profile: res.data?.profile as Record<string, unknown> | null,
      birthProfile: res.data?.birthProfile as Record<string, unknown> | null,
      blueprint: res.data?.blueprint as Record<string, unknown> | null,
    });

    // Cache the freshly loaded user so the next launch can open straight to the
    // dashboard even if that launch's /me call is slow or fails.
    if (displayUser) void saveCachedUser(displayUser);

    setState((s) => ({
      ...s,
      hasOnboarded: !!displayUser,
      user: displayUser,
      onboardingStep: displayUser ? "reveal" : "welcome",
      authLoading: false,
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
    // supabase-js restores the session natively at launch (persistSession +
    // AsyncStorage + the URL polyfill). We just READ it — no manual setSession,
    // which would race GoTrue's own recovery and trip refresh-token reuse
    // detection (intermittent sign-outs on a later reopen).
    (async () => {
      try {
        const { data } = await withAuthTimeout(sb.auth.getSession());
        if (!mounted) return;
        const session = data.session ?? null;
        setState((s) => ({
          ...s,
          session,
          authUser: session?.user ?? null,
          // Keep loading TRUE while a session exists until refreshUser determines
          // onboarding status — otherwise the router momentarily sees "logged in but
          // not onboarded" and bounces a returning user into onboarding.
          authLoading: session ? s.authLoading : false,
          onboardingStep: session ? nonStaleOnboardingStep(s.onboardingStep) : "welcome",
        }));
        if (session) {
          setSentryUser(session.user.id);
          void configureRevenueCat(session.user.id);
          await refreshUser();
        }
      } catch (err) {
        if (!mounted) return;
        setState((s) => ({
          ...s,
          session: null,
          authUser: null,
          authLoading: false,
          authError: err instanceof Error ? err.message : "Authentication failed. Please try again.",
        }));
      }
    })();

    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        session,
        authUser: session?.user ?? null,
        // Same race guard: while a session exists, hold loading until refreshUser
        // resolves onboarding status (it clears authLoading itself).
        authLoading: session ? s.authLoading : false,
        authError: null,
        hasOnboarded: session ? s.hasOnboarded : false,
        user: session ? s.user : null,
        onboardingStep: session ? nonStaleOnboardingStep(s.onboardingStep) : "welcome",
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
    let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
    try {
      result = await withAuthTimeout(supabase.auth.signInWithPassword({ email, password }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      setState((s) => ({ ...s, authLoading: false, authError: message }));
      return { error: message };
    }
    const { data, error } = result;
    if (error) {
      setState((s) => ({ ...s, authLoading: false, authError: error.message }));
      return { error: error.message };
    }
    const session = data.session ?? null;
    setState((s) => ({
      ...s,
      session,
      authUser: session?.user ?? null,
      authLoading: false,
      authError: null,
      onboardingStep: "welcome",
    }));
    if (session) {
      setSentryUser(session.user.id);
      void configureRevenueCat(session.user.id);
      await refreshUser();
    }
    return { error: null };
  }, [refreshUser]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: NO_BACKEND_ERROR, needsConfirmation: false };
    setState((s) => ({ ...s, authLoading: true, authError: null }));
    let result: Awaited<ReturnType<typeof supabase.auth.signUp>>;
    try {
      result = await withAuthTimeout(supabase.auth.signUp({ email, password }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      setState((s) => ({ ...s, authLoading: false, authError: message }));
      return { error: message, needsConfirmation: false };
    }
    const { data, error } = result;
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
    void clearCachedUser();
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
    if (!useMockData) void saveCachedUser(userData);
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
    void clearCachedUser();
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
