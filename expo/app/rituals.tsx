import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { RITUALS } from "@/constants/demoData";
import { isDemoMode } from "@/lib/runtimeMode";
import ComingSoon from "@/components/ComingSoon";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getRituals, saveItem } from "@/lib/api";
import { LoadingState } from "@/components/DataStates";

function LoadingWrap({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={{ flex: 1, justifyContent: "center" }}>
      {children}
    </LinearGradient>
  );
}
import { ChevronLeft, Moon, Sparkles, Check } from "lucide-react-native";

interface LiveRitual { id: string; title: string; moonPhase: string; description: string; steps: string[]; intention: string }

/** Map a backend rituals row (moon_phase, title, steps jsonb) into the card shape. */
function toLiveRitual(raw: unknown, i: number): LiveRitual | null {
  const r = raw as { id?: unknown; title?: unknown; moon_phase?: unknown; description?: unknown; steps?: unknown; intention?: unknown } | null;
  if (!r || !r.title) return null;
  const steps = Array.isArray(r.steps) ? r.steps.map(String) : [];
  const phaseRaw = String(r.moon_phase ?? "").replace(/_/g, " ");
  const phase = phaseRaw ? phaseRaw.replace(/\b\w/g, (c) => c.toUpperCase()) : "Moon Ritual";
  return {
    id: String(r.id ?? i),
    title: String(r.title),
    moonPhase: phase.includes("Full") ? `${phase} 🌕` : phase.includes("New") ? `${phase} 🌑` : phase,
    description: String(r.description ?? ""),
    steps,
    intention: String(r.intention ?? "Set one gentle intention — small is perfect."),
  };
}

export default function RitualsScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Live mode: the backend's seeded rituals (getRituals). Honest states.
  const liveQuery = useAsyncData(() => getRituals(), [], { enabled: !isDemoMode });
  const liveRituals: LiveRitual[] = (Array.isArray(liveQuery.data?.rituals) ? liveQuery.data.rituals : [])
    .map(toLiveRitual)
    .filter((r): r is LiveRitual => r !== null);

  if (!isDemoMode) {
    if (liveQuery.loading) {
      return <LoadingWrap><LoadingState message="Gathering tonight's rituals…" /></LoadingWrap>;
    }
    if (liveQuery.error || liveRituals.length === 0) {
      return (
        <ComingSoon
          title="Moon rituals"
          description={liveQuery.error ?? "Rituals aren't available just now — check back around the next new or full moon."}
        />
      );
    }
  }

  const rituals: LiveRitual[] = isDemoMode ? (RITUALS as unknown as LiveRitual[]) : liveRituals;

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>

        <Text style={s.title}>Moon Rituals</Text>
        <Text style={s.sub}>Gentle, optional practices to honor the lunar rhythm. Never preachy — always an invitation.</Text>

        {isDemoMode && (
        <View style={s.lunarCalendar}>
          <Text style={s.calendarTitle}>🌙 Lunar Calendar</Text>
          <View style={s.calendarRow}>
            {["🌑 New", "🌓 First Q", "🌕 Full", "🌗 Last Q"].map((phase) => (
              <View key={phase} style={s.calendarPhase}>
                <Text style={s.calendarEmoji}>{phase.split(" ")[0]}</Text>
                <Text style={s.calendarLabel}>{phase.split(" ")[1]}</Text>
              </View>
            ))}
          </View>
          <Text style={s.calendarNote}>Next Full Moon: June 26, 2026 · Next New Moon: July 11, 2026</Text>
        </View>
        )}

        {rituals.map((ritual) => (
          <TouchableOpacity
            key={ritual.id}
            style={s.ritualCard}
            onPress={() => setExpandedId(expandedId === ritual.id ? null : ritual.id)}
            activeOpacity={0.8}
          >
            <View style={s.ritualHeader}>
              <View style={s.ritualHeaderLeft}>
                <Moon size={20} color={SolunaColors.gentleLavender} />
                <View>
                  <Text style={s.ritualTitle}>{ritual.title}</Text>
                  <Text style={s.ritualPhase}>{ritual.moonPhase}</Text>
                </View>
              </View>
              <Sparkles size={16} color={SolunaColors.warmGold} />
            </View>
            <Text style={s.ritualDesc}>{ritual.description}</Text>

            {expandedId === ritual.id && (
              <View style={s.expandedContent}>
                <Text style={s.stepsTitle}>Your Ritual</Text>
                {ritual.steps.map((step, i) => (
                  <View key={i} style={s.stepRow}>
                    <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
                <View style={s.intentionCard}>
                  <Sparkles size={16} color={SolunaColors.warmGold} />
                  <Text style={s.intentionText}>{ritual.intention}</Text>
                </View>
                <TouchableOpacity
                  style={s.saveBtn}
                  activeOpacity={0.7}
                  onPress={() => { if (!isDemoMode) void saveItem("ritual", ritual.id); }}
                >
                  <Check size={16} color={SolunaColors.deepIndigo} />
                  <Text style={s.saveBtnText}>Save this ritual</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <Text style={s.footerNote}>Rituals are entirely optional. They're here when you want them — no pressure, no guilt, no "should."</Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 20, marginBottom: 20 },
  lunarCalendar: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 20 },
  calendarTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 14 },
  calendarRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 14 },
  calendarPhase: { alignItems: "center", gap: 4 },
  calendarEmoji: { fontSize: 24 },
  calendarLabel: { fontSize: 11, color: SolunaColors.creamMuted, fontWeight: "600", fontFamily: Fonts.body },
  calendarNote: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", fontFamily: Fonts.body, fontStyle: "italic" },
  ritualCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 14 },
  ritualHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  ritualHeaderLeft: { flexDirection: "row", gap: 12, alignItems: "flex-start", flex: 1 },
  ritualTitle: { fontSize: 17, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 2 },
  ritualPhase: { fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body },
  ritualDesc: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 21, fontFamily: Fonts.body },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  stepsTitle: { fontSize: 14, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 14 },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(185,163,227,0.15)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  stepNumText: { fontSize: 12, fontWeight: "700", color: SolunaColors.gentleLavender },
  stepText: { flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 22, fontFamily: Fonts.body },
  intentionCard: { flexDirection: "row", gap: 10, backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.md, padding: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 14, alignItems: "flex-start" },
  intentionText: { flex: 1, fontSize: 14, color: SolunaColors.warmGold, lineHeight: 22, fontFamily: Fonts.body, fontStyle: "italic" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: SolunaColors.gentleLavender, paddingVertical: 12, borderRadius: SolunaRadius.md },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  footerNote: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 19, fontFamily: Fonts.body, fontStyle: "italic", paddingHorizontal: 20, marginTop: 8 },
});
