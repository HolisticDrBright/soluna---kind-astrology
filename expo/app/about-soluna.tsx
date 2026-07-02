import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { ChevronLeft, Shield, Sparkles, Heart, Eye } from "lucide-react-native";

/**
 * How Soluna works — the trust page. The engineering honesty (real providers,
 * never-fabricate, no data sale, no training on chats) is a differentiator;
 * this makes it visible instead of buried in code.
 */
export default function AboutSolunaScreen() {
  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={SolunaColors.cream} />
        </TouchableOpacity>

        <Text style={s.title}>How Soluna works</Text>
        <Text style={s.sub}>Astrology that's actually kind — and actually adds up.</Text>

        <View style={s.card}>
          <View style={s.cardHeader}><Sparkles size={18} color={SolunaColors.warmGold} /><Text style={s.cardTitle}>Where your readings come from</Text></View>
          <Text style={s.body}>
            Your charts are computed from real astronomical and traditional data — a real ephemeris for your Western chart, sidereal calculations for your Vedic chart, the sexagenary calendar for BaZi, and deterministic math for your numbers. Soluna's voice then phrases what the systems show, following strict tone rules: warm, specific, growth-oriented, and never doom.
          </Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}><Eye size={18} color={SolunaColors.gentleLavender} /><Text style={s.cardTitle}>What we never do</Text></View>
          <Text style={s.body}>• We never invent chart data. If your birth time is missing, time-dependent parts say so — they are never guessed.</Text>
          <Text style={s.body}>• We never sell your data, and we never train AI on your conversations.</Text>
          <Text style={s.body}>• We never predict doom, health outcomes, or fated endings. Every lens here is reflective — never a verdict.</Text>
          <Text style={s.body}>• We never make cancellation hard. Subscriptions cancel in one tap through the App Store.</Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}><Heart size={18} color={SolunaColors.softPeach} /><Text style={s.cardTitle}>The idea behind Soluna</Text></View>
          <Text style={s.body}>
            Most apps read one system. Soluna reads your Western astrology, numerology, Chinese astrology and BaZi, Human Design–inspired energy, Vedic chart, and tarot together — and shows you where independent systems agree. When separate traditions point the same way, that convergence is worth sitting with. Where they differ, that contrast is interesting too.
          </Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}><Shield size={18} color={SolunaColors.warmGold} /><Text style={s.cardTitle}>A gentle disclaimer</Text></View>
          <Text style={s.body}>
            Soluna is for reflection, encouragement, and self-understanding. It is not medical, financial, legal, or psychological advice, and no reading here decides your future — you do. If you're going through something heavy, please reach out to someone you trust or a professional. We'll be here with something warm when you get back.
          </Text>
        </View>

        <Text style={s.footer}>Made with care. Your birth data stays yours.</Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { marginBottom: 10 },
  title: { fontSize: 26, color: SolunaColors.cream, fontFamily: Fonts.heading, marginBottom: 6 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, marginBottom: 18 },
  card: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: SolunaRadius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  body: { fontSize: 13.5, lineHeight: 21, color: SolunaColors.creamMuted, marginBottom: 6 },
  footer: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", marginTop: 8 },
});
