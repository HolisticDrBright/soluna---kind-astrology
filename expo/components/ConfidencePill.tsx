import { View, Text, StyleSheet } from "react-native";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";

export type ConfidenceLevel = "exact" | "approximate" | "needsBirthTime";

interface ConfidencePillProps {
  level: ConfidenceLevel;
}

const config: Record<ConfidenceLevel, { label: string; color: string; bg: string; border: string }> = {
  exact: { label: "Exact", color: "#7BC89C", bg: "rgba(123,200,156,0.1)", border: "rgba(123,200,156,0.2)" },
  approximate: { label: "Approximate", color: SolunaColors.warmGold, bg: "rgba(232,184,109,0.08)", border: "rgba(232,184,109,0.15)" },
  needsBirthTime: { label: "Needs birth time", color: SolunaColors.softPeach, bg: "rgba(242,168,141,0.08)", border: "rgba(242,168,141,0.12)" },
};

export default function ConfidencePill({ level }: ConfidencePillProps) {
  const c = config[level];
  return (
    <View style={[s.pill, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[s.dot, { backgroundColor: c.color }]} />
      <Text style={[s.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1, alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, fontWeight: "600", fontFamily: Fonts.body },
});
