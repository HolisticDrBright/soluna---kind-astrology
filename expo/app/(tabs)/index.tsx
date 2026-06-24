import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import SolunaColors from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { Fonts } from "@/constants/mockData";

// ─── Minimal diagnostic Today Screen ──────────────────────────────
export default function TodayScreen() {
  const { user } = useAppState();
  if (!user) return null;

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <View style={st.content}>
        <Text style={st.greeting}>Good morning, {user.preferredName}</Text>
        <Text style={st.date}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        <Text style={st.note}>Today tab is rendering. Building back features now...</Text>
      </View>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  greeting: { fontSize: 26, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  date: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 16 },
  note: { fontSize: 14, color: SolunaColors.warmGold, fontFamily: Fonts.body, textAlign: "center" },
});
