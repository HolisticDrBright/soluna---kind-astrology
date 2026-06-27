import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import Svg, { Circle } from "react-native-svg";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { ZODIAC_SYMBOLS, PLANET_SYMBOLS, Fonts } from "@/constants/mockData";
import { CURRENT_TRANSITS } from "@/constants/demoData";
import { isDemoMode } from "@/lib/runtimeMode";
import ComingSoon from "@/components/ComingSoon";
import { ChevronLeft, Sparkles, Clock } from "lucide-react-native";

// ─── Mini Sky Diagram ─────────────────────────────────────────────
function MiniSkyDiagram({ planet1, sign1 }: { planet1: string; sign1: string }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={r - 20} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="4,4" />
      <Circle cx={cx} cy={cy} r={6} fill={SolunaColors.warmGold} opacity={0.4} />
      {/* Planet dot */}
      <Circle cx={cx + 35} cy={cy - 20} r={8} fill={SolunaColors.warmGold} opacity={0.8} />
      <Circle cx={cx + 35} cy={cy - 20} r={14} fill={SolunaColors.warmGold} opacity={0.15} />
    </Svg>
  );
}

// ─── Transit Detail Screen ────────────────────────────────────────
export default function TransitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Not wired to live ephemeris yet — honest state instead of demo transits.
  if (!isDemoMode) {
    return (
      <ComingSoon
        title="Transit details"
        description="Live sky transits will open here once they're connected to real ephemeris data."
      />
    );
  }

  const transit = CURRENT_TRANSITS.find((t) => t.id === id);
  if (!transit) return null;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={SolunaColors.cream} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={styles.skyDiagram}>
            <MiniSkyDiagram planet1={transit.planet} sign1={transit.sign} />
          </View>
          <View style={styles.badge}>
            <Clock size={12} color={SolunaColors.creamMuted} />
            <Text style={styles.badgeText}>In the sky right now</Text>
          </View>
          <Text style={styles.heroTitle}>{transit.title}</Text>
          <Text style={styles.heroSub}>
            {PLANET_SYMBOLS[transit.planet]} {transit.planet} traveling through{" "}
            {ZODIAC_SYMBOLS[transit.sign]} {transit.sign}
          </Text>
          <Text style={styles.duration}>{transit.duration}</Text>
        </View>

        {/* What it is */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What This Is</Text>
          <Text style={styles.sectionText}>{transit.plainDescription}</Text>
        </View>

        {/* What it means */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What It Means For You</Text>
          <Text style={styles.sectionText}>{transit.whatItMeans}</Text>
        </View>

        {/* Suggestion */}
        <View style={styles.suggestionCard}>
          <Sparkles size={18} color={SolunaColors.warmGold} />
          <Text style={styles.suggestionText}>{transit.suggestion}</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SolunaSpacing.md,
    paddingTop: 60,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  skyDiagram: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 16,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 8,
  },
  duration: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    color: SolunaColors.creamMuted,
    lineHeight: 24,
    fontFamily: Fonts.body,
  },
  suggestionCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(232,184,109,0.06)",
    borderRadius: SolunaRadius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.12)",
    alignItems: "flex-start",
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: SolunaColors.warmGold,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
});
