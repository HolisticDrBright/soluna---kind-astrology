import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated as RNAnimated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { CITIES, CITY_COORDS, ZODIAC_SYMBOLS, CHINESE_ANIMAL_EMOJI, CHINESE_INTERPRETATIONS, HD_INTERPRETATIONS, Fonts, type OnboardingStep, NUMBER_MEANINGS } from "@/constants/mockData";
import { ChevronLeft, Sparkles, Sun, Moon, Star, Hash, Bird, Cpu, MapPin, Clock } from "lucide-react-native";
import { submitOnboarding, geoAutocomplete, geoResolve, type PlaceSuggestion, type ResolvedPlace } from "@/lib/api";
import { isDemoMode } from "@/lib/runtimeMode";

const TOTAL_STEPS = 8;

// Real Google place resolution is used for the live (paid) journey; the static
// CITY_COORDS table is only a convenience for mock/demo mode.
const USE_MOCK_DATA = isDemoMode;

// Format a Date by its LOCAL calendar parts (never UTC). birthDate is built as
// local midnight, so .toISOString() would shift the day backward for any user
// west of UTC (all of the Americas) and silently corrupt the whole blueprint
// (Sun sign at cusps, Life Path, Chinese animal, BaZi, …).
const toLocalDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={siS.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[siS.dot, i === current ? siS.dotCurrent : i < current ? siS.dotDone : siS.dotInactive]} />
      ))}
    </View>
  );
}
const siS = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, justifyContent: "center", alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotCurrent: { backgroundColor: SolunaColors.warmGold, width: 22, height: 6 },
  dotDone: { backgroundColor: "rgba(232,184,109,0.4)", width: 8, height: 8, borderRadius: 4 },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.12)" },
});

export default function OnboardingScreen() {
  const { authUser, user, onboardingStep, setOnboardingStep, refreshUser } = useAppState();

  // All fields start empty — no prefilled demo data
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthDateText, setBirthDateText] = useState("");
  const [dateError, setDateError] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [birthPlace, setBirthPlace] = useState("");
  const [placeSearch, setPlaceSearch] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  // Live geo (Google) autocomplete + resolved coordinates/timezone.
  const [geoSuggestions, setGeoSuggestions] = useState<PlaceSuggestion[]>([]);
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(null);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [revealReady, setRevealReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;
  const calculatingAnim = useRef(new RNAnimated.Value(0)).current;
  const revealFade = useRef(new RNAnimated.Value(0)).current;

  const stepIndex: Record<OnboardingStep, number> = {
    welcome: 0, fullName: 1, preferredName: 2, birthdate: 3,
    birthtime: 4, birthplace: 5, calculating: 6, reveal: 7,
  };
  const currentStepIndex = stepIndex[onboardingStep];

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0); slideAnim.setValue(30);
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      RNAnimated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => { animateIn(); }, [onboardingStep, animateIn]);

  // Visual "weaving" animation only — the reveal is gated on the real blueprint
  // actually loading (see handleWeave), never on a timer.
  useEffect(() => {
    if (onboardingStep === "calculating" && !revealReady) {
      calculatingAnim.setValue(0);
      RNAnimated.timing(calculatingAnim, { toValue: 1, duration: 1600, useNativeDriver: false }).start();
    }
  }, [onboardingStep, revealReady, calculatingAnim]);

  useEffect(() => {
    if (revealReady) {
      revealFade.setValue(0);
      RNAnimated.timing(revealFade, { toValue: 1, duration: 600, useNativeDriver: false }).start();
    }
  }, [revealReady, revealFade]);

  const handleCitySearch = (text: string) => {
    setPlaceSearch(text);
    setSubmitError("");
    if (USE_MOCK_DATA) {
      setFilteredCities(text.length >= 1 ? CITIES.filter((c) => c.toLowerCase().includes(text.toLowerCase())) : []);
      return;
    }
    // Live: real Google Places autocomplete (server-proxied). Changing the text
    // invalidates any previously resolved place.
    setResolvedPlace(null);
    if (text.trim().length >= 2) {
      geoAutocomplete(text)
        .then(({ data }) => setGeoSuggestions(data?.suggestions ?? []))
        .catch(() => setGeoSuggestions([]));
    } else {
      setGeoSuggestions([]);
    }
  };
  // Mock mode: pick a static city (coords come from CITY_COORDS).
  const selectCity = (city: string) => {
    setBirthPlace(city);
    setPlaceSearch("");
    setFilteredCities([]);
    setSubmitError("");
  };
  // Live mode: resolve the chosen place to real lat/lng + a date-aware timezone.
  const selectResolvedPlace = async (s: PlaceSuggestion) => {
    setBirthPlace(s.label);
    setPlaceSearch("");
    setGeoSuggestions([]);
    setResolvedPlace(null);
    setSubmitError("");
    const dateForTz = toLocalDateString(birthDate ?? new Date());
    setResolvingPlace(true);
    const { data, error } = await geoResolve(s.id, dateForTz);
    setResolvingPlace(false);
    if (error || !data?.place) {
      setSubmitError(error ?? "We couldn't resolve that place. Please try another.");
      return;
    }
    setResolvedPlace(data.place);
  };

  const goNext = () => {
    const sequence: OnboardingStep[] = ["welcome", "fullName", "preferredName", "birthdate", "birthtime", "birthplace", "calculating", "reveal"];
    const idx = sequence.indexOf(onboardingStep);
    if (idx < sequence.length - 1) {
      setOnboardingStep(sequence[idx + 1]);
    }
  };
  const goBack = () => {
    const sequence: OnboardingStep[] = ["welcome", "fullName", "preferredName", "birthdate", "birthtime", "birthplace", "calculating", "reveal"];
    const idx = sequence.indexOf(onboardingStep);
    if (idx > 0) setOnboardingStep(sequence[idx - 1]);
  };

  // Submit the real birth profile, compute + persist the real blueprint, then
  // load it from /me before revealing. No mock completion, no demo chart.
  const handleWeave = async () => {
    if (isSubmitting) return;
    setSubmitError("");
    setSubmitNotice("");

    if (!authUser) {
      router.replace("/auth");
      return;
    }
    if (!fullName.trim()) {
      setSubmitError("Add your full birth name before we save your blueprint.");
      setOnboardingStep("fullName");
      return;
    }
    if (!birthDate) {
      setSubmitError("Add your birth date before we save your blueprint.");
      setOnboardingStep("birthdate");
      return;
    }
    if (!isBirthTimeValid) {
      setSubmitError("Use a valid 24-hour birth time, like 14:35, or choose that you do not know it yet.");
      setOnboardingStep("birthtime");
      return;
    }

    // Real coordinates/timezone come from a resolved Google place (live), or the
    // static table (mock/demo only). No silent 0,0/UTC fallback.
    const place = USE_MOCK_DATA
      ? CITY_COORDS[birthPlace]
      : (resolvedPlace
        ? { lat: resolvedPlace.lat, lng: resolvedPlace.lng, timezone: resolvedPlace.timezone }
        : undefined);
    if (!place) {
      setSubmitError(
        USE_MOCK_DATA
          ? "Pick a supported city from the list so we can use real timezone data."
          : "Choose your birth city from the search results so we can resolve your real coordinates and timezone.",
      );
      setOnboardingStep("birthplace");
      return;
    }

    setIsSubmitting(true);
    setRevealReady(false);
    setOnboardingStep("calculating");

    const { error } = await submitOnboarding({
      full_birth_name: fullName.trim(),
      preferred_name: preferredName.trim() || fullName.trim().split(" ")[0],
      birth_date: toLocalDateString(birthDate),
      birth_time: birthTimeKnown ? birthTime : null,
      time_known: birthTimeKnown,
      birth_place_label: resolvedPlace?.label ?? birthPlace,
      lat: place.lat,
      lng: place.lng,
      timezone: place.timezone,
      house_system: "placidus",
    });

    if (error) {
      setIsSubmitting(false);
      setSubmitError(error);
      setOnboardingStep("birthplace");
      return;
    }

    // Pull the freshly computed blueprint so the reveal shows the real user.
    await refreshUser();
    setIsSubmitting(false);
    setRevealReady(true);
  };

  // Data is already saved by the time the reveal shows — just enter the app.
  const handleBegin = () => {
    router.replace("/(tabs)");
  };

  const formatDateLong = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const parseAndSetDate = (text: string) => {
    setBirthDateText(text);
    setDateError("");
    const trimmed = text.trim();
    if (trimmed.length === 0) { setBirthDate(null); return; }

    let parsed: Date | null = null;
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, m, d, y] = slashMatch;
      parsed = new Date(+y, +m - 1, +d);
    }
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!parsed && isoMatch) {
      const [, y, m, d] = isoMatch;
      parsed = new Date(+y, +m - 1, +d);
    }
    if (!parsed) parsed = new Date(trimmed);

    if (parsed && !isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < new Date().getFullYear()) {
      setBirthDate(parsed);
      setBirthDateText(parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
      setDateError("");
    } else if (trimmed.length >= 3) {
      setDateError("Try a format like 'June 22, 1995' or '06/22/1995'");
    }
  };

  const isFullNameValid = fullName.trim().length > 0;
  const isBirthTimeValid = birthTimeKnown ? /^([01]?\d|2[0-3]):[0-5]\d$/.test(birthTime) : true;
  const isPlaceValid = USE_MOCK_DATA
    ? birthPlace.length > 0 && !!CITY_COORDS[birthPlace]
    : !!resolvedPlace;

  // ─── Calculating screen ───────────────────────────────
  if (onboardingStep === "calculating" && !revealReady) {
    const glyphs = ["☉", "☽", "☆", "3", "🐖", "⚡"];
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={os.gradient}>
        <View style={os.content}>
          <RNAnimated.View style={[os.calcContainer, { opacity: calculatingAnim, transform: [{ scale: calculatingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
            <View style={os.glyphsRow}>
              {glyphs.map((g, i) => (
                <Text key={i} style={os.glyphText}>{g}</Text>
              ))}
            </View>
            <View style={os.chartCircle}><Sparkles size={40} color={SolunaColors.warmGold} /></View>
            <Text style={os.calcTitle}>Weaving your blueprint…</Text>
            <Text style={os.calcSub}>
              {preferredName ? `${preferredName}'s cosmic design` : "Your cosmic design"} is coming together — astrology, numerology, Chinese, Human Design
            </Text>
          </RNAnimated.View>
        </View>
      </LinearGradient>
    );
  }

  // ─── Reveal screen (real blueprint) ──────────────────
  if (revealReady) {
    const chart = user?.chart;
    const num = user?.numerology;
    const animal = user?.chinese?.animal;
    const element = user?.chinese?.element;
    const elementAnimalLabel = user?.chinese?.elementAnimalLabel ?? (element && animal ? `${element} ${animal}` : "");
    const hdType = user?.humanDesign?.type;
    const name = user?.preferredName || preferredName || fullName?.split(" ")[0] || "You";

    // The blueprint is saved synchronously during onboarding; if it somehow isn't
    // loaded yet, show a kind partial state instead of any demo data.
    if (!chart || !num) {
      return (
        <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={os.gradient}>
          <View style={[os.content, { justifyContent: "center" }]}>
            <Sparkles size={32} color={SolunaColors.warmGold} />
            <Text style={[os.revealTitle, { marginTop: 14 }]}>Your details are saved</Text>
            <Text style={os.revealSub}>We saved your birth details, {name}. Your full blueprint will be ready in a moment.</Text>
            <TouchableOpacity style={[os.beginButton, { marginTop: 24 }]} onPress={handleWeave} activeOpacity={0.8} disabled={isSubmitting}>
              <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.beginGradient}>
                {isSubmitting ? <ActivityIndicator color={SolunaColors.deepIndigo} /> : <Text style={os.beginButtonText}>Refresh</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 14 }} onPress={handleBegin}>
              <Text style={os.submitNotice}>Continue to Soluna</Text>
            </TouchableOpacity>
            {submitError ? <Text style={os.submitError}>{submitError}</Text> : null}
          </View>
        </LinearGradient>
      );
    }

    const lifePathInfo = NUMBER_MEANINGS[num.lifePath];
    const chineseInfo = element && animal ? CHINESE_INTERPRETATIONS[`${element}-${animal}`] : undefined;
    const hdInfo = hdType ? HD_INTERPRETATIONS[hdType] : undefined;
    const roleLine: Record<string, string> = {
      Sun: "Your core self — how you shine and what energizes you.",
      Moon: "Your inner world — how you feel, rest, and recharge.",
      Rising: "Your first impression — how you meet the world.",
    };

    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={os.gradient}>
        <RNAnimated.View style={[os.content, { opacity: revealFade }]}>
          <View style={os.revealHeader}>
            <Sparkles size={32} color={SolunaColors.warmGold} />
            <Text style={os.revealTitle}>Here's your Cosmic Blueprint</Text>
            <Text style={os.revealSub}>Four systems, one {name}. Here's what each lens sees — notice how they echo each other.</Text>
          </View>

          {/* Accuracy note — honest, driven by your real inputs */}
          <View style={os.accuracyCard}>
            <Clock size={14} color={SolunaColors.warmGold} />
            <View style={os.accuracyTextWrap}>
              <Text style={os.accuracyLine1}>
                {user?.birthTimeKnown ? "Exact birth time used — Rising, houses, and Human Design are precise." : "Birth time not provided — Rising sign, houses, and Human Design are approximate. You can add it anytime."}
              </Text>
              <Text style={os.accuracyLine2}>
                {user?.birthPlace ? `Based on ${user.birthPlace}` : (birthPlace ? `Based on ${birthPlace}` : "Birth location not set.")}
              </Text>
            </View>
          </View>

          <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={os.revealCardsContent} showsVerticalScrollIndicator={false}>
            {/* Astrology */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}>
                <Star size={18} color={SolunaColors.warmGold} />
                <Text style={os.revealCardTitle}>Astrology</Text>
              </View>
              <View style={os.bigThreeRow}>
                <View style={os.bigThreeItem}>
                  <Text style={os.btLabel}>Sun</Text>
                  <Text style={os.btSign}>{ZODIAC_SYMBOLS[chart.sun.sign]} {chart.sun.sign}</Text>
                  <Text style={os.btDesc}>{roleLine.Sun}</Text>
                </View>
                <View style={os.bigThreeItem}>
                  <Text style={os.btLabel}>Moon</Text>
                  <Text style={os.btSign}>{ZODIAC_SYMBOLS[chart.moon.sign]} {chart.moon.sign}</Text>
                  <Text style={os.btDesc}>{roleLine.Moon}</Text>
                </View>
                <View style={os.bigThreeItem}>
                  <Text style={os.btLabel}>Rising</Text>
                  <Text style={os.btSign}>{chart.rising ? `${ZODIAC_SYMBOLS[chart.rising]} ${chart.rising}` : "Needs birth time"}</Text>
                  <Text style={os.btDesc}>{roleLine.Rising}</Text>
                </View>
              </View>
            </View>

            {/* Numerology */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}><Hash size={18} color={SolunaColors.gentleLavender} /><Text style={os.revealCardTitle}>Numerology</Text></View>
              <View style={os.numRow}>
                <Text style={os.numBig}>{num.lifePath}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={os.numLabel}>Life Path {num.lifePath}{lifePathInfo?.title ? `: ${lifePathInfo.title}` : ""}</Text>
                  <Text style={os.numDesc}>{lifePathInfo?.description ? `${lifePathInfo.description.slice(0, 180)}…` : "The central theme of your journey."}</Text>
                </View>
              </View>
            </View>

            {/* Chinese */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}><Bird size={18} color={SolunaColors.softPeach} /><Text style={os.revealCardTitle}>Chinese Astrology</Text></View>
              <Text style={os.chineseMain}>{animal ? `${CHINESE_ANIMAL_EMOJI[animal] ?? ""} ` : ""}{elementAnimalLabel}</Text>
              <Text style={os.chineseDesc}>{chineseInfo?.description ? `${chineseInfo.description.slice(0, 150)}…` : "Your element and animal combine into a distinct temperament."}</Text>
            </View>

            {/* Human Design */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}><Cpu size={18} color={SolunaColors.warmGold} /><Text style={os.revealCardTitle}>Human Design</Text></View>
              <Text style={os.hdMain}>{hdType ?? "—"}</Text>
              <Text style={os.hdDesc}>{hdInfo?.description ? `${hdInfo.description.slice(0, 150)}…` : (user?.birthTimeKnown ? "How your energy works best." : "Add your birth time for your full Human Design.")}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={os.beginButton} onPress={handleBegin} activeOpacity={0.8}>
            <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.beginGradient}>
              <Text style={os.beginButtonText}>Enter Soluna</Text>
            </LinearGradient>
          </TouchableOpacity>
          {submitError ? <Text style={os.submitError}>{submitError}</Text> : null}
          {submitNotice ? <Text style={os.submitNotice}>{submitNotice}</Text> : null}
        </RNAnimated.View>
      </LinearGradient>
    );
  }

  // ─── Step Content ────────────────────────────────────
  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={os.gradient}>
      <ScrollView contentContainerStyle={os.scrollContent} keyboardShouldPersistTaps="handled">
        <RNAnimated.View style={[os.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {onboardingStep !== "welcome" && (
            <TouchableOpacity style={os.backButton} onPress={goBack}>
              <ChevronLeft size={22} color={SolunaColors.cream} />
            </TouchableOpacity>
          )}
          <StepIndicator current={currentStepIndex} total={TOTAL_STEPS} />

          {/* Welcome */}
          {onboardingStep === "welcome" && (
            <View style={os.stepContent}>
              <View style={os.logoWrap}>
                <View style={os.logoIconRow}><Sun size={36} color={SolunaColors.warmGold} /><Moon size={36} color={SolunaColors.gentleLavender} /></View>
                <Text style={os.logoText}>Soluna</Text>
              </View>
              <Text style={os.welcomePromise}>Astrology that's actually kind — and actually adds up.</Text>
              <Text style={os.welcomeDesc}>Four wisdom traditions, one deeply personal picture of you. Warm, honest, and never doom-toned. Ready to see yourself through a kinder lens?</Text>
              <TouchableOpacity style={os.primaryButton} onPress={goNext} activeOpacity={0.8}>
                <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={os.buttonText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Full Name */}
          {onboardingStep === "fullName" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>What's your full birth name?</Text>
              <Text style={os.stepSub}>Your birth name shapes your numerology — it's how we calculate your Life Path, Expression, and Soul Urge. No guesswork, just the real you.</Text>
              <View style={os.inputWrap}>
                <TextInput style={os.input} value={fullName} onChangeText={setFullName} placeholder="Your full birth name" placeholderTextColor={SolunaColors.creamSubtle} autoFocus />
              </View>
              <View style={{ height: 24 }} />
              <TouchableOpacity style={[os.primaryButton, !isFullNameValid && os.primaryButtonDisabled]} onPress={goNext} activeOpacity={0.8} disabled={!isFullNameValid}>
                <LinearGradient colors={isFullNameValid ? [SolunaColors.warmGold, SolunaColors.softPeach] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={[os.buttonText, !isFullNameValid && { color: SolunaColors.creamSubtle }]}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Preferred Name */}
          {onboardingStep === "preferredName" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>What should we call you?</Text>
              <Text style={os.stepSub}>A nickname or preferred name — this is what Soluna will call you. It's optional, but we think warm is better than formal.</Text>
              <View style={os.inputWrap}>
                <TextInput style={os.input} value={preferredName} onChangeText={setPreferredName} placeholder={fullName ? fullName.split(" ")[0] : "Your preferred name"} placeholderTextColor={SolunaColors.creamSubtle} autoFocus />
              </View>
              <View style={{ height: 24 }} />
              <TouchableOpacity style={[os.primaryButton, !isBirthTimeValid && os.primaryButtonDisabled]} onPress={goNext} activeOpacity={0.8} disabled={!isBirthTimeValid}>
                <LinearGradient colors={isBirthTimeValid ? [SolunaColors.warmGold, SolunaColors.softPeach] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={[os.buttonText, !isBirthTimeValid && { color: SolunaColors.creamSubtle }]}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
              {preferredName ? null : (
                <Text style={os.skipNote}>No worries — we'll use your first name if you skip</Text>
              )}
            </View>
          )}

          {/* Birth Date */}
          {onboardingStep === "birthdate" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>When were you born?</Text>
              <Text style={os.stepSub}>Your birth date anchors your Sun sign, Life Path, Chinese animal, and more — across all four systems. This is the one thing we really need.</Text>
              <View style={os.inputWrap}>
                <TextInput
                  style={[os.input, dateError ? { borderColor: SolunaColors.softPeach } : undefined]}
                  value={birthDateText}
                  onChangeText={parseAndSetDate}
                  placeholder="e.g. June 22, 1995"
                  placeholderTextColor={SolunaColors.creamSubtle}
                  autoFocus autoCorrect={false}
                />
                {dateError ? <Text style={os.dateError}>{dateError}</Text> : birthDate && (
                  <Text style={os.datePreview}>{formatDateLong(birthDate)}</Text>
                )}
              </View>
              <View style={{ height: 24 }} />
              <TouchableOpacity style={[os.primaryButton, !birthDate && os.primaryButtonDisabled]} onPress={goNext} activeOpacity={0.8} disabled={!birthDate}>
                <LinearGradient colors={birthDate ? [SolunaColors.warmGold, SolunaColors.softPeach] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={[os.buttonText, !birthDate && { color: SolunaColors.creamSubtle }]}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Birth Time */}
          {onboardingStep === "birthtime" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>Do you know your birth time?</Text>
              <Text style={os.stepSub}>
                {birthTimeKnown
                  ? "Your birth time makes your chart truly yours — it determines your Rising sign, house placements, and Human Design accuracy. It's usually on your birth certificate."
                  : "That's completely okay. Many people don't have it. We'll be gentle and transparent about what this affects, and you can add it anytime later."}
              </Text>

              {birthTimeKnown && (
                <View style={os.inputWrap}>
                  <TextInput
                    style={os.timeInput}
                    value={birthTime}
                    onChangeText={setBirthTime}
                    placeholder="HH:MM (e.g. 14:35)"
                    placeholderTextColor={SolunaColors.creamSubtle}
                    keyboardType="numbers-and-punctuation"
                    autoFocus
                  />
                </View>
              )}

              <TouchableOpacity style={os.dontKnowButton} onPress={() => setBirthTimeKnown(!birthTimeKnown)}>
                <Text style={os.dontKnowText}>
                  {birthTimeKnown ? "I don't know my birth time" : "Actually, I do know it"}
                </Text>
              </TouchableOpacity>

              {!birthTimeKnown && (
                <View style={os.unknownCard}>
                  <Star size={16} color={SolunaColors.warmGold} />
                  <View style={os.unknownTextWrap}>
                    <Text style={os.unknownTitle}>Here's what that affects — no judgment, just honesty</Text>
                    <Text style={os.unknownNote}>
                      Without your birth time, we'll use noon as an estimate. Your Rising sign, house placements, and Human Design will be approximate. Your Sun sign, Moon sign, Life Path, and Chinese animal are all still exact. You can always add your birth time later in Settings.
                    </Text>
                  </View>
                </View>
              )}

              <View style={{ height: 24 }} />
              <TouchableOpacity style={os.primaryButton} onPress={goNext} activeOpacity={0.8}>
                <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={os.buttonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Birth Place */}
          {onboardingStep === "birthplace" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>Where were you born?</Text>
              <Text style={os.stepSub}>Your birth city helps calculate your exact chart positions and time zone. Pick a real city from the list for the most precise results.</Text>
              <View style={os.inputWrap}>
                <TextInput
                  style={os.input}
                  value={placeSearch || birthPlace}
                  onChangeText={handleCitySearch}
                  onFocus={() => { if (birthPlace && !placeSearch) handleCitySearch(birthPlace); }}
                  placeholder="Search for your city…"
                  placeholderTextColor={SolunaColors.creamSubtle}
                />
                {/* Mock/demo: static city list */}
                {USE_MOCK_DATA && filteredCities.length > 0 && !isPlaceValid && (
                  <View style={os.cityDropdown}>
                    <Text style={os.cityDropdownHint}>Select from the list — this ensures accurate timezone data</Text>
                    {filteredCities.slice(0, 8).map((city) => (
                      <TouchableOpacity key={city} style={os.cityOption} onPress={() => selectCity(city)}>
                        <MapPin size={12} color={SolunaColors.creamSubtle} />
                        <Text style={os.cityOptionText}>{city}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {/* Live: real Google Places suggestions */}
                {!USE_MOCK_DATA && geoSuggestions.length > 0 && !resolvedPlace && (
                  <View style={os.cityDropdown}>
                    <Text style={os.cityDropdownHint}>Pick your city so we can resolve real coordinates + timezone</Text>
                    {geoSuggestions.slice(0, 6).map((s) => (
                      <TouchableOpacity key={s.id} style={os.cityOption} onPress={() => selectResolvedPlace(s)}>
                        <MapPin size={12} color={SolunaColors.creamSubtle} />
                        <Text style={os.cityOptionText}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {resolvingPlace && (
                  <View style={os.cityDropdown}>
                    <Text style={os.cityDropdownHint}>Resolving your birth place…</Text>
                  </View>
                )}
                {isPlaceValid && (
                  <View style={os.placeConfirmed}>
                    <Text style={os.placeConfirmedIcon}>✓</Text>
                    <Text style={os.placeConfirmedText}>{resolvedPlace?.label ?? birthPlace}</Text>
                    <TouchableOpacity onPress={() => { setBirthPlace(""); setPlaceSearch(""); setResolvedPlace(null); setGeoSuggestions([]); }}>
                      <Text style={os.placeChangeText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={{ height: 24 }} />
              {birthPlace && !isPlaceValid ? (
                <Text style={os.dateError}>Please choose a supported city from the list.</Text>
              ) : null}
              <TouchableOpacity style={[os.primaryButton, !isPlaceValid && os.primaryButtonDisabled]} onPress={handleWeave} activeOpacity={0.8} disabled={!isPlaceValid}>
                <LinearGradient colors={isPlaceValid ? [SolunaColors.warmGold, SolunaColors.softPeach] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={[os.buttonText, !isPlaceValid && { color: SolunaColors.creamSubtle }]}>Weave My Blueprint</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </RNAnimated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const os = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: SolunaSpacing.lg, paddingTop: Platform.OS === "ios" ? 80 : 60, paddingBottom: 40, alignItems: "center" },
  backButton: { position: "absolute", top: Platform.OS === "ios" ? 60 : 40, left: SolunaSpacing.md, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", zIndex: 10 },

  // Logo
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoIconRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  logoText: { fontFamily: Fonts.heading, fontSize: 42, color: SolunaColors.cream, letterSpacing: 2 },
  welcomePromise: { fontFamily: Fonts.heading, fontSize: 24, color: SolunaColors.cream, textAlign: "center", marginBottom: 16, lineHeight: 32 },
  welcomeDesc: { fontSize: 16, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 24, marginBottom: 40, maxWidth: 320, fontFamily: Fonts.body },

  // Steps
  stepContent: { alignItems: "center", marginTop: 32, width: "100%" },
  stepTitle: { fontFamily: Fonts.heading, fontSize: 26, color: SolunaColors.cream, textAlign: "center", marginBottom: 12, lineHeight: 34 },
  stepSub: { fontSize: 15, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 22, marginBottom: 32, maxWidth: 340, fontFamily: Fonts.body },

  // Input
  inputWrap: { width: "100%", maxWidth: 340, position: "relative", zIndex: 10 },
  input: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: SolunaRadius.md, paddingHorizontal: 20, paddingVertical: 16, fontSize: 18, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", fontFamily: Fonts.body },
  timeInput: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: SolunaRadius.md, paddingHorizontal: 20, paddingVertical: 16, fontSize: 32, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", textAlign: "center", fontFamily: Fonts.mono, letterSpacing: 4 },
  datePreview: { fontSize: 13, color: SolunaColors.creamMuted, marginTop: 8, textAlign: "center", fontStyle: "italic" },
  dateError: { fontSize: 13, color: SolunaColors.softPeach, marginTop: 8, textAlign: "center" },
  skipNote: { fontSize: 12, color: SolunaColors.creamSubtle, marginTop: 8, fontStyle: "italic", fontFamily: Fonts.body },

  // Button
  primaryButton: { borderRadius: SolunaRadius.lg, overflow: "hidden", width: "100%", maxWidth: 340, marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.5 },
  buttonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, paddingHorizontal: 32 },
  buttonText: { fontSize: 17, fontWeight: "600", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },

  // Birth time
  dontKnowButton: { paddingVertical: 12, paddingHorizontal: 20, marginBottom: 12 },
  dontKnowText: { fontSize: 15, color: SolunaColors.gentleLavender, textDecorationLine: "underline", fontFamily: Fonts.body },
  unknownCard: { flexDirection: "row", gap: 12, backgroundColor: "rgba(242,168,141,0.06)", borderRadius: SolunaRadius.md, padding: 14, borderWidth: 1, borderColor: "rgba(242,168,141,0.1)", marginBottom: 8 },
  unknownTextWrap: { flex: 1 },
  unknownTitle: { fontSize: 12, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 4 },
  unknownNote: { fontSize: 12, color: SolunaColors.creamSubtle, lineHeight: 18, fontFamily: Fonts.body },

  // City search
  cityDropdown: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "rgba(30,25,60,0.98)", borderRadius: SolunaRadius.md, marginTop: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden", zIndex: 20 },
  cityDropdownHint: { fontSize: 10, color: SolunaColors.creamSubtle, paddingHorizontal: 16, paddingVertical: 8, fontFamily: Fonts.body, fontStyle: "italic" },
  cityOption: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  cityOptionText: { fontSize: 15, color: SolunaColors.cream, fontFamily: Fonts.body },
  placeConfirmed: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(123,200,156,0.08)", borderRadius: SolunaRadius.md, paddingVertical: 10, paddingHorizontal: 14, marginTop: 8, borderWidth: 1, borderColor: "rgba(123,200,156,0.15)" },
  placeConfirmedIcon: { fontSize: 14, color: "#7BC89C", fontWeight: "700" },
  placeConfirmedText: { flex: 1, fontSize: 15, color: SolunaColors.cream, fontFamily: Fonts.body },
  placeChangeText: { fontSize: 12, color: SolunaColors.gentleLavender, fontFamily: Fonts.body },

  // Calculating
  calcContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  glyphsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  glyphText: { fontSize: 22, color: SolunaColors.warmGold },
  chartCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: "rgba(232,184,109,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  calcTitle: { fontFamily: Fonts.heading, fontSize: 22, color: SolunaColors.cream, marginBottom: 8 },
  calcSub: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 21, maxWidth: 280, fontFamily: Fonts.body },

  // Reveal
  revealHeader: { alignItems: "center", marginBottom: 16, marginTop: 20 },
  revealTitle: { fontFamily: Fonts.heading, fontSize: 26, color: SolunaColors.cream, marginTop: 14, marginBottom: 8, textAlign: "center" },
  revealSub: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 21, maxWidth: 320, fontFamily: Fonts.body },
  accuracyCard: { flexDirection: "row", gap: 10, backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.md, padding: 12, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 12, alignItems: "flex-start" },
  accuracyTextWrap: { flex: 1 },
  accuracyLine1: { fontSize: 11, color: SolunaColors.cream, fontFamily: Fonts.body, lineHeight: 16 },
  accuracyLine2: { fontSize: 10, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, marginTop: 3, fontStyle: "italic" },
  revealCardsContent: { gap: 10, paddingBottom: 24 },
  revealCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 18, borderWidth: 1, borderColor: SolunaColors.cardBorder },
  revealCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  revealCardTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  bigThreeRow: { gap: 8 },
  bigThreeItem: { marginBottom: 6 },
  btLabel: { fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 2 },
  btSign: { fontSize: 17, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 3 },
  btDesc: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18 },
  numRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  numBig: { fontSize: 38, fontWeight: "700", color: SolunaColors.gentleLavender, fontFamily: Fonts.heading },
  numLabel: { fontSize: 14, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 3 },
  numDesc: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18 },
  chineseMain: { fontSize: 22, fontFamily: Fonts.heading, color: SolunaColors.softPeach, marginBottom: 6 },
  chineseDesc: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18 },
  hdMain: { fontSize: 22, fontFamily: Fonts.heading, color: SolunaColors.warmGold, marginBottom: 6 },
  hdDesc: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18 },
  beginButton: { borderRadius: SolunaRadius.lg, overflow: "hidden", width: "100%", maxWidth: 280, marginTop: 10 },
  beginGradient: { paddingVertical: 16, alignItems: "center" },
  beginButtonText: { fontSize: 18, fontWeight: "600", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  submitError: { color: SolunaColors.softPeach, fontSize: 13, marginTop: 10, textAlign: "center", fontFamily: Fonts.body },
  submitNotice: { color: SolunaColors.creamMuted, fontSize: 13, marginTop: 10, textAlign: "center", fontFamily: Fonts.body },
});
