import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useCallback, useMemo } from "react";
import SolunaColors from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  Fonts,
  DAILY_READINGS,
  ZODIAC_SYMBOLS,
  PLANET_SYMBOLS,
  MOOD_OPTIONS,
  type MoodSupport,
} from "@/constants/mockData";
import type { DailyReading } from "@/constants/mockData";
import InsightActionBar from "@/components/InsightActionBar";
import ConfidencePill from "@/components/ConfidencePill";
import SolunaShiftCard from "@/components/SolunaShiftCard";
import type { ConfidenceLevel } from "@/components/ConfidencePill";
import { ChevronDown, ChevronUp } from "lucide-react-native";

// ─── Section IDs for accordion ──────────────────────────────────
type SectionKey = "cosmic" | "tarot" | "energy" | "affirm" | "dwell";

export default function TodayScreen() {
  const { user } = useAppState();
  if (!user) return null;

  const todayStr = "2026-06-24";
  const todayReading: DailyReading =
    DAILY_READINGS.find((r) => r.date === todayStr) ?? DAILY_READINGS[0];

  const [saved, setSaved] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [selectedWhySystem, setSelectedWhySystem] = useState<string | null>(null);
  const [moodSupport, setMoodSupport] = useState<MoodSupport | null>(null);
  const [expanded, setExpanded] = useState<Set<SectionKey>>(
    new Set<SectionKey>(),
  );

  const handleSave = useCallback(() => setSaved(true), []);

  const toggleExpanded = useCallback((key: SectionKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const confidenceLevel: ConfidenceLevel = useMemo(() => {
    if (!user.birthTimeKnown) return "needsBirthTime";
    if (user.chart && user.chart.placements.length >= 8) return "exact";
    return "approximate";
  }, [user.birthTimeKnown, user.chart]);

  const bigThree = useMemo(() => {
    if (!user.chart) return null;
    return [
      { label: "Sun", sign: user.chart.sun.sign, emoji: ZODIAC_SYMBOLS[user.chart.sun.sign] },
      { label: "Moon", sign: user.chart.moon.sign, emoji: ZODIAC_SYMBOLS[user.chart.moon.sign] },
      { label: "Rising", sign: user.chart.rising, emoji: ZODIAC_SYMBOLS[user.chart.rising] },
    ];
  }, [user.chart]);

  const coreNumbers = useMemo(() => {
    if (!user.numerology) return null;
    return [
      { label: "Life Path", value: user.numerology.lifePath },
      { label: "Expression", value: user.numerology.expression },
      { label: "Soul Urge", value: user.numerology.soulUrge },
    ];
  }, [user.numerology]);

  // ─── System chip labels for explainability ────────
  const systemChipExplanations: Record<string, string> = {
    "Moon in Cancer": "Your natal Moon is in Cancer, so when the transiting Moon moves through Cancer, you feel it deeply — emotions are closer to the surface, and your need for safety and nurturing is heightened today.",
    "Personal Day 7": "Today's date reduces to the number 7 in your personal numerology cycle. Personal Day 7 is always about introspection, spiritual connection, and trusting what you can't yet see.",
    "Generator Sacral": "As a Generator in Human Design, your Sacral center responds to life with clear yes/no signals. When multiple systems say 'rest,' your Sacral is underlining the message: wait to respond, don't force.",
    "Sun in 12th House": "Your natal Sun in the 12th house creates a direct channel to your subconscious. On days when transits activate this house, creative inspiration and intuitive downloads flow more freely.",
    "Life Path 3": "Your Life Path 3 is the Creative Communicator — expression is your purpose. When this number is highlighted, it's a signal to share what's inside you, even if it feels vulnerable.",
    "Wood Pig": "In Chinese astrology, the Wood Pig brings generous, warm-hearted optimism. When this sign is active in your daily reading, it amplifies your natural ability to uplift others.",
    "Full Moon 8H": "The Full Moon illuminating your 8th house activates themes of transformation, emotional release, and intimacy. What needs to be felt fully before it can be released?",
    "Soul Urge 9": "Your Soul Urge 9 is the humanitarian — you feel the world deeply. When this number is highlighted, emotional processing isn't a detour; it IS the path.",
    "Emotional Authority": "Your Human Design Emotional Authority means clarity comes through feeling the full wave of your emotions over time. Don't decide in the moment — let the wave rise and fall.",
    "Moon Waning Virgo": "The waning Moon in Virgo supports reflection, gentle order, and releasing what no longer serves. A beautiful day for quiet completions.",
    "Expression 7": "Your Expression number 7 thrives in depth, analysis, and solitude. When highlighted, it's a signal to honor your need for quiet reflection.",
    "6/2 Hermit": "Your 6/2 profile's Hermit line literally needs alone time to function at its best. This isn't antisocial — it's design maintenance.",
    "Venus 10H": "Venus transiting your 10th house makes you magnetically warm in professional and public spaces. People are drawn to you now — trust that.",
    "Generator": "As a Generator, your defined Sacral center provides sustainable creative energy when you're aligned. Frustration is the signal you've drifted — satisfaction is the signal you're on track.",
    "Moon in Leo": "The Moon in Leo activates bold, radiant energy. It's a day for being seen, for sharing your light, for trusting that your presence is a gift.",
    "Personal Day 9": "Personal Day 9 brings completion energy. Something is ready to be released or celebrated — honor the cycle.",
    "Generator Signature": "Your Generator signature of 'Satisfaction' is your internal compass. If something feels deeply satisfying, it's aligned with your design. Frustration means you're off track.",
    "Moon in Scorpio": "The Moon in Scorpio calls you into emotional truth and depth. Surface interactions won't satisfy today — go deep or go quiet.",
    "Personal Day 4": "Personal Day 4 centers on home, foundations, and what's real. Ground yourself in what truly matters.",
  };

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={st.gradient}
    >
      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Greeting ─── */}
        <Text style={st.greeting}>Good morning, {user.preferredName}</Text>
        <Text style={st.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>

        {/* ─── Mood Check-In ─── */}
        <View style={st.moodWrap}>
          <Text style={st.moodQuestion}>What kind of support do you need today?</Text>
          <View style={st.moodRow}>
            {MOOD_OPTIONS.map((opt) => {
              const isSelected = moodSupport === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    st.moodChip,
                    isSelected && { backgroundColor: `${opt.color}18`, borderColor: `${opt.color}30` },
                  ]}
                  onPress={() => setMoodSupport(isSelected ? null : opt.id)}
                  activeOpacity={0.7}
                >
                  <Text style={st.moodEmoji}>{opt.emoji}</Text>
                  <Text style={[st.moodLabel, isSelected && { color: opt.color, fontWeight: "700" }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {moodSupport && (
            <View style={st.moodFeedback}>
              <Text style={st.moodFeedbackText}>
                {
                  MOOD_OPTIONS.find((o) => o.id === moodSupport)?.description
                }
              </Text>
              <Text style={st.moodFeedbackHint}>
                I'll tune today's insights to feel more{" "}
                {moodSupport.toLowerCase()}.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Confidence Badge ─── */}
        <View style={st.confRow}>
          <ConfidencePill level={confidenceLevel} />
        </View>

        {/* ─── Hero Card ─── */}
        <View style={st.heroCard}>
          <Text style={st.heroLabel}>Today's Core Message</Text>
          <Text style={st.heroReading}>{todayReading.reading}</Text>

          <View style={st.nudgeRow}>
            <View style={st.nudgeDot} />
            <Text style={st.nudgeText}>
              Try this today: {todayReading.do}
            </Text>
          </View>

          <InsightActionBar
            onSave={saved ? undefined : handleSave}
            askPrompt={todayReading.reading.slice(0, 80)}
          />
        </View>

        {/* ─── Systems Agree Card with Explainable Chips ─── */}
        <View style={st.systemsCard}>
          <View style={st.systemsHeader}>
            <Text style={st.systemsCount}>
              {todayReading.systemsAgree.systems.length} systems agree
            </Text>
            <TouchableOpacity onPress={() => setShowWhy(!showWhy)}>
              <Text style={st.systemsSeeWhy}>
                {showWhy ? "Hide why" : "See why →"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={st.systemsSummary}>{todayReading.systemsAgree.summary}</Text>

          {/* Explainable system chips */}
          <View style={st.systemsChipRow}>
            {todayReading.systemsAgree.systems.map((sys) => {
              const isSelected = selectedWhySystem === sys;
              return (
                <TouchableOpacity
                  key={sys}
                  style={[st.sysChip, isSelected && st.sysChipActive]}
                  onPress={() => setSelectedWhySystem(isSelected ? null : sys)}
                  activeOpacity={0.7}
                >
                  <Text style={[st.sysChipText, isSelected && st.sysChipTextActive]}>
                    {sys}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explainable detail panels */}
          {selectedWhySystem && systemChipExplanations[selectedWhySystem] && (
            <View style={st.sysExplain}>
              <Text style={st.sysExplainTitle}>
                Why "{selectedWhySystem}" appears today
              </Text>
              <Text style={st.sysExplainBody}>
                {systemChipExplanations[selectedWhySystem]}
              </Text>
            </View>
          )}

          {/* Overall why panel */}
          {showWhy && (
            <View style={st.whyPanel}>
              <Text style={st.whyTitle}>Why you're seeing this</Text>
              <Text style={st.whyBody}>
                {todayReading.systemsAgree.detail}
              </Text>
              <TouchableOpacity
                style={st.whyClose}
                onPress={() => setShowWhy(false)}
              >
                <Text style={st.whyCloseText}>Got it</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Soluna Shift ─── */}
        <SolunaShiftCard date={todayStr} />

        {/* ─── Your Big Three ─── */}
        {bigThree && (
          <View style={st.bigThreeSection}>
            <Text style={st.sectionTitle}>Your Big Three</Text>
            <View style={st.bigThreeRow}>
              {bigThree.map((item, i) => (
                <View key={i} style={st.bigThreeChip}>
                  <Text style={st.bigThreeEmoji}>{item.emoji}</Text>
                  <Text style={st.bigThreeLabel}>{item.label}</Text>
                  <Text style={st.bigThreeSign}>{item.sign}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Core Numbers ─── */}
        {coreNumbers && (
          <View style={st.coreNumsSection}>
            <Text style={st.sectionTitle}>Core Numbers</Text>
            <View style={st.coreNumsRow}>
              {coreNumbers.map((num, i) => (
                <View key={i} style={st.coreNumChip}>
                  <Text style={st.coreNumValue}>{num.value}</Text>
                  <Text style={st.coreNumLabel}>{num.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Divider ─── */}
        <View style={st.divider} />

        {/* ─── Accordion: Cosmic Weather ─── */}
        <TouchableOpacity
          style={st.accordion}
          onPress={() => toggleExpanded("cosmic")}
          activeOpacity={0.7}
        >
          <View style={st.accordionHeader}>
            <View style={st.accordionIconRow}>
              <Text style={st.accordionEmoji}>
                {todayReading.moonPhaseEmoji}
              </Text>
              <View>
                <Text style={st.accordionTitle}>Cosmic Weather</Text>
                <Text style={st.accordionSub}>
                  {todayReading.moonPhase} · Moon in {todayReading.moonSign}
                </Text>
              </View>
            </View>
            {expanded.has("cosmic") ? (
              <ChevronUp size={18} color={SolunaColors.creamMuted} />
            ) : (
              <ChevronDown size={18} color={SolunaColors.creamMuted} />
            )}
          </View>
          {expanded.has("cosmic") && (
            <View style={st.accordionBody}>
              <View style={st.transitCard}>
                <Text style={st.transitEmoji}>
                  {PLANET_SYMBOLS[todayReading.transit1.planet]}
                </Text>
                <View style={st.transitTextWrap}>
                  <Text style={st.transitLabel}>
                    {todayReading.transit1.planet} in{" "}
                    {todayReading.transit1.sign}
                  </Text>
                  <Text style={st.transitBlurb}>
                    {todayReading.transit1.blurb}
                  </Text>
                </View>
              </View>
              <View style={st.transitCard}>
                <Text style={st.transitEmoji}>
                  {PLANET_SYMBOLS[todayReading.transit2.planet]}
                </Text>
                <View style={st.transitTextWrap}>
                  <Text style={st.transitLabel}>
                    {todayReading.transit2.planet} in{" "}
                    {todayReading.transit2.sign}
                  </Text>
                  <Text style={st.transitBlurb}>
                    {todayReading.transit2.blurb}
                  </Text>
                </View>
              </View>
              {todayReading.chineseNote && (
                <View style={st.transitCard}>
                  <Text style={st.transitEmoji}>🐉</Text>
                  <View style={st.transitTextWrap}>
                    <Text style={st.transitLabel}>Chinese Note</Text>
                    <Text style={st.transitBlurb}>
                      {todayReading.chineseNote}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Accordion: Tarot Card ─── */}
        <TouchableOpacity
          style={st.accordion}
          onPress={() => toggleExpanded("tarot")}
          activeOpacity={0.7}
        >
          <View style={st.accordionHeader}>
            <View style={st.accordionIconRow}>
              <Text style={st.accordionEmoji}>
                {todayReading.cardOfTheDay.imageEmoji}
              </Text>
              <View>
                <Text style={st.accordionTitle}>Card of the Day</Text>
                <Text style={st.accordionSub}>
                  {todayReading.cardOfTheDay.name}
                  {todayReading.cardOfTheDay.arcana === "major"
                    ? " · Major Arcana"
                    : ` · ${todayReading.cardOfTheDay.suit}`}
                </Text>
              </View>
            </View>
            {expanded.has("tarot") ? (
              <ChevronUp size={18} color={SolunaColors.creamMuted} />
            ) : (
              <ChevronDown size={18} color={SolunaColors.creamMuted} />
            )}
          </View>
          {expanded.has("tarot") && (
            <View style={st.accordionBody}>
              <Text style={st.tarotMeaning}>
                {todayReading.cardOfTheDay.uprightMeaning}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Accordion: Energy Level ─── */}
        <TouchableOpacity
          style={st.accordion}
          onPress={() => toggleExpanded("energy")}
          activeOpacity={0.7}
        >
          <View style={st.accordionHeader}>
            <View style={st.accordionIconRow}>
              <Text style={st.accordionEmoji}>⚡</Text>
              <View>
                <Text style={st.accordionTitle}>Energy Level</Text>
                <Text style={st.accordionSub}>
                  {todayReading.energyCaption}
                </Text>
              </View>
            </View>
            <View style={st.energyBadge}>
              <Text style={st.energyBadgeText}>
                {todayReading.energyLevel}/5
              </Text>
            </View>
          </View>
          {expanded.has("energy") && (
            <View style={st.accordionBody}>
              <View style={st.energyBar}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      st.energyDot,
                      level <= todayReading.energyLevel && st.energyDotActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={st.personalDay}>
                Personal Day {todayReading.personalDay} ·{" "}
                {todayReading.personalDayMeaning}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Accordion: Affirmation ─── */}
        <TouchableOpacity
          style={st.accordion}
          onPress={() => toggleExpanded("affirm")}
          activeOpacity={0.7}
        >
          <View style={st.accordionHeader}>
            <View style={st.accordionIconRow}>
              <Text style={st.accordionEmoji}>💫</Text>
              <View>
                <Text style={st.accordionTitle}>Today's Affirmation</Text>
                <Text style={st.accordionSub} numberOfLines={1}>
                  {todayReading.affirmation.slice(0, 50)}…
                </Text>
              </View>
            </View>
            {expanded.has("affirm") ? (
              <ChevronUp size={18} color={SolunaColors.creamMuted} />
            ) : (
              <ChevronDown size={18} color={SolunaColors.creamMuted} />
            )}
          </View>
          {expanded.has("affirm") && (
            <View style={st.accordionBody}>
              <Text style={st.affirmText}>
                {todayReading.affirmation}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ─── Accordion: Do / Embrace / Ease ─── */}
        <TouchableOpacity
          style={st.accordion}
          onPress={() => toggleExpanded("dwell")}
          activeOpacity={0.7}
        >
          <View style={st.accordionHeader}>
            <View style={st.accordionIconRow}>
              <Text style={st.accordionEmoji}>🌸</Text>
              <View>
                <Text style={st.accordionTitle}>Today's Gentle Nudges</Text>
                <Text style={st.accordionSub}>
                  Do · Embrace · Ease up
                </Text>
              </View>
            </View>
            {expanded.has("dwell") ? (
              <ChevronUp size={18} color={SolunaColors.creamMuted} />
            ) : (
              <ChevronDown size={18} color={SolunaColors.creamMuted} />
            )}
          </View>
          {expanded.has("dwell") && (
            <View style={st.accordionBody}>
              <View style={st.dwellRow}>
                <View style={[st.dwellIcon, st.dwellDoIcon]}>
                  <Text style={st.dwellIconText}>Do</Text>
                </View>
                <Text style={st.dwellText}>{todayReading.do}</Text>
              </View>
              <View style={st.dwellRow}>
                <View style={[st.dwellIcon, st.dwellEmbraceIcon]}>
                  <Text style={st.dwellIconText}>↗</Text>
                </View>
                <Text style={st.dwellText}>{todayReading.embrace}</Text>
              </View>
              <View style={st.dwellRow}>
                <View style={[st.dwellIcon, st.dwellEaseIcon]}>
                  <Text style={st.dwellIconText}>↓</Text>
                </View>
                <Text style={st.dwellText}>{todayReading.easeUp}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        <View style={st.bottomPad} />
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 32 },

  // Greeting
  greeting: {
    fontSize: 26,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    marginBottom: 16,
  },

  // Mood Check-In
  moodWrap: {
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  moodQuestion: {
    fontSize: 13,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  moodEmoji: { fontSize: 12 },
  moodLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  moodFeedback: {
    marginTop: 10,
    backgroundColor: "rgba(232,184,109,0.06)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.1)",
  },
  moodFeedbackText: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 17,
    marginBottom: 4,
  },
  moodFeedbackHint: {
    fontSize: 11,
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
    fontStyle: "italic",
  },

  // Confidence
  confRow: {
    marginBottom: 20,
  },

  // Hero card
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  heroReading: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    lineHeight: 25,
    marginBottom: 18,
  },
  nudgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(232,184,109,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  nudgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SolunaColors.warmGold,
  },
  nudgeText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: SolunaColors.creamMuted,
    flex: 1,
  },

  // Systems Agree Card
  systemsCard: {
    backgroundColor: "rgba(232,184,109,0.06)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.15)",
    marginBottom: 20,
  },
  systemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  systemsCount: {
    fontSize: 11,
    fontWeight: "700",
    color: SolunaColors.warmGold,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: Fonts.body,
  },
  systemsSeeWhy: {
    fontSize: 12,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  systemsSummary: {
    fontSize: 14,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    lineHeight: 21,
    marginBottom: 10,
  },
  systemsChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sysChip: {
    backgroundColor: "rgba(232,184,109,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.12)",
  },
  sysChipActive: {
    backgroundColor: "rgba(232,184,109,0.15)",
    borderColor: "rgba(232,184,109,0.3)",
  },
  sysChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  sysChipTextActive: {
    color: SolunaColors.warmGold,
  },
  sysExplain: {
    marginTop: 10,
    backgroundColor: "rgba(232,184,109,0.06)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.12)",
  },
  sysExplainTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
    marginBottom: 6,
  },
  sysExplainBody: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },

  // Why panel
  whyPanel: {
    marginTop: 10,
    backgroundColor: "rgba(185,163,227,0.08)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(185,163,227,0.12)",
  },
  whyTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.gentleLavender,
    marginBottom: 6,
  },
  whyBody: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: SolunaColors.creamMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  whyClose: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(185,163,227,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  whyCloseText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Fonts.body,
    color: SolunaColors.gentleLavender,
  },

  // Big Three
  bigThreeSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.creamMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  bigThreeRow: {
    flexDirection: "row",
    gap: 10,
  },
  bigThreeChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bigThreeEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  bigThreeLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bigThreeSign: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Fonts.body,
    color: SolunaColors.cream,
    marginTop: 2,
  },

  // Core Numbers
  coreNumsSection: {
    marginBottom: 20,
  },
  coreNumsRow: {
    flexDirection: "row",
    gap: 10,
  },
  coreNumChip: {
    flex: 1,
    backgroundColor: "rgba(242,168,141,0.06)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(242,168,141,0.1)",
  },
  coreNumValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.heading,
    color: SolunaColors.softPeach,
  },
  coreNumLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: Fonts.body,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },

  // Accordion
  accordion: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accordionEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: "center",
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.cream,
  },
  accordionSub: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: SolunaColors.creamSubtle,
    marginTop: 2,
  },
  accordionBody: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 14,
  },

  // Transit cards inside accordion
  transitCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  transitEmoji: {
    fontSize: 18,
    width: 28,
    textAlign: "center",
    color: SolunaColors.cream,
  },
  transitTextWrap: {
    flex: 1,
  },
  transitLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.warmGold,
    marginBottom: 3,
  },
  transitBlurb: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: SolunaColors.creamMuted,
    lineHeight: 17,
  },

  // Tarot
  tarotMeaning: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: SolunaColors.creamMuted,
    lineHeight: 20,
  },

  // Energy
  energyBadge: {
    backgroundColor: "rgba(232,184,109,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  energyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.warmGold,
  },
  energyBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  energyDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  energyDotActive: {
    backgroundColor: SolunaColors.warmGold,
  },
  personalDay: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: SolunaColors.creamSubtle,
    lineHeight: 18,
  },

  // Affirmation
  affirmText: {
    fontSize: 15,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    lineHeight: 23,
    fontStyle: "italic",
  },

  // Do / Embrace / Ease
  dwellRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  dwellIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dwellDoIcon: {
    backgroundColor: "rgba(123,200,156,0.15)",
  },
  dwellEmbraceIcon: {
    backgroundColor: "rgba(232,184,109,0.12)",
  },
  dwellEaseIcon: {
    backgroundColor: "rgba(242,168,141,0.12)",
  },
  dwellIconText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.cream,
  },
  dwellText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.body,
    color: SolunaColors.creamMuted,
    lineHeight: 19,
  },

  bottomPad: {
    height: 100,
  },
});
