import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Crown, Sparkles, X, Check, ShieldCheck, Star, Hash, Bird, Cpu } from "lucide-react-native";

function Benefit({ text }: { text: string }) {
  return (
    <View style={bS.row}><Check size={18} color={SolunaColors.warmGold} /><Text style={bS.text}>{text}</Text></View>
  );
}
const bS = StyleSheet.create({ row: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 14 }, text: { flex: 1, fontSize: 15, color: SolunaColors.cream, lineHeight: 22, fontFamily: Fonts.body } });

function PricingCard({ title, price, period, savings, selected, onSelect }: { title: string; price: string; period: string; savings?: string; selected: boolean; onSelect: () => void }) {
  return (
    <TouchableOpacity style={[pS.card, selected && pS.cardSelected]} onPress={onSelect} activeOpacity={0.8}>
      <View style={pS.radio}><View style={[pS.radioOuter, selected && pS.radioOuterSelected]}>{selected && <View style={pS.radioInner} />}</View></View>
      <View style={pS.info}><Text style={pS.title}>{title}</Text>{savings && <View style={pS.savingsBadge}><Text style={pS.savingsText}>{savings}</Text></View>}</View>
      <View style={pS.priceWrap}><Text style={pS.price}>{price}</Text><Text style={pS.period}>{period}</Text></View>
    </TouchableOpacity>
  );
}
const pS = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10, gap: 14 },
  cardSelected: { borderColor: "rgba(232,184,109,0.3)", backgroundColor: "rgba(232,184,109,0.05)" },
  radio: { justifyContent: "center" },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: SolunaColors.warmGold },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: SolunaColors.warmGold },
  info: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body },
  savingsBadge: { backgroundColor: "rgba(232,184,109,0.12)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  savingsText: { fontSize: 10, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body },
  priceWrap: { alignItems: "flex-end" },
  price: { fontSize: 18, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  period: { fontSize: 11, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
});

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  return (
    <View style={st.overlay}>
      <Pressable style={st.dismissArea} onPress={() => router.back()} />
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.sheet}>
        <ScrollView contentContainerStyle={st.sheetContent} showsVerticalScrollIndicator={false} bounces={false}>
          <View style={st.topBar}>
            <View style={st.premBadge}><Crown size={12} color={SolunaColors.warmGold} /><Text style={st.premBadgeText}>SOLUNA PREMIUM</Text></View>
            <TouchableOpacity style={st.closeBtn} onPress={() => router.back()}><X size={20} color={SolunaColors.creamMuted} /></TouchableOpacity>
          </View>

          <View style={st.headlineWrap}>
            <Sparkles size={28} color={SolunaColors.warmGold} />
            <Text style={st.headline}>Your full Blueprint,{'\n'}fully unlocked</Text>
            <Text style={st.headlineSub}>All four lenses. Unlimited guidance. Cross-system synthesis that shows you where everything connects.</Text>
          </View>

          <View style={st.systemsRow}>
            {[
              { icon: Star, label: "Astrology", color: SolunaColors.warmGold },
              { icon: Hash, label: "Numerology", color: SolunaColors.gentleLavender },
              { icon: Bird, label: "Chinese", color: SolunaColors.softPeach },
              { icon: Cpu, label: "Human Design", color: SolunaColors.warmGold },
            ].map((sys) => (
              <View key={sys.label} style={st.sysItem}>
                <sys.icon size={20} color={sys.color} />
                <Text style={st.sysLabel}>{sys.label}</Text>
              </View>
            ))}
          </View>

          <View style={st.benefitsWrap}>
            <Benefit text="All four lenses fully unlocked — Astrology, Numerology, Chinese Astrology, and Human Design" />
            <Benefit text="Unlimited Ask Soluna — personalized cross-system guidance whenever you need it" />
            <Benefit text="Full compatibility for everyone in your circle across Romance, Friendship, Work & Family" />
            <Benefit text="All transits, BaZi deep insights, and premium daily content" />
            <Benefit text="Extra tarot spreads, expanded rituals, and cosmic journal prompts" />
          </View>

          <PricingCard title="Monthly" price="$6.99" period="/ month" selected={selectedPlan === "monthly"} onSelect={() => setSelectedPlan("monthly")} />
          <PricingCard title="Yearly" price="$4.99" period="/ month" savings="Save $24/yr" selected={selectedPlan === "yearly"} onSelect={() => setSelectedPlan("yearly")} />

          <TouchableOpacity style={st.ctaBtn} activeOpacity={0.8}>
            <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.ctaGradient}>
              <Text style={st.ctaText}>Start Your Free Trial</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={st.ctaSub}>7-day free trial, then {selectedPlan === "yearly" ? "$4.99/month" : "$6.99/month"}</Text>

          <View style={st.extraOption}>
            <Text style={st.extraLabel}>Extra tarot spreads:</Text>
            <Text style={st.extraPrice}>$1.99 per reading</Text>
          </View>

          <View style={st.footer}>
            <ShieldCheck size={14} color={SolunaColors.creamSubtle} />
            <Text style={st.footerText}>Cancel anytime in one tap, right inside the app — no tricks, no retention flows, no surprise charges. Your birth data stays yours. We never sell it, never share it, and never train on your chats. If Soluna isn't right for you, we want you to leave easily — and come back whenever you're ready.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  dismissArea: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { maxHeight: "85%", borderTopLeftRadius: SolunaRadius.xl, borderTopRightRadius: SolunaRadius.xl, overflow: "hidden" },
  sheetContent: { paddingHorizontal: SolunaSpacing.lg, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 20, marginBottom: 20 },
  premBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.12)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  premBadgeText: { fontSize: 10, fontWeight: "800", color: SolunaColors.warmGold, letterSpacing: 1.5, fontFamily: Fonts.body },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  headlineWrap: { alignItems: "center", marginBottom: 20 },
  headline: { fontSize: 26, fontFamily: Fonts.heading, color: SolunaColors.cream, textAlign: "center", marginTop: 12, marginBottom: 10, lineHeight: 34 },
  headlineSub: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 22, maxWidth: 320, fontFamily: Fonts.body },
  systemsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 24 },
  sysItem: { alignItems: "center", gap: 6 },
  sysLabel: { fontSize: 10, color: SolunaColors.creamMuted, fontWeight: "600" },
  benefitsWrap: { marginBottom: 24 },
  ctaBtn: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginBottom: 10 },
  ctaGradient: { paddingVertical: 16, alignItems: "center" },
  ctaText: { fontSize: 17, fontWeight: "700", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  ctaSub: { fontSize: 13, color: SolunaColors.creamSubtle, textAlign: "center", marginBottom: 14, fontFamily: Fonts.body },
  extraOption: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  extraLabel: { fontSize: 13, color: SolunaColors.creamMuted },
  extraPrice: { fontSize: 13, color: SolunaColors.warmGold, fontWeight: "600" },
  footer: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  footerText: { flex: 1, fontSize: 11, color: SolunaColors.creamSubtle, lineHeight: 17, fontFamily: Fonts.body },
});
