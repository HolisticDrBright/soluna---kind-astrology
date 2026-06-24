import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";

interface SystemAgreeBadgeProps {
  count: number;
  systems: string[];
  summary: string;
  onSeeWhy?: () => void;
}

export default function SystemAgreeBadge({ count, systems, summary, onSeeWhy }: SystemAgreeBadgeProps) {
  const displaySystems = systems.slice(0, 4);
  return (
    <TouchableOpacity
      style={s.card}
      onPress={onSeeWhy}
      activeOpacity={onSeeWhy ? 0.7 : 1}
      disabled={!onSeeWhy}
    >
      <View style={s.topRow}>
        <View style={s.glyphs}>
          {displaySystems.map((g, i) => (
            <View key={i} style={s.glyph}>
              <Text style={s.glyphText}>{g}</Text>
            </View>
          ))}
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>{count} systems agree</Text>
        </View>
      </View>
      <Text style={s.summary}>{summary}</Text>
      {onSeeWhy && <Text style={s.seeWhy}>See why →</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "rgba(232,184,109,0.06)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.15)",
    marginBottom: 16,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  glyphs: { flexDirection: "row", gap: 3 },
  glyph: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(232,184,109,0.12)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(232,184,109,0.2)",
  },
  glyphText: { fontSize: 13 },
  countBadge: {
    backgroundColor: "rgba(232,184,109,0.12)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  countText: {
    fontSize: 11, fontWeight: "700", color: SolunaColors.warmGold,
    fontFamily: Fonts.body, textTransform: "uppercase", letterSpacing: 0.5,
  },
  summary: {
    fontSize: 14, fontWeight: "600", color: SolunaColors.cream,
    fontFamily: Fonts.body, lineHeight: 21,
  },
  seeWhy: {
    fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600",
    fontFamily: Fonts.body, marginTop: 8, alignSelf: "flex-end",
  },
});
