import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import SolunaColors from "@/constants/colors";
import { Fonts, SOLUNA_SHIFTS, type SolunaShiftData } from "@/constants/mockData";
import { Sparkles, Heart, ArrowRight, BookOpen, Brain } from "lucide-react-native";
import React, { useState } from "react";

interface SolunaShiftCardProps {
  date: string;
}

export default function SolunaShiftCard({ date }: SolunaShiftCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const shift: SolunaShiftData | undefined = SOLUNA_SHIFTS[date];
  if (!shift) return null;

  return (
    <View style={s.wrap}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Sparkles size={16} color={SolunaColors.warmGold} />
        </View>
        <View style={s.headerTextWrap}>
          <Text style={s.headerTitle}>Soluna Shift</Text>
          <Text style={s.headerSub}>
            A daily nudge toward what you actually need
          </Text>
        </View>
      </View>

      {/* ── Reframe ── */}
      <TouchableOpacity
        style={s.section}
        onPress={() => toggle("reframe")}
        activeOpacity={0.7}
      >
        <View style={s.sectionRow}>
          <View style={[s.sectionIcon, { backgroundColor: "rgba(185,163,227,0.12)" }]}>
            <Brain size={15} color={SolunaColors.gentleLavender} />
          </View>
          <View style={s.sectionTextWrap}>
            <Text style={s.sectionLabel}>Reframe</Text>
            <Text style={s.sectionPreview} numberOfLines={expandedSection === "reframe" ? undefined : 2}>
              {shift.reframe}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Reset ── */}
      <TouchableOpacity
        style={s.section}
        onPress={() => toggle("reset")}
        activeOpacity={0.7}
      >
        <View style={s.sectionRow}>
          <View style={[s.sectionIcon, { backgroundColor: "rgba(123,200,156,0.1)" }]}>
            <Heart size={15} color={SolunaColors.success} />
          </View>
          <View style={s.sectionTextWrap}>
            <Text style={[s.sectionLabel, { color: SolunaColors.success }]}>Reset</Text>
            <Text style={s.sectionPreview} numberOfLines={expandedSection === "reset" ? undefined : 2}>
              {shift.reset}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Brave Tiny Action ── */}
      <TouchableOpacity
        style={s.section}
        onPress={() => toggle("action")}
        activeOpacity={0.7}
      >
        <View style={s.sectionRow}>
          <View style={[s.sectionIcon, { backgroundColor: "rgba(232,184,109,0.12)" }]}>
            <ArrowRight size={15} color={SolunaColors.warmGold} />
          </View>
          <View style={s.sectionTextWrap}>
            <Text style={[s.sectionLabel, { color: SolunaColors.warmGold }]}>Brave Tiny Action</Text>
            <Text style={s.sectionPreview} numberOfLines={expandedSection === "action" ? undefined : 2}>
              {shift.braveTinyAction}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Journal Prompt ── */}
      <TouchableOpacity
        style={[s.section, { borderBottomWidth: 0 }]}
        onPress={() => toggle("journal")}
        activeOpacity={0.7}
      >
        <View style={s.sectionRow}>
          <View style={[s.sectionIcon, { backgroundColor: "rgba(242,168,141,0.1)" }]}>
            <BookOpen size={15} color={SolunaColors.softPeach} />
          </View>
          <View style={s.sectionTextWrap}>
            <Text style={[s.sectionLabel, { color: SolunaColors.softPeach }]}>Journal Prompt</Text>
            <Text style={[s.journalText, expandedSection === "journal" && s.journalExpanded]}>
              {shift.journalPrompt}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={s.footer}>A warm daily companion — not a prescription.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(185,163,227,0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(185,163,227,0.12)",
    overflow: "hidden",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(185,163,227,0.1)",
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(232,184,109,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  headerSub: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    marginTop: 1,
  },
  section: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  sectionRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  sectionTextWrap: { flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: SolunaColors.gentleLavender,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    fontFamily: Fonts.body,
    marginBottom: 4,
  },
  sectionPreview: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    lineHeight: 19,
    fontFamily: Fonts.body,
  },
  journalText: {
    fontSize: 14,
    color: SolunaColors.cream,
    lineHeight: 22,
    fontFamily: Fonts.heading,
    fontStyle: "italic" as const,
    maxHeight: 44,
    overflow: "hidden",
  },
  journalExpanded: {
    maxHeight: undefined,
  },
  footer: {
    fontSize: 10,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    textAlign: "center",
    paddingVertical: 12,
    fontStyle: "italic" as const,
  },
});
