import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getPersonalizationProfile, type SystemFit } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataStates";
import EmptyState from "@/components/EmptyState";
import { ChevronLeft, Sparkles, Compass } from "lucide-react-native";

// Friendly labels for the lenses the resonance loop tracks.
const SYSTEM_LABEL: Record<string, string> = {
  astrology: "Western Astrology",
  bazi: "BaZi · Four Pillars",
  numerology: "Numerology",
  tarot: "Tarot",
  human_design: "Human Design",
  chinese: "Chinese Zodiac",
};
const ROW_COLORS = [SolunaColors.warmGold, SolunaColors.gentleLavender, SolunaColors.softPeach];

const label = (s: string) => SYSTEM_LABEL[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function FitRow({ fit, rank }: { fit: SystemFit; rank: number }) {
  const color = ROW_COLORS[rank % ROW_COLORS.length];
  const pct = Math.round(fit.score * 100);
  return (
    <View style={s.row}>
      <View style={s.rowHeader}>
        <Text style={s.rowName}>{label(fit.system)}</Text>
        <Text style={[s.rowPct, { color }]}>{pct}%</Text>
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${Math.max(4, pct)}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.rowMeta}>
        {fit.yes} of {fit.total} resonated{!fit.enoughSignal ? " · still building signal" : ""}
      </Text>
    </View>
  );
}

export default function YourSystemsScreen() {
  const { data, loading, error, refetch, reloading } = useAsyncData(() => getPersonalizationProfile(), []);
  const fit = data?.systemFit ?? [];
  const profile = data?.profile ?? null;
  const top = fit[0];

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={SolunaColors.cream} />
        </TouchableOpacity>

        <View style={s.hero}>
          <Compass size={36} color={SolunaColors.warmGold} />
          <Text style={s.heroTitle}>Your Systems</Text>
          <Text style={s.heroSub}>
            Which lenses resonate most with you. Every time you tap 👍 / 🤔 / 👎 on an insight, Soluna
            learns which systems land — and leans into them for you.
          </Text>
        </View>

        {loading ? (
          <LoadingState message="Reading your resonance…" />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} retrying={reloading} />
        ) : fit.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No best-fit yet"
            description="As you read your daily guidance, Ask answers, and blueprint, tap whether each one resonates. Once you've rated a few, your best-fit systems appear here — ranked."
          />
        ) : (
          <>
            {top && (
              <View style={s.bestCard}>
                <Text style={s.bestLabel}>Best fit so far</Text>
                <Text style={s.bestName}>{label(top.system)}</Text>
                <Text style={s.bestMeta}>
                  Resonated with {Math.round(top.score * 100)}% of what you've rated from this lens
                  {!top.enoughSignal ? " — rate a few more to confirm" : ""}.
                </Text>
              </View>
            )}

            <Text style={s.sectionLabel}>Your resonance ranking</Text>
            {fit.map((f, i) => <FitRow key={f.system} fit={f} rank={i} />)}

            {profile?.summary ? (
              <View style={s.summaryCard}>
                <View style={s.summaryHeader}>
                  <Sparkles size={16} color={SolunaColors.warmGold} />
                  <Text style={s.summaryTitle}>What Soluna has learned about you</Text>
                </View>
                <Text style={s.summaryText}>{profile.summary}</Text>
              </View>
            ) : null}
          </>
        )}

        <Text style={s.footerNote}>
          This reflects only what you've said resonates — it tunes how Soluna talks with you. It never
          changes your actual chart: your placements, pillars, numbers, and cards stay exactly as computed.
        </Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60 },
  backBtn: { width: 40, height: 40, justifyContent: "center", marginBottom: 8 },
  hero: { alignItems: "center", marginBottom: 24 },
  heroTitle: { fontSize: 26, fontFamily: Fonts.heading, color: SolunaColors.cream, marginTop: 10, marginBottom: 8 },
  heroSub: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, textAlign: "center", lineHeight: 20 },
  bestCard: { backgroundColor: "rgba(232,184,109,0.1)", borderRadius: SolunaRadius.lg, padding: 18, borderWidth: 1, borderColor: "rgba(232,184,109,0.25)", marginBottom: 20 },
  bestLabel: { fontSize: 11, color: SolunaColors.warmGold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 4 },
  bestName: { fontSize: 22, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 6 },
  bestMeta: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 19 },
  sectionLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 12 },
  row: { marginBottom: 16 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  rowName: { fontSize: 15, color: SolunaColors.cream, fontFamily: Fonts.body, fontWeight: "600" },
  rowPct: { fontSize: 15, fontWeight: "700", fontFamily: Fonts.body },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  rowMeta: { fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, marginTop: 5 },
  summaryCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 18, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginTop: 12 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  summaryTitle: { fontSize: 14, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  summaryText: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 20 },
  footerNote: { fontSize: 11, color: SolunaColors.creamSubtle, fontStyle: "italic", fontFamily: Fonts.body, lineHeight: 17, marginTop: 24 },
});
