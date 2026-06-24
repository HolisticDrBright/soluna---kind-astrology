import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated as RNAnimated,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  MOCK_USER,
  CITIES,
  ZODIAC_SYMBOLS,
  BIG_THREE_DESCRIPTIONS,
  Fonts,
  type OnboardingStep,
} from "@/constants/mockData";
import { ChevronLeft, ChevronRight, Sparkles, Sun, Moon, Star } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Step Indicator ───────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            stepStyles.dot,
            i <= current ? stepStyles.dotActive : stepStyles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: SolunaColors.warmGold,
    width: 24,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});

// ─── Onboarding Screen ────────────────────────────────────────────
export default function OnboardingScreen() {
  const { onboardingStep, setOnboardingStep, completeOnboarding } =
    useAppState();

  const [name, setName] = useState("Maya");
  const [birthDate, setBirthDate] = useState(new Date(1995, 5, 22));
  const [birthTime, setBirthTime] = useState("14:35");
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [birthPlace, setBirthPlace] = useState("Portland, Oregon, USA");
  const [placeSearch, setPlaceSearch] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showCalculating, setShowCalculating] = useState(false);
  const [revealReady, setRevealReady] = useState(false);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;
  const calculatingAnim = useRef(new RNAnimated.Value(0)).current;
  const revealFade = useRef(new RNAnimated.Value(0)).current;

  const stepIndex: Record<OnboardingStep, number> = {
    welcome: 0,
    name: 1,
    birthdate: 2,
    birthtime: 3,
    birthplace: 4,
    calculating: 5,
    reveal: 6,
  };

  const currentStepIndex = stepIndex[onboardingStep];

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    animateIn();
  }, [onboardingStep, animateIn]);

  useEffect(() => {
    if (onboardingStep === "calculating") {
      RNAnimated.timing(calculatingAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setShowCalculating(false);
          setRevealReady(true);
          RNAnimated.timing(revealFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }, 500);
      });
    }
  }, [onboardingStep, calculatingAnim, revealFade]);

  const handleCitySearch = (text: string) => {
    setPlaceSearch(text);
    if (text.length > 1) {
      setFilteredCities(
        CITIES.filter((c) => c.toLowerCase().includes(text.toLowerCase())),
      );
    } else {
      setFilteredCities([]);
    }
  };

  const selectCity = (city: string) => {
    setBirthPlace(city);
    setPlaceSearch("");
    setFilteredCities([]);
  };

  const goNext = () => {
    const sequence: OnboardingStep[] = [
      "welcome",
      "name",
      "birthdate",
      "birthtime",
      "birthplace",
      "calculating",
      "reveal",
    ];
    const idx = sequence.indexOf(onboardingStep);
    if (idx < sequence.length - 1) {
      const next = sequence[idx + 1];
      if (next === "calculating") {
        setShowCalculating(true);
        setRevealReady(false);
      }
      setOnboardingStep(next);
    }
  };

  const goBack = () => {
    const sequence: OnboardingStep[] = [
      "welcome",
      "name",
      "birthdate",
      "birthtime",
      "birthplace",
      "calculating",
      "reveal",
    ];
    const idx = sequence.indexOf(onboardingStep);
    if (idx > 0) {
      setOnboardingStep(sequence[idx - 1]);
    }
  };

  const handleFinish = () => {
    completeOnboarding({
      name,
      birthDate: birthDate.toISOString().split("T")[0],
      birthTime,
      birthTimeKnown,
      birthPlace,
      chart: MOCK_USER.chart,
    });
    router.replace("/(tabs)");
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // ─── Calculating Screen ─────────────────────────────────────────
  if (showCalculating) {
    const { height: winH } = Dimensions.get("window");
    const starPositions: { top: number; left: number }[] = [
      { top: winH * 0.20, left: SCREEN_WIDTH * 0.30 },
      { top: winH * 0.40, left: SCREEN_WIDTH * 0.60 },
      { top: winH * 0.25, left: SCREEN_WIDTH * 0.70 },
      { top: winH * 0.55, left: SCREEN_WIDTH * 0.25 },
      { top: winH * 0.65, left: SCREEN_WIDTH * 0.55 },
      { top: winH * 0.35, left: SCREEN_WIDTH * 0.15 },
      { top: winH * 0.70, left: SCREEN_WIDTH * 0.75 },
      { top: winH * 0.15, left: SCREEN_WIDTH * 0.50 },
    ];

    return (
      <LinearGradient
        colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <RNAnimated.View
            style={[
              styles.calculatingContainer,
              {
                opacity: calculatingAnim,
                transform: [
                  {
                    scale: calculatingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {starPositions.map((pos, i) => (
              <RNAnimated.View
                key={i}
                style={[
                  styles.star,
                  {
                    top: pos.top,
                    left: pos.left,
                    opacity: calculatingAnim.interpolate({
                      inputRange: [i * 0.12, i * 0.12 + 0.2],
                      outputRange: [0, 1],
                      extrapolate: "clamp",
                    }),
                  },
                ]}
              >
                <Star
                  size={12 + Math.random() * 8}
                  color={SolunaColors.warmGold}
                  fill={SolunaColors.warmGold}
                />
              </RNAnimated.View>
            ))}
            <View style={styles.chartCircle}>
              <Sparkles size={48} color={SolunaColors.warmGold} />
            </View>
            <Text style={styles.calculatingTitle}>
              Mapping your stars…
            </Text>
            <Text style={styles.calculatingSub}>
              {name ? `${name}'s chart is coming together` : "Your chart is coming together"}
            </Text>
          </RNAnimated.View>
        </View>
      </LinearGradient>
    );
  }

  // ─── Reveal Screen ──────────────────────────────────────────────
  if (revealReady) {
    const chart = MOCK_USER.chart;
    return (
      <LinearGradient
        colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
        style={styles.gradient}
      >
        <RNAnimated.View
          style={[styles.content, { opacity: revealFade }]}
        >
          <View style={styles.revealHeader}>
            <Sparkles size={32} color={SolunaColors.warmGold} />
            <Text style={styles.revealTitle}>Here's your Big Three</Text>
            <Text style={styles.revealSub}>
              These three placements are the heart of your chart — your core self, your emotional world, and how you meet the world.
            </Text>
          </View>

          <View style={styles.bigThreeCards}>
            {/* Sun */}
            <View style={styles.bigThreeCard}>
              <View style={styles.bigThreeIconWrap}>
                <Sun size={28} color={SolunaColors.warmGold} />
              </View>
              <Text style={styles.bigThreeLabel}>Sun</Text>
              <Text style={styles.bigThreeSign}>
                {ZODIAC_SYMBOLS[chart.sun.sign]} {chart.sun.sign}
              </Text>
              <Text style={styles.bigThreeDesc}>
                {BIG_THREE_DESCRIPTIONS["Sun-Cancer"]}
              </Text>
            </View>

            {/* Moon */}
            <View style={styles.bigThreeCard}>
              <View style={styles.bigThreeIconWrap}>
                <Moon size={28} color={SolunaColors.gentleLavender} />
              </View>
              <Text style={styles.bigThreeLabel}>Moon</Text>
              <Text style={styles.bigThreeSign}>
                {ZODIAC_SYMBOLS[chart.moon.sign]} {chart.moon.sign}
              </Text>
              <Text style={styles.bigThreeDesc}>
                {BIG_THREE_DESCRIPTIONS["Moon-Pisces"]}
              </Text>
            </View>

            {/* Rising */}
            <View style={styles.bigThreeCard}>
              <View style={styles.bigThreeIconWrap}>
                <Star size={28} color={SolunaColors.softPeach} />
              </View>
              <Text style={styles.bigThreeLabel}>Rising</Text>
              <Text style={styles.bigThreeSign}>
                {ZODIAC_SYMBOLS[chart.rising]} {chart.rising}
              </Text>
              <Text style={styles.bigThreeDesc}>
                {BIG_THREE_DESCRIPTIONS["Rising-Libra"]}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.beginButton}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[SolunaColors.warmGold, SolunaColors.softPeach]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.beginGradient}
            >
              <Text style={styles.beginButtonText}>Begin</Text>
            </LinearGradient>
          </TouchableOpacity>
        </RNAnimated.View>
      </LinearGradient>
    );
  }

  // ─── Step Content ───────────────────────────────────────────────
  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <RNAnimated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Back button */}
          {onboardingStep !== "welcome" && (
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <ChevronLeft size={24} color={SolunaColors.cream} />
            </TouchableOpacity>
          )}

          {/* Step indicator */}
          <StepIndicator current={currentStepIndex} total={5} />

          {onboardingStep === "welcome" && (
            <View style={styles.stepContent}>
              <View style={styles.logoWrap}>
                <View style={styles.logoIconRow}>
                  <Sun size={36} color={SolunaColors.warmGold} />
                  <Moon size={36} color={SolunaColors.gentleLavender} />
                </View>
                <Text style={styles.logoText}>Soluna</Text>
              </View>
              <Text style={styles.welcomePromise}>
                Astrology that's actually kind.
              </Text>
              <Text style={styles.welcomeDesc}>
                A warm, personal companion for understanding yourself through the stars — without the fear, the jargon, or the doom.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[SolunaColors.warmGold, SolunaColors.softPeach]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                  <ChevronRight size={20} color={SolunaColors.deepIndigo} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "name" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>First, what should we call you?</Text>
              <Text style={styles.stepSub}>
                Your name makes this personal — because this is about you.
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={SolunaColors.creamSubtle}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, !name && styles.primaryButtonDisabled]}
                onPress={goNext}
                activeOpacity={0.8}
                disabled={!name}
              >
                <LinearGradient
                  colors={
                    name
                      ? [SolunaColors.warmGold, SolunaColors.softPeach]
                      : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      !name && { color: SolunaColors.creamSubtle },
                    ]}
                  >
                    Continue
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "birthdate" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                When were you born, {name || "friend"}?
              </Text>
              <Text style={styles.stepSub}>
                Your birth date anchors your Sun sign and so much more.
              </Text>

              {/* Simple date picker UI */}
              <View style={styles.datePickerWrap}>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => {
                    const d = new Date(birthDate);
                    d.setDate(d.getDate() - 1);
                    setBirthDate(d);
                  }}
                >
                  <ChevronLeft size={20} color={SolunaColors.cream} />
                </TouchableOpacity>

                <View style={styles.dateDisplay}>
                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date(birthDate);
                      d.setFullYear(d.getFullYear() - 1);
                      setBirthDate(d);
                    }}
                  >
                    <Text style={styles.dateSmall}>▲</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateMain}>{formatDate(birthDate)}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date(birthDate);
                      d.setFullYear(d.getFullYear() + 1);
                      setBirthDate(d);
                    }}
                  >
                    <Text style={styles.dateSmall}>▼</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => {
                    const d = new Date(birthDate);
                    d.setDate(d.getDate() + 1);
                    setBirthDate(d);
                  }}
                >
                  <ChevronRight size={20} color={SolunaColors.cream} />
                </TouchableOpacity>
              </View>

              <View style={styles.signPreview}>
                <Text style={styles.signPreviewText}>
                  Your Sun sign would be{" "}
                  <Text style={styles.signPreviewBold}>
                    {(() => {
                      const m = birthDate.getMonth() + 1;
                      const d = birthDate.getDate();
                      if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "Aries ♈";
                      if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "Taurus ♉";
                      if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "Gemini ♊";
                      if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "Cancer ♋";
                      if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "Leo ♌";
                      if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "Virgo ♍";
                      if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "Libra ♎";
                      if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "Scorpio ♏";
                      if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "Sagittarius ♐";
                      if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "Capricorn ♑";
                      if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "Aquarius ♒";
                      return "Pisces ♓";
                    })()}
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[SolunaColors.warmGold, SolunaColors.softPeach]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "birthtime" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                Do you know your birth time?
              </Text>
              <Text style={styles.stepSub}>
                It's what makes your chart truly yours — it determines your Rising sign and house placements. But if you don't know, that's okay too.
              </Text>

              {birthTimeKnown && (
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.timeInput}
                    value={birthTime}
                    onChangeText={setBirthTime}
                    placeholder="HH:MM (e.g. 14:35)"
                    placeholderTextColor={SolunaColors.creamSubtle}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.dontKnowButton}
                onPress={() => setBirthTimeKnown(!birthTimeKnown)}
              >
                <Text style={styles.dontKnowText}>
                  {birthTimeKnown
                    ? "I don't know my birth time"
                    : "Actually, I do know it"}
                </Text>
              </TouchableOpacity>

              {!birthTimeKnown && (
                <Text style={styles.unknownNote}>
                  No worries — we'll use noon as an estimate. Some features work best with an exact time, and we'll gently let you know which ones.
                </Text>
              )}

              <View style={styles.spacer} />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[SolunaColors.warmGold, SolunaColors.softPeach]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "birthplace" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Where were you born?</Text>
              <Text style={styles.stepSub}>
                Your birth city helps us calculate your exact chart positions.
              </Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={placeSearch || birthPlace}
                  onChangeText={handleCitySearch}
                  onFocus={() => handleCitySearch(birthPlace)}
                  placeholder="Search for your city…"
                  placeholderTextColor={SolunaColors.creamSubtle}
                />

                {filteredCities.length > 0 && (
                  <View style={styles.cityDropdown}>
                    {filteredCities.slice(0, 6).map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={styles.cityOption}
                        onPress={() => selectCity(city)}
                      >
                        <Text style={styles.cityOptionText}>{city}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.spacer} />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[SolunaColors.warmGold, SolunaColors.softPeach]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Calculate My Chart</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </RNAnimated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SolunaSpacing.lg,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: SolunaSpacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  // Welcome
  logoWrap: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoIconRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  logoText: {
    fontFamily: Fonts.heading,
    fontSize: 42,
    color: SolunaColors.cream,
    letterSpacing: 2,
  },
  welcomePromise: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: SolunaColors.cream,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  welcomeDesc: {
    fontSize: 16,
    color: SolunaColors.creamMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  // Steps
  stepContent: {
    alignItems: "center",
    marginTop: 32,
    width: "100%",
  },
  stepTitle: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    color: SolunaColors.cream,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },
  stepSub: {
    fontSize: 15,
    color: SolunaColors.creamMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  // Inputs
  inputWrap: {
    width: "100%",
    maxWidth: 340,
    position: "relative",
    zIndex: 10,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: SolunaRadius.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: SolunaColors.cream,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontFamily: Fonts.body,
  },
  timeInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: SolunaRadius.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 32,
    color: SolunaColors.cream,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    textAlign: "center",
    fontFamily: Fonts.mono,
    letterSpacing: 4,
  },
  // Date picker
  datePickerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dateBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateDisplay: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  dateMain: {
    fontSize: 16,
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
    paddingVertical: 8,
  },
  dateSmall: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
  },
  signPreview: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    marginBottom: 32,
  },
  signPreviewText: {
    fontSize: 15,
    color: SolunaColors.creamMuted,
    textAlign: "center",
  },
  signPreviewBold: {
    color: SolunaColors.warmGold,
    fontFamily: Fonts.heading,
    fontSize: 16,
  },
  // Buttons
  primaryButton: {
    borderRadius: SolunaRadius.lg,
    overflow: "hidden",
    width: "100%",
    maxWidth: 340,
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: SolunaColors.deepIndigo,
    fontFamily: Fonts.body,
  },
  dontKnowButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dontKnowText: {
    fontSize: 15,
    color: SolunaColors.gentleLavender,
    textDecorationLine: "underline",
    fontFamily: Fonts.body,
  },
  unknownNote: {
    fontSize: 13,
    color: SolunaColors.creamSubtle,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
    fontStyle: "italic",
  },
  spacer: {
    height: 24,
  },
  // City dropdown
  cityDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "rgba(30, 25, 60, 0.98)",
    borderRadius: SolunaRadius.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    zIndex: 20,
  },
  cityOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  cityOptionText: {
    fontSize: 15,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  // Calculating
  calculatingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  star: {
    position: "absolute",
  },
  chartCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(232, 184, 109, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  calculatingTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: SolunaColors.cream,
    marginBottom: 8,
  },
  calculatingSub: {
    fontSize: 16,
    color: SolunaColors.creamMuted,
  },
  // Reveal
  revealHeader: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  revealTitle: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: SolunaColors.cream,
    marginTop: 16,
    marginBottom: 12,
  },
  revealSub: {
    fontSize: 15,
    color: SolunaColors.creamMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  bigThreeCards: {
    gap: 16,
    width: "100%",
    maxWidth: 360,
    marginBottom: 32,
  },
  bigThreeCard: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    alignItems: "center",
  },
  bigThreeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bigThreeLabel: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  bigThreeSign: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: SolunaColors.cream,
    marginBottom: 8,
  },
  bigThreeDesc: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  beginButton: {
    borderRadius: SolunaRadius.lg,
    overflow: "hidden",
    width: "100%",
    maxWidth: 280,
  },
  beginGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  beginButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: SolunaColors.deepIndigo,
    fontFamily: Fonts.body,
  },
});
