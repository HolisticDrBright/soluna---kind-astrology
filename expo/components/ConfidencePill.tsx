import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";

export type ConfidenceLevel =
  | "exact"
  | "approximate"
  | "needsBirthTime"
  | "needsLocation"
  | "verified"
  | "needsBackend";

interface ConfidencePillProps {
  level: ConfidenceLevel;
  /** When true, shows a brief explanation below the pill on press */
  showDetail?: boolean;
}

const config: Record<
  ConfidenceLevel,
  { label: string; color: string; bg: string; border: string; detail: string }
> = {
  exact: {
    label: "Exact birth time",
    color: "#7BC89C",
    bg: "rgba(123,200,156,0.1)",
    border: "rgba(123,200,156,0.2)",
    detail:
      "Your birth time is known and verified, so your Rising sign, house placements, and Human Design are calculated precisely. This is the most accurate reading possible.",
  },
  approximate: {
    label: "Approximate method",
    color: SolunaColors.warmGold,
    bg: "rgba(232,184,109,0.08)",
    border: "rgba(232,184,109,0.15)",
    detail:
      "We're working with partial data, so some placements are estimates rather than exact calculations. The core insights are still meaningful — just a little less precise on timing and houses.",
  },
  needsBirthTime: {
    label: "Birth time needed",
    color: SolunaColors.softPeach,
    bg: "rgba(242,168,141,0.08)",
    border: "rgba(242,168,141,0.12)",
    detail:
      "Birth time missing: your Rising sign, houses, and Human Design details need your exact time. You can still explore the parts we can calculate confidently — your Sun sign, Moon sign, Life Path, and Chinese animal are all accurate without it.",
  },
  needsLocation: {
    label: "Location needed",
    color: SolunaColors.softPeach,
    bg: "rgba(242,168,141,0.08)",
    border: "rgba(242,168,141,0.12)",
    detail:
      "Your birth city helps calculate exact time zone and house positions. Without it, we use a reasonable estimate, but the accuracy improves noticeably with a real city — especially for your Ascendant and house cusps.",
  },
  verified: {
    label: "Verified chart data",
    color: "#7BC89C",
    bg: "rgba(123,200,156,0.1)",
    border: "rgba(123,200,156,0.2)",
    detail:
      "Your chart data has been cross-checked and verified. All placements, houses, and system calculations are confirmed — you're seeing the real picture, not an estimate.",
  },
  needsBackend: {
    label: "Awaiting backend",
    color: SolunaColors.creamSubtle,
    bg: "rgba(138,134,128,0.08)",
    border: "rgba(138,134,128,0.12)",
    detail:
      "This reading is using local data until the backend connection is available. The core insights are sound, but daily transits and real-time synthesis will be richer once connected. Nothing is broken — just running in preview mode.",
  },
};

export default function ConfidencePill({ level, showDetail }: ConfidencePillProps) {
  const c = config[level];
  const [expanded, setExpanded] = React.useState(false);

  // Auto-show detail only when showDetail prop is true
  const isExpanded = showDetail ? expanded : false;

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={[s.pill, { backgroundColor: c.bg, borderColor: c.border }]}
        onPress={() => showDetail && setExpanded(!expanded)}
        activeOpacity={showDetail ? 0.7 : 1}
        disabled={!showDetail}
      >
        <View style={[s.dot, { backgroundColor: c.color }]} />
        <Text style={[s.label, { color: c.color }]}>{c.label}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={[s.detailBox, { borderColor: c.border }]}>
          <Text style={s.detailText}>{c.detail}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: "flex-start" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, fontWeight: "600", fontFamily: Fonts.body },
  detailBox: {
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    maxWidth: 280,
  },
  detailText: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    lineHeight: 17,
  },
});
