import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated as RNAnimated, Platform, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { MOCK_USER, CITIES, ZODIAC_SYMBOLS, BIG_THREE_DESCRIPTIONS, CHINESE_ANIMAL_EMOJI, Fonts, type OnboardingStep, NUMBER_MEANINGS } from "@/constants/mockData";
import { ChevronLeft, ChevronRight, Sparkles, Sun, Moon, Star, Hash, Bird, Cpu } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={siS.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[siS.dot, i <= current ? siS.dotActive : siS.dotInactive]} />
      ))}
    </View>
  );
}
const siS = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: SolunaColors.warmGold, width: 24 },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.15)" },
});

export default function OnboardingScreen() {
  const { onboardingStep, setOnboardingStep, completeOnboarding } = useAppState();
  const [fullName, setFullName] = useState("Maya Elizabeth Chen");
  const [preferredName, setPreferredName] = useState("Maya");
  const [birthDate, setBirthDate] = useState(new Date(1995, 5, 22));
  const [birthDateText, setBirthDateText] = useState("June 22, 1995");
  const [dateError, setDateError] = useState("");
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

  const stepIndex: Record<OnboardingStep, number> = { welcome: 0, fullName: 1, preferredName: 2, birthdate: 3, birthtime: 4, birthplace: 5, calculating: 6, reveal: 7 };
  const currentStepIndex = stepIndex[onboardingStep];

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0); slideAnim.setValue(30);
    RNAnimated.parallel([RNAnimated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }), RNAnimated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: false })]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => { animateIn(); }, [onboardingStep, animateIn]);

  useEffect(() => {
    if (onboardingStep === "calculating") {
      RNAnimated.timing(calculatingAnim, { toValue: 1, duration: 2000, useNativeDriver: false }).start(() => {
        setTimeout(() => {
          setShowCalculating(false); setRevealReady(true);
          RNAnimated.timing(revealFade, { toValue: 1, duration: 600, useNativeDriver: false }).start();
        }, 500);
      });
    }
  }, [onboardingStep, calculatingAnim, revealFade]);

  const handleCitySearch = (text: string) => {
    setPlaceSearch(text);
    setFilteredCities(text.length > 1 ? CITIES.filter((c) => c.toLowerCase().includes(text.toLowerCase())) : []);
  };
  const selectCity = (city: string) => { setBirthPlace(city); setPlaceSearch(""); setFilteredCities([]); };

  const goNext = () => {
    const sequence: OnboardingStep[] = ["welcome", "fullName", "preferredName", "birthdate", "birthtime", "birthplace", "calculating", "reveal"];
    const idx = sequence.indexOf(onboardingStep);
    if (idx < sequence.length - 1) {
      const next = sequence[idx + 1];
      if (next === "calculating") { setShowCalculating(true); setRevealReady(false); }
      setOnboardingStep(next);
    }
  };
  const goBack = () => {
    const sequence: OnboardingStep[] = ["welcome", "fullName", "preferredName", "birthdate", "birthtime", "birthplace", "calculating", "reveal"];
    const idx = sequence.indexOf(onboardingStep);
    if (idx > 0) setOnboardingStep(sequence[idx - 1]);
  };

  const handleFinish = () => {
    completeOnboarding({
      fullName,
      preferredName: preferredName || fullName.split(" ")[0],
      birthDate: birthDate.toISOString().split("T")[0],
      birthTime,
      birthTimeKnown,
      birthPlace,
      chart: MOCK_USER.chart,
      numerology: MOCK_USER.numerology,
      chinese: MOCK_USER.chinese,
      humanDesign: MOCK_USER.humanDesign,
    });
    router.replace("/(tabs)");
  };

  const formatDateLong = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const parseAndSetDate = (text: string) => {
    setBirthDateText(text);
    setDateError("");
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    // Try multiple formats
    let parsed: Date | null = null;
    // MM/DD/YYYY or M/D/YYYY
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [_, m, d, y] = slashMatch;
      parsed = new Date(+y, +m - 1, +d);
    }
    // YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!parsed && isoMatch) {
      const [_, y, m, d] = isoMatch;
      parsed = new Date(+y, +m - 1, +d);
    }
    // Natural: "June 22, 1995" or "22 June 1995"
    if (!parsed) {
      parsed = new Date(trimmed);
    }
    if (parsed && !isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2025) {
      setBirthDate(parsed);
      setBirthDateText(parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
      setDateError("");
    } else if (trimmed.length >= 3) {
      setDateError("Try a format like 'June 22, 1995' or '06/22/1995'");
    }
  };

  const handleDateBlur = () => {
    // Reformat to canonical display
    if (!dateError) {
      setBirthDateText(birthDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
    }
  };

  // Calculating screen
  if (showCalculating) {
    const { height: winH } = Dimensions.get("window");
    const glyphs = ["☉", "☽", "☆", "3", "🐖", "⚡"];
    const positions = glyphs.map((_, i) => ({
      top: winH * 0.2 + (i * winH * 0.08), left: SCREEN_WIDTH * (0.2 + (i % 3) * 0.25),
    }));
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={os.gradient}>
        <View style={os.content}>
          <RNAnimated.View style={[os.calcContainer, { opacity: calculatingAnim, transform: [{ scale: calculatingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
            {positions.map((pos, i) => (
              <RNAnimated.View key={i} style={[os.glyphStar, { top: pos.top, left: pos.left, opacity: calculatingAnim.interpolate({ inputRange: [i * 0.1, i * 0.1 + 0.2], outputRange: [0, 1], extrapolate: "clamp" }) }]}>
                <Text style={os.glyphStarText}>{glyphs[i]}</Text>
              </RNAnimated.View>
            ))}
            <View style={os.chartCircle}><Sparkles size={48} color={SolunaColors.warmGold} /></View>
            <Text style={os.calcTitle}>Weaving your blueprint…</Text>
            <Text style={os.calcSub}>{preferredName ? `${preferredName}'s cosmic design is coming together` : "Your cosmic design is coming together"}</Text>
          </RNAnimated.View>
        </View>
      </LinearGradient>
    );
  }

  // Reveal screen
  if (revealReady) {
    const chart = MOCK_USER.chart;
    const num = MOCK_USER.numerology;
    const ch = MOCK_USER.chinese;
    const hd = MOCK_USER.humanDesign;
    const lifePathInfo = NUMBER_MEANINGS[num.lifePath];
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={os.gradient}>
        <RNAnimated.View style={[os.content, { opacity: revealFade }]}>
          <View style={os.revealHeader}>
            <Sparkles size={32} color={SolunaColors.warmGold} />
            <Text style={os.revealTitle}>Here's your Cosmic Blueprint</Text>
            <Text style={os.revealSub}>Four systems, one you. Here's what each lens sees — notice how they echo each other.</Text>
          </View>
          <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ gap: 12, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {/* Astrology */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}>
                <Star size={20} color={SolunaColors.warmGold} />
                <Text style={os.revealCardTitle}>Astrology</Text>
              </View>
              <View style={os.bigThreeRow}>
                <View style={os.bigThreeItem}><Text style={os.btLabel}>Sun</Text><Text style={os.btSign}>{ZODIAC_SYMBOLS[chart.sun.sign]} {chart.sun.sign}</Text><Text style={os.btDesc}>{BIG_THREE_DESCRIPTIONS["Sun-Cancer"]}</Text></View>
                <View style={os.bigThreeItem}><Text style={os.btLabel}>Moon</Text><Text style={os.btSign}>{ZODIAC_SYMBOLS[chart.moon.sign]} {chart.moon.sign}</Text><Text style={os.btDesc}>{BIG_THREE_DESCRIPTIONS["Moon-Pisces"]}</Text></View>
                <View style={os.bigThreeItem}><Text style={os.btLabel}>Rising</Text><Text style={os.btSign}>{ZODIAC_SYMBOLS[chart.rising]} {chart.rising}</Text><Text style={os.btDesc}>{BIG_THREE_DESCRIPTIONS["Rising-Libra"]}</Text></View>
              </View>
            </View>
            {/* Numerology */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}><Hash size={20} color={SolunaColors.gentleLavender} /><Text style={os.revealCardTitle}>Numerology</Text></View>
              <View style={os.numRow}><Text style={os.numBig}>{num.lifePath}</Text><View style={{ flex: 1 }}><Text style={os.numLabel}>Life Path {num.lifePath}: {lifePathInfo?.title || ""}</Text><Text style={os.numDesc}>{num.lifePathMeaning}</Text></View></View>
            </View>
            {/* Chinese */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}><Bird size={20} color={SolunaColors.softPeach} /><Text style={os.revealCardTitle}>Chinese Astrology</Text></View>
              <Text style={os.chineseMain}>{CHINESE_ANIMAL_EMOJI[ch.animal]} {ch.elementAnimalLabel}</Text>
              <Text style={os.chineseDesc}>{ch.description.slice(0, 150)}…</Text>
            </View>
            {/* Human Design */}
            <View style={os.revealCard}>
              <View style={os.revealCardHeader}><Cpu size={20} color={SolunaColors.warmGold} /><Text style={os.revealCardTitle}>Human Design</Text></View>
              <Text style={os.hdMain}>{hd.type}</Text>
              <Text style={os.hdDesc}>{hd.typeDescription.slice(0, 150)}…</Text>
            </View>
          </ScrollView>
          <TouchableOpacity style={os.beginButton} onPress={handleFinish} activeOpacity={0.8}>
            <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.beginGradient}>
              <Text style={os.beginButtonText}>Begin</Text>
            </LinearGradient>
          </TouchableOpacity>
        </RNAnimated.View>
      </LinearGradient>
    );
  }

  // Step content
  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={os.gradient}>
      <ScrollView contentContainerStyle={os.scrollContent} keyboardShouldPersistTaps="handled">
        <RNAnimated.View style={[os.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {onboardingStep !== "welcome" && (
            <TouchableOpacity style={os.backButton} onPress={goBack}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>
          )}
          <StepIndicator current={currentStepIndex} total={6} />

          {onboardingStep === "welcome" && (
            <View style={os.stepContent}>
              <View style={os.logoWrap}>
                <View style={os.logoIconRow}><Sun size={36} color={SolunaColors.warmGold} /><Moon size={36} color={SolunaColors.gentleLavender} /></View>
                <Text style={os.logoText}>Soluna</Text>
              </View>
              <Text style={os.welcomePromise}>Astrology that's actually kind — and actually adds up.</Text>
              <Text style={os.welcomeDesc}>Four wisdom traditions, one deeply personal picture of you. Warm, honest, and never doom-toned.</Text>
              <TouchableOpacity style={os.primaryButton} onPress={goNext} activeOpacity={0.8}>
                <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={os.buttonText}>Get Started</Text><ChevronRight size={20} color={SolunaColors.deepIndigo} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "fullName" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>What's your full birth name?</Text>
              <Text style={os.stepSub}>Your full birth name shapes your numerology — it's how we calculate your Life Path, Expression, and Soul Urge numbers.</Text>
              <View style={os.inputWrap}><TextInput style={os.input} value={fullName} onChangeText={setFullName} placeholder="Your full birth name" placeholderTextColor={SolunaColors.creamSubtle} autoFocus /></View>
              <TouchableOpacity style={[os.primaryButton, !fullName && os.primaryButtonDisabled]} onPress={goNext} activeOpacity={0.8} disabled={!fullName}>
                <LinearGradient colors={fullName ? [SolunaColors.warmGold, SolunaColors.softPeach] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={[os.buttonText, !fullName && { color: SolunaColors.creamSubtle }]}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "preferredName" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>What should we call you?</Text>
              <Text style={os.stepSub}>A nickname or preferred name. This is what Soluna will call you — warm and personal.</Text>
              <View style={os.inputWrap}><TextInput style={os.input} value={preferredName} onChangeText={setPreferredName} placeholder="Your preferred name" placeholderTextColor={SolunaColors.creamSubtle} autoFocus /></View>
              <TouchableOpacity style={[os.primaryButton, !preferredName && os.primaryButtonDisabled]} onPress={goNext} activeOpacity={0.8} disabled={!preferredName}>
                <LinearGradient colors={preferredName ? [SolunaColors.warmGold, SolunaColors.softPeach] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}>
                  <Text style={[os.buttonText, !preferredName && { color: SolunaColors.creamSubtle }]}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "birthdate" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>When were you born?</Text>
              <Text style={os.stepSub}>Your birth date anchors your Sun sign, Life Path, Chinese animal, and more — across all four systems.</Text>
              <View style={os.inputWrap}>
                <TextInput
                  style={[os.input, dateError ? { borderColor: SolunaColors.softPeach } : undefined]}
                  value={birthDateText}
                  onChangeText={parseAndSetDate}
                  onBlur={handleDateBlur}
                  placeholder="e.g. June 22, 1995"
                  placeholderTextColor={SolunaColors.creamSubtle}
                  autoFocus
                  autoCorrect={false}
                />
                {dateError ? <Text style={os.dateError}>{dateError}</Text> : (
                  <Text style={os.datePreview}>{formatDateLong(birthDate)}</Text>
                )}
              </View>
              <TouchableOpacity style={os.primaryButton} onPress={goNext} activeOpacity={0.8}>
                <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}><Text style={os.buttonText}>Continue</Text></LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "birthtime" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>Do you know your birth time?</Text>
              <Text style={os.stepSub}>It's what makes your chart truly yours — it determines your Rising sign, house placements, and Human Design accuracy. But if you don't know, we'll be honest about what that affects.</Text>
              {birthTimeKnown && (<View style={os.inputWrap}><TextInput style={os.timeInput} value={birthTime} onChangeText={setBirthTime} placeholder="HH:MM (e.g. 14:35)" placeholderTextColor={SolunaColors.creamSubtle} keyboardType="numbers-and-punctuation" /></View>)}
              <TouchableOpacity style={os.dontKnowButton} onPress={() => setBirthTimeKnown(!birthTimeKnown)}><Text style={os.dontKnowText}>{birthTimeKnown ? "I don't know my birth time" : "Actually, I do know it"}</Text></TouchableOpacity>
              {!birthTimeKnown && <Text style={os.unknownNote}>No worries — some features need an exact time, and we'll gently note that instead of guessing. Your Rising sign and House placements will be approximate.</Text>}
              <View style={{ height: 24 }} />
              <TouchableOpacity style={os.primaryButton} onPress={goNext} activeOpacity={0.8}>
                <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}><Text style={os.buttonText}>Continue</Text></LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === "birthplace" && (
            <View style={os.stepContent}>
              <Text style={os.stepTitle}>Where were you born?</Text>
              <Text style={os.stepSub}>Your birth city helps calculate your exact chart positions and time zone.</Text>
              <View style={os.inputWrap}>
                <TextInput style={os.input} value={placeSearch || birthPlace} onChangeText={handleCitySearch} onFocus={() => handleCitySearch(birthPlace)} placeholder="Search for your city…" placeholderTextColor={SolunaColors.creamSubtle} />
                {filteredCities.length > 0 && (
                  <View style={os.cityDropdown}>
                    {filteredCities.slice(0, 6).map((city) => (
                      <TouchableOpacity key={city} style={os.cityOption} onPress={() => selectCity(city)}><Text style={os.cityOptionText}>{city}</Text></TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={{ height: 24 }} />
              <TouchableOpacity style={os.primaryButton} onPress={goNext} activeOpacity={0.8}>
                <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.buttonGradient}><Text style={os.buttonText}>Weave My Blueprint</Text></LinearGradient>
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
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoIconRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  logoText: { fontFamily: Fonts.heading, fontSize: 42, color: SolunaColors.cream, letterSpacing: 2 },
  welcomePromise: { fontFamily: Fonts.heading, fontSize: 24, color: SolunaColors.cream, textAlign: "center", marginBottom: 16, lineHeight: 32 },
  welcomeDesc: { fontSize: 16, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 24, marginBottom: 40, maxWidth: 320 },
  stepContent: { alignItems: "center", marginTop: 32, width: "100%" },
  stepTitle: { fontFamily: Fonts.heading, fontSize: 26, color: SolunaColors.cream, textAlign: "center", marginBottom: 12, lineHeight: 34 },
  stepSub: { fontSize: 15, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 22, marginBottom: 32, maxWidth: 340 },
  inputWrap: { width: "100%", maxWidth: 340, position: "relative", zIndex: 10 },
  input: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: SolunaRadius.md, paddingHorizontal: 20, paddingVertical: 16, fontSize: 18, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", fontFamily: Fonts.body },
  timeInput: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: SolunaRadius.md, paddingHorizontal: 20, paddingVertical: 16, fontSize: 32, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", textAlign: "center", fontFamily: Fonts.mono, letterSpacing: 4 },
  datePreview: { fontSize: 13, color: SolunaColors.creamMuted, marginTop: 8, textAlign: "center", fontStyle: "italic" },
  dateError: { fontSize: 13, color: SolunaColors.softPeach, marginTop: 8, textAlign: "center" },
  primaryButton: { borderRadius: SolunaRadius.lg, overflow: "hidden", width: "100%", maxWidth: 340, marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.5 },
  buttonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, paddingHorizontal: 32 },
  buttonText: { fontSize: 17, fontWeight: "600", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  dontKnowButton: { paddingVertical: 12, paddingHorizontal: 20, marginBottom: 12 },
  dontKnowText: { fontSize: 15, color: SolunaColors.gentleLavender, textDecorationLine: "underline", fontFamily: Fonts.body },
  unknownNote: { fontSize: 13, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 20, maxWidth: 300, fontStyle: "italic" },
  cityDropdown: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "rgba(30,25,60,0.98)", borderRadius: SolunaRadius.md, marginTop: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden", zIndex: 20 },
  cityOption: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  cityOptionText: { fontSize: 15, color: SolunaColors.cream, fontFamily: Fonts.body },
  // Calculating
  calcContainer: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  glyphStar: { position: "absolute" },
  glyphStarText: { fontSize: 28, color: SolunaColors.warmGold },
  chartCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "rgba(232,184,109,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  calcTitle: { fontFamily: Fonts.heading, fontSize: 24, color: SolunaColors.cream, marginBottom: 8 },
  calcSub: { fontSize: 16, color: SolunaColors.creamMuted },
  // Reveal
  revealHeader: { alignItems: "center", marginBottom: 24, marginTop: 20 },
  revealTitle: { fontFamily: Fonts.heading, fontSize: 26, color: SolunaColors.cream, marginTop: 16, marginBottom: 8, textAlign: "center" },
  revealSub: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 21, maxWidth: 320 },
  revealCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder },
  revealCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  revealCardTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  bigThreeRow: { gap: 10 },
  bigThreeItem: { marginBottom: 8 },
  btLabel: { fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 2 },
  btSign: { fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  btDesc: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18 },
  numRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  numBig: { fontSize: 40, fontWeight: "700", color: SolunaColors.gentleLavender, fontFamily: Fonts.heading },
  numLabel: { fontSize: 15, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 4 },
  numDesc: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19 },
  chineseMain: { fontSize: 24, fontFamily: Fonts.heading, color: SolunaColors.softPeach, marginBottom: 8 },
  chineseDesc: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19 },
  hdMain: { fontSize: 24, fontFamily: Fonts.heading, color: SolunaColors.warmGold, marginBottom: 8 },
  hdDesc: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19 },
  beginButton: { borderRadius: SolunaRadius.lg, overflow: "hidden", width: "100%", maxWidth: 280, marginTop: 16 },
  beginGradient: { paddingVertical: 16, alignItems: "center" },
  beginButtonText: { fontSize: 18, fontWeight: "600", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
});
