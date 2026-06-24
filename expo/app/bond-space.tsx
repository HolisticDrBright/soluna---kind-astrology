import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useBondSpace, useUnlinkBond, useUpdateBondPrefs } from "@/lib/hooks";
import { ChevronLeft, Heart, Sparkles, Link2Off } from "lucide-react-native";

const PREF_LABELS: { key: string; label: string }[] = [
  { key: "shareSun", label: "Sun sign" },
  { key: "shareMoon", label: "Moon sign" },
  { key: "shareNumbers", label: "Life Path number" },
  { key: "shareChinese", label: "Chinese sign" },
  { key: "shareHumanDesign", label: "Human Design type" },
];

export default function BondSpaceScreen() {
  const { linkId } = useLocalSearchParams<{ linkId: string }>();
  const { data, isLoading, error, refetch } = useBondSpace(linkId);
  const updatePrefs = useUpdateBondPrefs(linkId ?? "");
  const unlink = useUnlinkBond();

  const onUnlink = () => {
    Alert.alert("Unlink this Bond?", "You'll both stop receiving the shared daily reading. You can always reconnect later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink", style: "destructive",
        onPress: async () => { if (linkId) { await unlink.mutateAsync(linkId); router.back(); } },
      },
    ]);
  };

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>

        {isLoading && <View style={s.center}><ActivityIndicator color={SolunaColors.warmGold} /><Text style={s.muted}>Opening your Bond…</Text></View>}

        {error && (
          <View style={s.center}>
            <Text style={s.muted}>{error instanceof Error ? error.message : "Couldn't load this Bond."}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}><Text style={s.retryText}>Try again</Text></TouchableOpacity>
          </View>
        )}

        {data && (
          <>
            <View style={s.heroWrap}>
              <Heart size={32} color={SolunaColors.softPeach} />
              <Text style={s.heroTitle}>You & {data.partner.name}</Text>
              <Text style={s.heroSub}>{data.link.lens.charAt(0).toUpperCase() + data.link.lens.slice(1)} Bond</Text>
            </View>

            {/* Today's together reading */}
            <View style={s.card}>
              <View style={s.cardHeaderRow}><Sparkles size={16} color={SolunaColors.warmGold} /><Text style={s.cardLabel}>TODAY, TOGETHER</Text></View>
              <Text style={s.togetherText}>{data.bond.togetherText}</Text>
              <Text style={s.weather}>{data.bond.sharedWeather}</Text>
            </View>

            <View style={s.row}>
              <View style={[s.card, s.flex1]}>
                <Text style={s.cardLabel}>WHERE YOU FLOW</Text>
                <Text style={s.flowText}>{data.bond.flowGrow.flow}</Text>
              </View>
              <View style={[s.card, s.flex1]}>
                <Text style={s.cardLabel}>WHERE YOU GROW</Text>
                <Text style={s.growText}>{data.bond.flowGrow.grow}</Text>
              </View>
            </View>

            {/* Blended compatibility */}
            <View style={s.card}>
              <View style={s.cardHeaderRow}>
                <Text style={s.cardLabel}>BLENDED COMPATIBILITY</Text>
                <Text style={s.score}>{data.compatibility.score}%</Text>
              </View>
              <Text style={s.compatLabel}>{data.compatibility.label}</Text>
              <Text style={s.compatSummary}>{data.compatibility.blendedSummary}</Text>
              <View style={s.subScores}>
                {[["Astrology", data.compatibility.astrologyScore], ["Numerology", data.compatibility.numerologyScore], ["Chinese", data.compatibility.chineseScore]].map(([l, v]) => (
                  <View key={l as string} style={s.subScore}><Text style={s.subScoreVal}>{v}%</Text><Text style={s.subScoreLabel}>{l}</Text></View>
                ))}
              </View>
            </View>

            {/* Share controls */}
            <Text style={s.sectionLabel}>What you share</Text>
            <View style={s.card}>
              {PREF_LABELS.map(({ key, label }, i) => (
                <View key={key} style={[s.prefRow, i < PREF_LABELS.length - 1 && s.prefBorder]}>
                  <Text style={s.prefLabel}>{label}</Text>
                  <Switch
                    value={data.sharePrefs[key] !== false}
                    onValueChange={(v) => updatePrefs.mutate({ [key]: v })}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(232,184,109,0.3)" }}
                    thumbColor={data.sharePrefs[key] !== false ? SolunaColors.warmGold : SolunaColors.creamSubtle}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.unlinkBtn} onPress={onUnlink}>
              <Link2Off size={16} color={SolunaColors.creamSubtle} />
              <Text style={s.unlinkText}>Unlink this Bond</Text>
            </TouchableOpacity>
            <View style={{ height: 60 }} />
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  center: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  muted: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, textAlign: "center" },
  retryBtn: { backgroundColor: "rgba(232,184,109,0.1)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: SolunaRadius.md },
  retryText: { color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  heroWrap: { alignItems: "center", marginBottom: 20, gap: 6 },
  heroTitle: { fontSize: 26, fontFamily: Fonts.heading, color: SolunaColors.cream, marginTop: 8 },
  heroSub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  card: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 18, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 12 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  cardLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body },
  togetherText: { fontSize: 16, color: SolunaColors.cream, lineHeight: 25, fontFamily: Fonts.heading, marginBottom: 10 },
  weather: { fontSize: 13, color: SolunaColors.gentleLavender, fontFamily: Fonts.body, fontStyle: "italic" },
  row: { flexDirection: "row", gap: 10 },
  flex1: { flex: 1 },
  flowText: { fontSize: 13, color: SolunaColors.cream, lineHeight: 19, fontFamily: Fonts.body },
  growText: { fontSize: 13, color: SolunaColors.softPeach, lineHeight: 19, fontFamily: Fonts.body },
  score: { fontSize: 20, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.heading },
  compatLabel: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 6 },
  compatSummary: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 20, fontFamily: Fonts.body, marginBottom: 14 },
  subScores: { flexDirection: "row", justifyContent: "space-around" },
  subScore: { alignItems: "center" },
  subScoreVal: { fontSize: 16, fontWeight: "700", color: SolunaColors.gentleLavender, fontFamily: Fonts.body },
  subScoreLabel: { fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  sectionLabel: { fontSize: 12, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 10, marginTop: 4 },
  prefRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  prefBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  prefLabel: { fontSize: 14, color: SolunaColors.cream, fontFamily: Fonts.body },
  unlinkBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginTop: 8 },
  unlinkText: { fontSize: 13, color: SolunaColors.creamSubtle, fontFamily: Fonts.body },
});
