import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated as RNAnimated, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useEffect, useState, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  getReadingForDate, ZODIAC_SYMBOLS, Fonts, DAILY_READINGS,
} from "@/constants/mockData";
import SystemAgreeBadge from "@/components/SystemAgreeBadge";
import InsightActionBar from "@/components/InsightActionBar";
import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";
import {
  Sun, Moon, Sparkles, Star, Hash, BookOpen,
} from "lucide-react-native";

// ─── Compact Expandable Module Card ──────────────────────────────
function ModuleCard({
  icon: Icon, iconColor, label, expanded, onToggle, children,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string; label: string; expanded: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={mc.wrap} onPress={onToggle} activeOpacity={0.7}>
      <View style={mc.header}>
        <View style={mc.headerLeft}>
          <Icon size={14} color={iconColor} />
          <Text style={mc.label}>{label}</Text>
        </View>
        <Text style={[mc.chevron, expanded && mc.chevronOpen]}>{expanded ? "▾" : "▸"}</Text>
      </View>
      {expanded && <View style={mc.body}>{children}</View>}
    </TouchableOpacity>
  );
}
const mc = StyleSheet.create({
  wrap: {
    backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md,
    borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 8,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    fontSize: 12, color: SolunaColors.creamSubtle, textTransform: "uppercase",
    letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body,
  },
  chevron: { fontSize: 14, color: SolunaColors.creamSubtle },
  chevronOpen: { color: SolunaColors.warmGold },
  body: { paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)", paddingTop: 12 },
});

// ─── Biorhythm Mini Gauge ─────────────────────────────────────────
function BiorhythmGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={bioS.row}>
      <Text style={bioS.label}>{label}</Text>
      <View style={bioS.barTrack}>
        <View style={[bioS.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[bioS.val, { color }]}>{value}%</Text>
    </View>
  );
}
const bioS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  label: { fontSize: 11, color: SolunaColors.creamMuted, width: 80, fontFamily: Fonts.body },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)" },
  barFill: { height: 6, borderRadius: 3 },
  val: { fontSize: 12, fontWeight: "700", width: 36, textAlign: "right", fontFamily: Fonts.body },
});

// ─── Mood Dot (simplified — no crash-prone dial) ──────────────────
function MoodIndicator({ level, caption }: { level: number; caption: string }) {
  const dots = Array.from({ length: 5 });
  return (
    <View style={miS.wrap}>
      <View style={miS.dotsRow}>
        {dots.map((_, i) => (
          <View key={i} style={[miS.dot, i < level ? { backgroundColor: SolunaColors.warmGold } : { backgroundColor: "rgba(255,255,255,0.08)" }]} />
        ))}
      </View>
      <Text style={miS.level}>{level}/5</Text>
      <Text style={miS.caption}>{caption}</Text>
    </View>
  );
}
const miS = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  dotsRow: { flexDirection: "row", gap: 8 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  level: { fontSize: 14, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body },
  caption: { fontSize: 12, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 17 },
});

// ─── Today Screen ─────────────────────────────────────────────────
export default function TodayScreen() {
  const { user } = useAppState();
  const reading = getReadingForDate("2026-06-24");
  const fadeIn = useRef(new RNAnimated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    // Simulate initial load
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 800);
    RNAnimated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: false }).start();
    return () => clearTimeout(t);
  }, [fadeIn]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  if (!user) return null;

  const agreeSystems = reading.systemsAgree.systems.map((s) => {
    if (s.includes("Moon")) return "☽";
    if (s.includes("Day") || s.includes("Life")) return "#";
    if (s.includes("Generator") || s.includes("Sacral")) return "⚡";
    if (s.includes("Pig") || s.includes("Wood")) return "🐖";
    return "☆";
  });

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SolunaColors.warmGold}
            colors={[SolunaColors.warmGold]}
          />
        }
      >
        {loading ? (
          <View style={{ paddingTop: 60 }}>
            <LoadingSkeletonCard lines={4} height={180} />
            <LoadingSkeletonCard lines={3} height={120} />
            <LoadingSkeletonCard lines={2} height={100} />
          </View>
        ) : (
          <RNAnimated.View style={{ opacity: fadeIn }}>
            {/* Header */}
            <View style={st.header}>
              <View>
                <Text style={st.greeting}>Good morning, {user.preferredName}</Text>
                <Text style={st.date}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </Text>
              </View>
              <View style={st.sunBadge}>
                <Sun size={14} color={SolunaColors.warmGold} />
                <Text style={st.sunBadgeText}>
                  {ZODIAC_SYMBOLS[user.chart.sun.sign]} {user.chart.sun.sign}
                </Text>
              </View>
            </View>

            {/* ── Today's Core Message Hero Card ── */}
            <View style={st.heroCard}>
              <View style={st.heroSparkle}>
                <Sparkles size={18} color={SolunaColors.warmGold} />
              </View>
              <Text style={st.heroText}>{reading.reading}</Text>
              <View style={st.heroDivider} />
              <View style={st.nudgeRow}>
                <Moon size={14} color={SolunaColors.gentleLavender} />
                <Text style={st.nudgeText}>{reading.do}</Text>
              </View>
              <InsightActionBar
                onSave={() => {}}
                onJournal={() => router.push("/journal")}
                askPrompt="Tell me more about today's reading"
              />
            </View>

            {/* ── Systems Agree Signature Card ── */}
            <SystemAgreeBadge
              count={reading.systemsAgree.systems.length}
              systems={agreeSystems}
              summary={reading.systemsAgree.summary}
              onSeeWhy={() =>
                router.push({ pathname: "/synthesis-detail", params: { id: "today" } })
              }
            />

            {/* ── Expandable Modules ── */}

            {/* Cosmic Weather */}
            <ModuleCard
              icon={Sparkles} iconColor={SolunaColors.warmGold}
              label="COSMIC WEATHER"
              expanded={!!expanded.weather}
              onToggle={() => toggleExpanded("weather")}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                <View style={st.weatherCard}>
                  <Text style={st.weatherEmoji}>{reading.moonPhaseEmoji}</Text>
                  <Text style={st.weatherLabel}>{reading.moonPhase}</Text>
                  <Text style={st.weatherSub}>The moon grows toward fullness — a time for building and becoming.</Text>
                </View>
                <View style={st.weatherCard}>
                  <Moon size={22} color={SolunaColors.gentleLavender} />
                  <Text style={st.weatherLabel}>Moon in {reading.moonSign}</Text>
                  <Text style={st.weatherSub}>Emotions run warm and nurturing — let yourself be soft.</Text>
                </View>
                {[reading.transit1, reading.transit2].map((t, i) => (
                  <TouchableOpacity
                    key={i}
                    style={st.weatherCard}
                    onPress={() =>
                      router.push({
                        pathname: "/transit-detail",
                        params: { id: i === 0 ? "venus-gemini" : "mars-virgo" },
                      })
                    }
                  >
                    <Text style={st.weatherEmojiSmall}>{ZODIAC_SYMBOLS[t.sign]}</Text>
                    <Text style={st.weatherLabel}>{t.planet} in {t.sign}</Text>
                    <Text style={st.weatherSub}>{t.blurb}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ModuleCard>

            {/* Personal Day */}
            <ModuleCard
              icon={Hash} iconColor={SolunaColors.gentleLavender}
              label="PERSONAL DAY {reading.personalDay}"
              expanded={!!expanded.personalDay}
              onToggle={() => toggleExpanded("personalDay")}
            >
              <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                <View style={st.numCircle}>
                  <Text style={st.numCircleText}>{reading.personalDay}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body }}>
                  <Text style={{ fontWeight: "700", color: SolunaColors.warmGold }}>
                    Personal Day {reading.personalDay}:{" "}
                  </Text>
                  {reading.personalDayMeaning}
                </Text>
              </View>
            </ModuleCard>

            {/* Chinese Note */}
            <ModuleCard
              icon={() => <Text style={{ fontSize: 14 }}>🐖</Text>}
              iconColor={SolunaColors.softPeach}
              label="CHINESE NOTE"
              expanded={!!expanded.chinese}
              onToggle={() => toggleExpanded("chinese")}
            >
              <Text style={{ fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body }}>
                {reading.chineseNote}
              </Text>
            </ModuleCard>

            {/* Tarot Card */}
            <ModuleCard
              icon={BookOpen} iconColor={SolunaColors.warmGold}
              label="CARD OF THE DAY"
              expanded={!!expanded.tarot}
              onToggle={() => toggleExpanded("tarot")}
            >
              <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
                <Text style={{ fontSize: 32 }}>{reading.cardOfTheDay.imageEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body, marginBottom: 4 }}>
                    {reading.cardOfTheDay.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body }}>
                    {reading.cardOfTheDay.uprightMeaning}
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, alignSelf: "flex-end" }}
                    onPress={() => router.push("/tarot")}
                  >
                    <Text style={{ fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body }}>
                      Pull a full spread
                    </Text>
                    <Star size={10} color={SolunaColors.warmGold} />
                  </TouchableOpacity>
                </View>
              </View>
            </ModuleCard>

            {/* Biorhythm */}
            <ModuleCard
              icon={() => <Text style={{ fontSize: 12 }}>〰</Text>}
              iconColor={SolunaColors.creamMuted}
              label="BIORHYTHM"
              expanded={!!expanded.biorhythm}
              onToggle={() => toggleExpanded("biorhythm")}
            >
              <BiorhythmGauge label="Physical" value={72} color={SolunaColors.softPeach} />
              <BiorhythmGauge label="Emotional" value={45} color={SolunaColors.gentleLavender} />
              <BiorhythmGauge label="Intellectual" value={88} color={SolunaColors.warmGold} />
            </ModuleCard>

            {/* Energy + Affirmation Row */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
              <View style={st.compactCard}>
                <Text style={st.compactLabel}>YOUR ENERGY</Text>
                <MoodIndicator level={reading.energyLevel} caption={reading.energyCaption} />
              </View>
              <View style={st.compactCard}>
                <Text style={st.compactLabel}>AFFIRMATION</Text>
                <Text style={st.affirmationText} numberOfLines={3}>
                  "{reading.affirmation}"
                </Text>
              </View>
            </View>

            {/* Do / Embrace / Ease Up */}
            <View style={st.compactCard}>
              {[
                { icon: Star, label: "Do", value: reading.do, color: SolunaColors.warmGold },
                { icon: Sparkles, label: "Embrace", value: reading.embrace, color: SolunaColors.gentleLavender },
                { icon: Moon, label: "Ease up on", value: reading.easeUp, color: SolunaColors.softPeach },
              ].map((item, i, arr) => (
                <View key={item.label}>
                  <View style={st.guidanceRow}>
                    <View style={st.guidanceIconWrap}>
                      <item.icon size={14} color={item.color} fill={item.label === "Do" ? item.color : "none"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.guidanceLabel}>{item.label}</Text>
                      <Text style={st.guidanceValue}>{item.value}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={st.guidanceDivider} />}
                </View>
              ))}
            </View>

            {/* Ask Soluna CTA */}
            <TouchableOpacity style={st.askCta} onPress={() => router.push("/(tabs)/ask")} activeOpacity={0.8}>
              <LinearGradient
                colors={["rgba(232,184,109,0.15)", "rgba(242,168,141,0.08)"]}
                style={st.askCtaInner}
              >
                <Sparkles size={18} color={SolunaColors.warmGold} />
                <Text style={st.askCtaText}>Ask Soluna about today</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Full Moon Ritual CTA */}
            <TouchableOpacity style={st.ritualCta} onPress={() => router.push("/rituals")} activeOpacity={0.8}>
              <View style={st.ritualCtaInner}>
                <Moon size={18} color={SolunaColors.gentleLavender} />
                <View style={{ flex: 1 }}>
                  <Text style={st.ritualCtaTitle}>Full Moon Ritual Available</Text>
                  <Text style={st.ritualCtaSub}>A gentle, optional ritual to honor this lunar moment</Text>
                </View>
                <Star size={14} color={SolunaColors.warmGold} />
              </View>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </RNAnimated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const st = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 26, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  date: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  sunBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(232,184,109,0.12)", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.2)",
  },
  sunBadgeText: { fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  // Hero Card
  heroCard: {
    backgroundColor: "rgba(232,184,109,0.04)",
    borderRadius: SolunaRadius.lg, padding: 20,
    borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 16,
  },
  heroSparkle: { alignSelf: "center", marginBottom: 12 },
  heroText: {
    fontSize: 16, fontFamily: Fonts.heading, color: SolunaColors.cream,
    lineHeight: 26, letterSpacing: 0.2, marginBottom: 14,
  },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 12 },
  nudgeRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 4 },
  nudgeText: { flex: 1, fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 19 },
  // Compact cards
  compactCard: {
    flex: 1, backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md,
    padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 8,
  },
  compactLabel: {
    fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase",
    letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 10,
  },
  affirmationText: {
    fontSize: 14, fontFamily: Fonts.heading, color: SolunaColors.cream,
    lineHeight: 21, fontStyle: "italic",
  },
  // Weather
  weatherCard: {
    backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 14,
    borderWidth: 1, borderColor: SolunaColors.cardBorder, width: 160, gap: 4,
  },
  weatherEmoji: { fontSize: 26 },
  weatherEmojiSmall: { fontSize: 20 },
  weatherLabel: { fontSize: 12, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  weatherSub: { fontSize: 11, color: SolunaColors.creamMuted, lineHeight: 16 },
  // Numerology
  numCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(185,163,227,0.15)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(185,163,227,0.25)",
  },
  numCircleText: { fontSize: 22, fontWeight: "700", color: SolunaColors.gentleLavender, fontFamily: Fonts.heading },
  // Guidance
  guidanceRow: { flexDirection: "row", gap: 12, paddingVertical: 10, alignItems: "flex-start" },
  guidanceIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center",
  },
  guidanceLabel: {
    fontSize: 10, color: SolunaColors.creamSubtle, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 1, fontFamily: Fonts.body, marginBottom: 2,
  },
  guidanceValue: { fontSize: 13, color: SolunaColors.cream, lineHeight: 19, fontFamily: Fonts.body },
  guidanceDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.04)" },
  // Ritual CTA
  ritualCta: { marginBottom: 12 },
  ritualCtaInner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(185,163,227,0.06)", borderRadius: SolunaRadius.md,
    padding: 16, borderWidth: 1, borderColor: "rgba(185,163,227,0.12)",
  },
  ritualCtaTitle: { fontSize: 13, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 2 },
  ritualCtaSub: { fontSize: 11, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  // Ask CTA
  askCta: { borderRadius: SolunaRadius.md, overflow: "hidden", marginBottom: 12 },
  askCtaInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)",
    borderRadius: SolunaRadius.md,
  },
  askCtaText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});
