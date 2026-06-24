import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider, useAppState } from "@/state/useAppState";
import SolunaColors from "@/constants/colors";
import { Fonts, ZODIAC_SYMBOLS, DAILY_READINGS } from "@/constants/mockData";
import React from "react";

const queryClient = new QueryClient();

// Minimal inline Today content — no navigation, no external components except core ones
function TodayInline() {
  const { user } = useAppState();
  const reading = DAILY_READINGS[0];

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.errText}>No user data</Text>
      </View>
    );
  }

  return (
    <View style={s.gradient}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <Text style={s.greeting}>Good morning, {user.preferredName}</Text>
        <Text style={s.date}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>

        {/* Hero card */}
        <View style={s.heroCard}>
          <Text style={s.heroText}>{reading.reading}</Text>
          <View style={s.divider} />
          <Text style={s.nudgeText}>Today's nudge: {reading.do}</Text>
        </View>

        {/* Systems Agree card */}
        <View style={s.agreeCard}>
          <Text style={s.agreeLabel}>{reading.systemsAgree.systems.length} systems agree</Text>
          <Text style={s.agreeSummary}>{reading.systemsAgree.summary}</Text>
        </View>

        {/* Big Three */}
        <Text style={s.sectionTitle}>Your Big Three</Text>
        <View style={s.row}>
          {[
            { label: "Sun", sign: user.chart.sun.sign, symbol: ZODIAC_SYMBOLS[user.chart.sun.sign], color: SolunaColors.warmGold },
            { label: "Moon", sign: user.chart.moon.sign, symbol: ZODIAC_SYMBOLS[user.chart.moon.sign], color: SolunaColors.gentleLavender },
            { label: "Rising", sign: user.chart.rising, symbol: ZODIAC_SYMBOLS[user.chart.rising], color: SolunaColors.softPeach },
          ].map((item) => (
            <View key={item.label} style={[s.bigThreeChip, { borderColor: item.color + "30" }]}>
              <Text style={[s.bigThreeSymbol, { color: item.color }]}>{item.symbol}</Text>
              <Text style={s.bigThreeLabel}>{item.label}</Text>
              <Text style={[s.bigThreeSign, { color: item.color }]}>{item.sign}</Text>
            </View>
          ))}
        </View>

        {/* Core Numbers */}
        <Text style={s.sectionTitle}>Core Numbers</Text>
        <View style={s.row}>
          {[
            { label: "Life Path", value: user.numerology.lifePath },
            { label: "Expression", value: user.numerology.expression },
            { label: "Soul Urge", value: user.numerology.soulUrge },
          ].map((num) => (
            <View key={num.label} style={s.numChip}>
              <Text style={s.numValue}>{num.value}</Text>
              <Text style={s.numLabel}>{num.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TodayInline />
      </AppProvider>
    </QueryClientProvider>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A1635" },
  errText: { color: "#F5F0E8", fontSize: 16, fontFamily: "System" },
  gradient: { flex: 1, backgroundColor: "#1A1635" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 60 },
  greeting: { fontSize: 26, color: "#F5F0E8", fontFamily: "Georgia", marginBottom: 4 },
  date: { fontSize: 14, color: "#C4BFB5", fontFamily: "System", marginBottom: 24 },
  heroCard: {
    backgroundColor: "rgba(232,184,109,0.04)", borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 16,
  },
  heroText: { fontSize: 16, fontFamily: "Georgia", color: "#F5F0E8", lineHeight: 26, marginBottom: 14 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 12 },
  nudgeText: { fontSize: 13, color: "#C4BFB5", fontFamily: "System", lineHeight: 19 },
  agreeCard: {
    backgroundColor: "rgba(232,184,109,0.06)", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "rgba(232,184,109,0.15)", marginBottom: 24,
  },
  agreeLabel: { fontSize: 11, fontWeight: "700", color: "#E8B86D", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  agreeSummary: { fontSize: 14, fontWeight: "600", color: "#F5F0E8", lineHeight: 21 },
  sectionTitle: { fontSize: 12, color: "#8A8680", textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", marginBottom: 10, marginTop: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  bigThreeChip: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1,
  },
  bigThreeSymbol: { fontSize: 18, marginBottom: 4 },
  bigThreeLabel: { fontSize: 9, color: "#8A8680", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "600" },
  bigThreeSign: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  numChip: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  numValue: { fontSize: 22, fontWeight: "700", color: "#E8B86D", fontFamily: "Georgia" },
  numLabel: { fontSize: 9, color: "#8A8680", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "600", marginTop: 2 },
});
