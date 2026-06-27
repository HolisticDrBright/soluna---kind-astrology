import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { ZODIAC_SYMBOLS, Fonts, type RelationshipLens } from "@/constants/mockData";
import { CONNECTIONS } from "@/constants/demoData";
import { isDemoMode } from "@/lib/runtimeMode";
import ComingSoon from "@/components/ComingSoon";
import ResonanceFeedbackCard from "@/components/ResonanceFeedbackCard";
import { ChevronLeft, Heart, Sparkles, Share2, Hash, Bird } from "lucide-react-native";

export default function CompatibilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppState();
  const [lens, setLens] = useState<RelationshipLens>("Romance");

  // Demo-only detail view (uses sample connections). Live connections open from
  // the Connections tab; this rich detail isn't wired to live data yet.
  if (!isDemoMode) {
    return (
      <ComingSoon
        title="Compatibility"
        description="Detailed compatibility readings will open here once your connections are connected to live data."
      />
    );
  }
  if (!user || !id || !user.chart) return null;
  const person = CONNECTIONS.find((c) => c.id === id);
  if (!person) return null;

  const color =
    person.compatibilityScore >= 80
      ? SolunaColors.warmGold
      : person.compatibilityScore >= 60
        ? SolunaColors.gentleLavender
        : SolunaColors.softPeach;

  const lensTips: Record<RelationshipLens, string> = {
    Romance: person.romanceTip,
    Friendship: person.friendshipTip,
    Work: person.workTip,
    Family: person.familyTip,
  };

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView contentContainerStyle={st.scrollContent}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={SolunaColors.cream} />
        </TouchableOpacity>

        {/* Hero — no scary single score as main event */}
        <View style={st.hero}>
          <View style={st.avatarsRow}>
            <View style={[st.avatar, { borderColor: SolunaColors.softPeach }]}>
              <Text style={st.avatarText}>{user.preferredName.charAt(0)}</Text>
              <Text style={st.avatarSign}>{ZODIAC_SYMBOLS[user.chart.sun.sign]}</Text>
            </View>
            <View style={st.avatarsConnector}>
              <Heart size={20} color={color} fill={color} opacity={0.6} />
            </View>
            <View style={[st.avatar, { borderColor: color }]}>
              <Text style={st.avatarText}>{person.avatarInitial}</Text>
              <Text style={st.avatarSign}>{ZODIAC_SYMBOLS[person.sunSign]}</Text>
            </View>
          </View>
          <Text style={st.heroTitle}>
            {user.preferredName} & {person.name}
          </Text>
          <View style={[st.labelBadge, { backgroundColor: `${color}15` }]}>
            <Text style={[st.labelText, { color }]}>{person.compatibilityLabel}</Text>
          </View>
        </View>

        {/* Blended summary — leads the experience */}
        <View style={st.summaryCard}>
          <Sparkles size={16} color={SolunaColors.warmGold} />
          <Text style={st.summaryText}>{person.blendedSummary}</Text>
        </View>

        {/* Small blended scores (secondary, not primary) */}
        <View style={st.blendedRow}>
          <View style={st.blendedItem}>
            <Text style={st.blendedEmoji}>♋</Text>
            <Text style={st.blendedScore}>{person.compatibilityScore}%</Text>
            <Text style={st.blendedSys}>Astro</Text>
          </View>
          <View style={st.blendedDivider} />
          <View style={st.blendedItem}>
            <Hash size={14} color={SolunaColors.gentleLavender} />
            <Text style={st.blendedScore}>{person.numerologyScore}%</Text>
            <Text style={st.blendedSys}>Nums</Text>
          </View>
          <View style={st.blendedDivider} />
          <View style={st.blendedItem}>
            <Bird size={14} color={SolunaColors.softPeach} />
            <Text style={st.blendedScore}>{person.chineseScore}%</Text>
            <Text style={st.blendedSys}>Chinese</Text>
          </View>
        </View>

        {/* Lens Tabs */}
        <View style={st.lensWrap}>
          {(["Romance", "Friendship", "Work", "Family"] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[st.lensTab, lens === l && { backgroundColor: `${color}15`, borderColor: `${color}30` }]}
              onPress={() => setLens(l)}
            >
              <Text style={[st.lensText, lens === l && { color }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Where You Flow (primary) */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Sparkles size={16} color={SolunaColors.warmGold} />
            <Text style={st.sectionTitle}>Where you flow</Text>
          </View>
          <Text style={st.sectionText}>{person.whereYouFlow}</Text>
        </View>

        {/* Where You Grow */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Sparkles size={16} color={SolunaColors.gentleLavender} />
            <Text style={st.sectionTitle}>Where you grow</Text>
          </View>
          <Text style={st.sectionText}>{person.whereYouGrow}</Text>
        </View>

        {/* How to Support Each Other */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Heart size={16} color={SolunaColors.softPeach} />
            <Text style={st.sectionTitle}>How to support each other</Text>
          </View>
          {person.howToLove.map((tip, i) => (
            <View key={i} style={st.tipRow}>
              <Text style={st.tipBullet}>{i + 1}.</Text>
              <Text style={st.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Why the systems say this */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Sparkles size={16} color={SolunaColors.warmGold} />
            <Text style={st.sectionTitle}>Why the systems say this</Text>
          </View>
          <Text style={st.sectionText}>
            Your blending across astrology, numerology, and Chinese astrology shows a
            connection that's {person.compatibilityScore >= 80 ? "naturally harmonious" : "rich with growth potential"}. 
            The combined score reflects how your core energies interact — not a judgment, 
            but a map to navigate with care.
          </Text>
        </View>

        {/* Resonance feedback on the compatibility insight */}
        <ResonanceFeedbackCard
          sourceType="compatibility"
          sourceId={id}
          systemsReferenced={["astrology", "numerology", "chinese"]}
        />

        {/* Lens insight */}
        <View style={st.lensInsightCard}>
          <Text style={st.lensInsightLabel}>{lens} insight</Text>
          <Text style={st.lensInsightText}>{lensTips[lens]}</Text>
        </View>

        {/* Ask Soluna about this bond */}
        <TouchableOpacity
          style={st.askBtn}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/ask",
              params: {
                prompt: `Tell me more about my connection with ${person.name}`,
              },
            })
          }
        >
          <Sparkles size={16} color={SolunaColors.warmGold} />
          <Text style={st.askBtnText}>Ask Soluna about this connection</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={st.shareBtn} activeOpacity={0.8}>
          <Share2 size={16} color={SolunaColors.warmGold} />
          <Text style={st.shareBtnText}>Share this result</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  hero: { alignItems: "center", marginBottom: 16 },
  avatarsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.heading },
  avatarSign: { fontSize: 16, marginTop: -4 },
  avatarsConnector: { alignItems: "center" },
  heroTitle: { fontSize: 22, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 8 },
  labelBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  labelText: { fontSize: 12, fontWeight: "600", fontFamily: Fonts.body },
  // Summary
  summaryCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "rgba(232,184,109,0.05)", borderRadius: SolunaRadius.md,
    padding: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 12,
  },
  summaryText: { flex: 1, fontSize: 13, color: SolunaColors.cream, lineHeight: 20, fontFamily: Fonts.body },
  // Blended scores
  blendedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 },
  blendedItem: { alignItems: "center", gap: 2 },
  blendedEmoji: { fontSize: 14 },
  blendedScore: { fontSize: 13, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  blendedSys: { fontSize: 9, color: SolunaColors.creamSubtle, fontWeight: "600" },
  blendedDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.08)" },
  // Lens tabs
  lensWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: SolunaRadius.md, padding: 4, marginBottom: 20 },
  lensTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: SolunaRadius.sm, borderWidth: 1, borderColor: "transparent" },
  lensText: { fontSize: 12, fontWeight: "600", color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  // Sections
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  sectionText: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 22, fontFamily: Fonts.body },
  tipRow: { flexDirection: "row", gap: 8, marginBottom: 8, paddingLeft: 4 },
  tipBullet: { fontSize: 13, fontWeight: "700", color: SolunaColors.softPeach, fontFamily: Fonts.body, width: 18 },
  tipText: { flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body },
  lensInsightCard: {
    backgroundColor: "rgba(242,168,141,0.05)", borderRadius: SolunaRadius.md, padding: 16,
    borderWidth: 1, borderColor: "rgba(242,168,141,0.1)", marginBottom: 16,
  },
  lensInsightLabel: {
    fontSize: 10, color: SolunaColors.softPeach, textTransform: "uppercase",
    letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 6,
  },
  lensInsightText: { fontSize: 14, color: SolunaColors.cream, lineHeight: 22, fontFamily: Fonts.body },
  // Ask
  askBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "rgba(232,184,109,0.08)", borderRadius: SolunaRadius.lg,
    paddingVertical: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)", marginBottom: 12,
  },
  askBtnText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  // Share
  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.lg,
    paddingVertical: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)",
  },
  shareBtnText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});
