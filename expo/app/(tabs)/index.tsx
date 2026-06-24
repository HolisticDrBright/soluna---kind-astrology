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
} from "@/constants/mockData";
import type { DailyReading } from "@/constants/mockData";
import SystemAgreeBadge from "@/components/SystemAgreeBadge";
import InsightActionBar from "@/components/InsightActionBar";
import ConfidencePill from "@/components/ConfidencePill";
import type { ConfidenceLevel } from "@/components/ConfidencePill";
import { ChevronDown, ChevronUp } from "lucide-react-native";

// ─── Section IDs for accordion ──────────────────────────────────
type SectionKey = "cosmic" | "tarot" | "energy" | "affirm" | "dwell";

export default function TodayScreen() {
  const { user } = useAppState();
  if (!user) return null;

  const todayReading: DailyReading =
    DAILY_READINGS.find((r) => r.date === "2026-06-24") ?? DAILY_READINGS[0];

  const [saved, setSaved] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [expanded, setExpanded] = useState<Set<SectionKey>>(
    new Set<SectionKey>(),
  );

  const handleSave = useCallback(() => {
    setSaved(true);
  }, []);

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

        {/* ─── Systems Agree Card ─── */}
        <SystemAgreeBadge
          count={todayReading.systemsAgree.systems.length}
          systems={todayReading.systemsAgree.systems}
          summary={todayReading.systemsAgree.summary}
          onSeeWhy={() => setShowWhy(true)}
        />

        {/* ─── Show me why: detail panel ─── */}
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
                <Text style={st.accordionTitle}>
                  Card of the Day
                </Text>
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
    marginBottom: 12,
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

  // Why panel
  whyPanel: {
    backgroundColor: "rgba(185,163,227,0.08)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(185,163,227,0.15)",
    marginBottom: 20,
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.body,
    color: SolunaColors.gentleLavender,
    marginBottom: 8,
  },
  whyBody: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: SolunaColors.creamMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  whyClose: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(185,163,227,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  whyCloseText: {
    fontSize: 12,
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
