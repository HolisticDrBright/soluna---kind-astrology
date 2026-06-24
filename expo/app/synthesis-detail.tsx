import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { SYNTHESIS_THEMES, Fonts } from "@/constants/mockData";
import { ChevronLeft, Sparkles, Star, Moon, Hash, Bird, Cpu, Heart } from "lucide-react-native";

const systemIcons: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  astrology: Star,
  numerology: Hash,
  chinese: Bird,
  humanDesign: Cpu,
};

const systemColors: Record<string, string> = {
  astrology: SolunaColors.warmGold,
  numerology: SolunaColors.gentleLavender,
  chinese: SolunaColors.softPeach,
  humanDesign: SolunaColors.warmGold,
};

export default function SynthesisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = SYNTHESIS_THEMES.find((t) => t.id === id);
  if (!theme) return null;

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>

        {/* Hero */}
        <View style={s.heroWrap}>
          <View style={s.systemsBadgeWrap}>
            {theme.blocks.map((_, i) => (
              <View key={i} style={s.sysGlyph}>
                <Text style={s.sysGlyphText}>{["♋", "3", "🐖", "⚡"][i]}</Text>
              </View>
            ))}
          </View>
          <Text style={s.heroTitle}>{theme.title}</Text>
          <Text style={s.heroSub}>{theme.subtitle}</Text>
          <View style={s.agreeBadge}>
            <Sparkles size={14} color={SolunaColors.warmGold} />
            <Text style={s.agreeText}>{theme.systemsAgree} systems agree</Text>
          </View>
        </View>

        {/* Individual system signals */}
        <Text style={s.sectionTitle}>Each System's Signal</Text>
        {theme.blocks.map((block) => {
          const Icon = systemIcons[block.system] || Star;
          const color = systemColors[block.system] || SolunaColors.warmGold;
          return (
            <View key={block.system} style={[s.blockCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
              <View style={s.blockHeader}>
                <Icon size={16} color={color} />
                <Text style={[s.blockLabel, { color }]}>{block.label}</Text>
              </View>
              <Text style={s.blockSignal}>{block.signal}</Text>
            </View>
          );
        })}

        {/* Combined takeaway */}
        <View style={s.combinedCard}>
          <View style={s.combinedHeader}>
            <Sparkles size={18} color={SolunaColors.warmGold} />
            <Text style={s.combinedTitle}>Combined Takeaway</Text>
          </View>
          <Text style={s.combinedText}>{theme.combinedTakeaway}</Text>
        </View>

        <Text style={s.footerNote}>When independent systems converge like this, it's not coincidence — it's your blueprint speaking clearly. The more lenses agree, the more you can trust the signal.</Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heroWrap: { alignItems: "center", marginBottom: 28 },
  systemsBadgeWrap: { flexDirection: "row", gap: 6, marginBottom: 16 },
  sysGlyph: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(232,184,109,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(232,184,109,0.2)" },
  sysGlyphText: { fontSize: 16 },
  heroTitle: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, textAlign: "center", marginBottom: 8 },
  heroSub: { fontSize: 15, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 22, maxWidth: 300, marginBottom: 12 },
  agreeBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.1)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  agreeText: { fontSize: 13, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body },
  sectionTitle: { fontSize: 13, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 14 },
  blockCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  blockLabel: { fontSize: 14, fontWeight: "700", fontFamily: Fonts.body },
  blockSignal: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 21, fontFamily: Fonts.body },
  combinedCard: { backgroundColor: "rgba(232,184,109,0.05)", borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)", marginBottom: 20, marginTop: 8 },
  combinedHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  combinedTitle: { fontSize: 17, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  combinedText: { fontSize: 15, color: SolunaColors.cream, lineHeight: 24, fontFamily: Fonts.body },
  footerNote: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 19, fontFamily: Fonts.body, fontStyle: "italic", paddingHorizontal: 20 },
});
