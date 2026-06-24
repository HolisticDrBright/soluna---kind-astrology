import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import SolunaColors from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { Fonts, DAILY_READINGS, ZODIAC_SYMBOLS, PLANET_SYMBOLS } from "@/constants/mockData";
import type { DailyReading } from "@/constants/mockData";

// ─── Layer 1: Hero card + reading + nudge ────────────────────────
export default function TodayScreen() {
  const { user } = useAppState();
  if (!user) return null;

  const todayReading: DailyReading =
    DAILY_READINGS.find((r) => r.date === "2026-06-24") ?? DAILY_READINGS[0];

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
        </View>

        <Text style={st.layerTag}>Layer 1 loaded. Adding next layer...</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
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
    marginBottom: 24,
  },
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
  layerTag: {
    fontSize: 11,
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginTop: 8,
  },
});
