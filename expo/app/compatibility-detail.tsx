import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { useAuth } from "@/state/useAuth";
import { useCompatibility, useConnections } from "@/lib/hooks";
import { CONNECTIONS, ZODIAC_SYMBOLS, Fonts, type RelationshipLens, type ZodiacSign } from "@/constants/mockData";
import { ChevronLeft, Heart, Star, Sparkles, Share2, Hash, Bird } from "lucide-react-native";

interface CompatView {
  name: string;
  initial: string;
  sunSign?: ZodiacSign;
  score: number;
  label: string;
  astrologyScore: number;
  numerologyScore: number;
  chineseScore: number;
  blendedSummary: string;
  whereYouFlow: string;
  whereYouGrow: string;
  howToLove: string[];
  lensTip: string;
}

export default function CompatibilityDetailScreen() {
  const { id, lens: lensParam } = useLocalSearchParams<{ id: string; lens?: string }>();
  const { user } = useAppState();
  const { authActive, isAuthenticated } = useAuth();
  const live = authActive && isAuthenticated;
  const initialLens = (lensParam ? lensParam.charAt(0).toUpperCase() + lensParam.slice(1) : "Romance") as RelationshipLens;
  const [lens, setLens] = useState<RelationshipLens>(["Romance", "Friendship", "Work", "Family"].includes(initialLens) ? initialLens : "Romance");

  const { data: rawConnections } = useConnections();
  const { data: liveCompat, isLoading: compatLoading } = useCompatibility(live ? id : undefined, lens.toLowerCase());

  if (!user || !id) return null;

  // Build a unified view from either the backend or the mock connection.
  let view: CompatView | null = null;
  if (live) {
    const conn = ((rawConnections ?? []) as any[]).find((c) => c.id === id);
    if (liveCompat) {
      view = {
        name: conn?.name ?? "Your connection",
        initial: (conn?.name ?? "?").charAt(0).toUpperCase(),
        sunSign: conn?.blueprint?.summary?.sunSign,
        score: liveCompat.score ?? liveCompat.overall,
        label: liveCompat.label,
        astrologyScore: liveCompat.astrologyScore,
        numerologyScore: liveCompat.numerologyScore,
        chineseScore: liveCompat.chineseScore,
        blendedSummary: liveCompat.blendedSummary,
        whereYouFlow: liveCompat.whereYouFlow,
        whereYouGrow: liveCompat.whereYouGrow,
        howToLove: liveCompat.howToLove ?? [],
        lensTip: liveCompat.tip,
      };
    }
  } else {
    const person = CONNECTIONS.find((c) => c.id === id);
    if (person) {
      const lensTips: Record<RelationshipLens, string> = { Romance: person.romanceTip, Friendship: person.friendshipTip, Work: person.workTip, Family: person.familyTip };
      view = {
        name: person.name, initial: person.avatarInitial, sunSign: person.sunSign,
        score: person.compatibilityScore, label: person.compatibilityLabel,
        astrologyScore: person.compatibilityScore, numerologyScore: person.numerologyScore, chineseScore: person.chineseScore,
        blendedSummary: person.blendedSummary, whereYouFlow: person.whereYouFlow, whereYouGrow: person.whereYouGrow,
        howToLove: person.howToLove, lensTip: lensTips[lens],
      };
    }
  }

  if (!view) {
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={[st.gradient, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={SolunaColors.warmGold} />
        <Text style={{ color: SolunaColors.creamMuted, marginTop: 12, fontFamily: Fonts.body }}>
          {compatLoading ? "Reading your connection…" : "Connection not found."}
        </Text>
      </LinearGradient>
    );
  }
  const person = view;

  const color = person.score >= 80 ? SolunaColors.warmGold : person.score >= 60 ? SolunaColors.gentleLavender : SolunaColors.softPeach;

  const onShare = () => {
    Share.share({ message: `${user.preferredName} & ${person.name} — ${person.score}% ${lens} compatibility on Soluna ✨` });
  };

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView contentContainerStyle={st.scrollContent}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>

        {/* Hero */}
        <View style={st.hero}>
          <View style={st.avatarsRow}>
            <View style={[st.avatar, { borderColor: SolunaColors.softPeach }]}>
              <Text style={st.avatarText}>{user.preferredName.charAt(0)}</Text>
              <Text style={st.avatarSign}>{ZODIAC_SYMBOLS[user.chart.sun.sign]}</Text>
            </View>
            <View style={st.avatarsConnector}>
              <Heart size={20} color={color} fill={color} opacity={0.6} />
              <View style={[st.scoreCircle, { borderColor: color }]}><Text style={[st.scoreText, { color }]}>{person.score}%</Text></View>
            </View>
            <View style={[st.avatar, { borderColor: color }]}>
              <Text style={st.avatarText}>{person.initial}</Text>
              <Text style={st.avatarSign}>{person.sunSign ? ZODIAC_SYMBOLS[person.sunSign] : "✶"}</Text>
            </View>
          </View>
          <Text style={st.heroTitle}>{user.preferredName} & {person.name}</Text>
          <View style={[st.labelBadge, { backgroundColor: `${color}15` }]}><Text style={[st.labelText, { color }]}>{person.label}</Text></View>

          {/* Blended scores */}
          <View style={st.blendedRow}>
            <View style={st.blendedItem}><Text style={st.blendedEmoji}>♋</Text><Text style={st.blendedScore}>{person.astrologyScore}%</Text><Text style={st.blendedSys}>Astro</Text></View>
            <View style={st.blendedDivider} />
            <View style={st.blendedItem}><Hash size={14} color={SolunaColors.gentleLavender} /><Text style={st.blendedScore}>{person.numerologyScore}%</Text><Text style={st.blendedSys}>Nums</Text></View>
            <View style={st.blendedDivider} />
            <View style={st.blendedItem}><Bird size={14} color={SolunaColors.softPeach} /><Text style={st.blendedScore}>{person.chineseScore}%</Text><Text style={st.blendedSys}>Chinese</Text></View>
          </View>

          <Text style={st.blendedSummary}>{person.blendedSummary}</Text>
        </View>

        {/* Lens Tabs */}
        <View style={st.lensWrap}>
          {(["Romance", "Friendship", "Work", "Family"] as const).map((l) => (
            <TouchableOpacity key={l} style={[st.lensTab, lens === l && { backgroundColor: `${color}15`, borderColor: `${color}30` }]} onPress={() => setLens(l)}>
              <Text style={[st.lensText, lens === l && { color }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Where You Flow */}
        <View style={st.section}>
          <View style={st.sectionHeader}><Sparkles size={16} color={SolunaColors.warmGold} /><Text style={st.sectionTitle}>Where You Flow</Text></View>
          <Text style={st.sectionText}>{person.whereYouFlow}</Text>
        </View>

        {/* Where You Grow */}
        <View style={st.section}>
          <View style={st.sectionHeader}><Star size={16} color={SolunaColors.gentleLavender} /><Text style={st.sectionTitle}>Where You Grow</Text></View>
          <Text style={st.sectionText}>{person.whereYouGrow}</Text>
        </View>

        {/* How to Love Well */}
        <View style={st.section}>
          <View style={st.sectionHeader}><Heart size={16} color={SolunaColors.softPeach} /><Text style={st.sectionTitle}>How to Support Each Other</Text></View>
          {person.howToLove.map((tip, i) => (
            <View key={i} style={st.tipRow}><Text style={st.tipBullet}>{i + 1}.</Text><Text style={st.tipText}>{tip}</Text></View>
          ))}
        </View>

        {/* Lens insight */}
        <View style={st.lensInsightCard}>
          <Text style={st.lensInsightLabel}>{lens} insight</Text>
          <Text style={st.lensInsightText}>{person.lensTip}</Text>
        </View>

        {/* Share button */}
        <TouchableOpacity style={st.shareBtn} activeOpacity={0.8} onPress={onShare}>
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
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  hero: { alignItems: "center", marginBottom: 20 },
  avatarsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.heading },
  avatarSign: { fontSize: 18, marginTop: -4 },
  avatarsConnector: { alignItems: "center", gap: 6 },
  scoreCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  scoreText: { fontSize: 13, fontWeight: "800", fontFamily: Fonts.body },
  heroTitle: { fontSize: 24, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 10 },
  labelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginBottom: 14 },
  labelText: { fontSize: 13, fontWeight: "600", fontFamily: Fonts.body },
  blendedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  blendedItem: { alignItems: "center", gap: 2 },
  blendedEmoji: { fontSize: 14 },
  blendedScore: { fontSize: 13, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  blendedSys: { fontSize: 9, color: SolunaColors.creamSubtle, fontWeight: "600" },
  blendedDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.08)" },
  blendedSummary: { fontSize: 13, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 20, fontFamily: Fonts.body, maxWidth: 320 },
  lensWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: SolunaRadius.md, padding: 4, marginBottom: 24 },
  lensTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: SolunaRadius.sm, borderWidth: 1, borderColor: "transparent" },
  lensText: { fontSize: 12, fontWeight: "600", color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  sectionText: { fontSize: 15, color: SolunaColors.creamMuted, lineHeight: 24, fontFamily: Fonts.body },
  tipRow: { flexDirection: "row", gap: 8, marginBottom: 10, paddingLeft: 4 },
  tipBullet: { fontSize: 14, fontWeight: "700", color: SolunaColors.softPeach, fontFamily: Fonts.body, width: 20 },
  tipText: { flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body },
  lensInsightCard: { backgroundColor: "rgba(242,168,141,0.05)", borderRadius: SolunaRadius.md, padding: 18, borderWidth: 1, borderColor: "rgba(242,168,141,0.1)", marginBottom: 16 },
  lensInsightLabel: { fontSize: 11, color: SolunaColors.softPeach, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 8 },
  lensInsightText: { fontSize: 14, color: SolunaColors.cream, lineHeight: 22, fontFamily: Fonts.body },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(232,184,109,0.08)", borderRadius: SolunaRadius.lg, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)" },
  shareBtnText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});
