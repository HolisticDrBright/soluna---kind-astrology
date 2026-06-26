import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Crown, Sparkles, X, ShieldCheck, Star, Infinity, Heart } from "lucide-react-native";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { getCurrentOffering, isRevenueCatAvailable, purchasePackage, restorePurchases } from "@/lib/revenuecat";

function Benefit({ text }: { text: string }) {
  return (
    <View style={bS.row}><Check size={18} color={SolunaColors.warmGold} /><Text style={bS.text}>{text}</Text></View>
  );
}
const bS = StyleSheet.create({ row: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 }, text: { flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body } });

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

function TierCard({ title, items, icon: Icon }: { title: string; items: string[]; icon: React.ComponentType<{ size: number; color: string }> }) {
  return (
    <View style={tcS.card}>
      <View style={tcS.header}><Icon size={18} color={SolunaColors.warmGold} /><Text style={tcS.title}>{title}</Text></View>
      {items.map((item, i) => (
        <View key={i} style={tcS.item}><Sparkles size={10} color={SolunaColors.creamSubtle} /><Text style={tcS.itemText}>{item}</Text></View>
      ))}
    </View>
  );
}
const tcS = StyleSheet.create({
  card: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: SolunaRadius.md, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6, paddingLeft: 4 },
  itemText: { flex: 1, fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 17 },
});

function Check({ size, color }: { size: number; color: string }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "rgba(123,200,156,0.15)", alignItems: "center", justifyContent: "center" }}><Text style={{ color, fontSize: size * 0.7, fontWeight: "700" }}>✓</Text></View>;
}

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(isRevenueCatAvailable());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isRevenueCatAvailable()) { setLoading(false); return; }
    let active = true;
    getCurrentOffering().then((o) => { if (active) { setOffering(o); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const available = isRevenueCatAvailable();
  const monthlyPkg = offering?.monthly ?? offering?.availablePackages?.find((p) => p.packageType === "MONTHLY") ?? null;
  const yearlyPkg = offering?.annual ?? offering?.availablePackages?.find((p) => p.packageType === "ANNUAL") ?? null;
  const selectedPkg: PurchasesPackage | null = selectedPlan === "yearly" ? yearlyPkg : monthlyPkg;

  const onPurchase = async () => {
    if (!selectedPkg || busy) return;
    setBusy(true);
    setMessage("");
    const res = await purchasePackage(selectedPkg);
    setBusy(false);
    if (res.userCancelled) return;
    if (!res.ok) { setMessage(res.error ?? "Purchase didn't complete. Please try again."); return; }
    setMessage("You're all set — welcome to Premium! 💛");
    setTimeout(() => router.back(), 1200);
  };

  const onRestore = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const res = await restorePurchases();
    setBusy(false);
    if (!res.ok) { setMessage(res.error ?? "Couldn't restore purchases."); return; }
    setMessage(res.isPremium ? "Your purchases were restored. 💛" : "No previous purchases found for this account.");
    if (res.isPremium) setTimeout(() => router.back(), 1200);
  };

  return (
    <View style={st.overlay}>
      <Pressable style={st.dismissArea} onPress={() => router.back()} />
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.sheet}>
        <ScrollView contentContainerStyle={st.sheetContent} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Top bar */}
          <View style={st.topBar}>
            <View style={st.premBadge}><Crown size={12} color={SolunaColors.warmGold} /><Text style={st.premBadgeText}>SOLUNA PREMIUM</Text></View>
            <TouchableOpacity style={st.closeBtn} onPress={() => router.back()}><X size={20} color={SolunaColors.creamMuted} /></TouchableOpacity>
          </View>

          {/* Headline */}
          <View style={st.headlineWrap}>
            <Sparkles size={28} color={SolunaColors.warmGold} />
            <Text style={st.headline}>Your full Blueprint,{"\n"}fully unlocked</Text>
            <Text style={st.headlineSub}>All four lenses. Unlimited guidance. Cross-system synthesis that shows you where everything connects.</Text>
          </View>

          {/* What's included */}
          <Text style={st.sectionLabel}>What you unlock</Text>
          <TierCard icon={Star} title="Full Lens Access" items={[
            "Complete astrological chart with all placements, houses, and aspects",
            "Full numerology profile — Life Path, Expression, Soul Urge, and timing cycles",
            "BaZi Four Pillars deep insights and daily Chinese energy notes",
            "Human Design bodygraph, defined centers, gates, and channels",
          ]} />
          <TierCard icon={Infinity} title="Unlimited Guidance" items={[
            "Unlimited Ask Soluna conversations with full cross-system synthesis",
            "Deep synthesis reports — 'Where your systems agree' on any theme",
            "Full compatibility for everyone in your circle across Romance, Friendship, Work & Family",
          ]} />
          <TierCard icon={Heart} title="Bonds & Sharing" items={[
            "Create unlimited partner Bonds with daily shared readings",
            "Private Bond Space with your linked partner",
            "All tarot spreads (Celtic Cross, Past-Present-Future, and more)",
          ]} />

          {/* Pricing — real products from RevenueCat (no hardcoded prices) */}
          <Text style={st.sectionLabel}>Choose your plan</Text>
          {loading ? (
            <View style={st.pricingLoading}><ActivityIndicator color={SolunaColors.warmGold} /></View>
          ) : !available ? (
            <Text style={st.unavailable}>Subscriptions are available in the Soluna mobile app.</Text>
          ) : !monthlyPkg && !yearlyPkg ? (
            <Text style={st.unavailable}>Plans aren&apos;t available right now. Please try again shortly.</Text>
          ) : (
            <>
              {monthlyPkg ? (
                <PricingCard title="Monthly" price={monthlyPkg.product.priceString} period="/ month" selected={selectedPlan === "monthly"} onSelect={() => setSelectedPlan("monthly")} />
              ) : null}
              {yearlyPkg ? (
                <PricingCard title="Yearly" price={yearlyPkg.product.priceString} period="/ year" selected={selectedPlan === "yearly"} onSelect={() => setSelectedPlan("yearly")} />
              ) : null}
            </>
          )}

          {/* CTA */}
          <TouchableOpacity style={[st.ctaBtn, (!selectedPkg || busy) && { opacity: 0.6 }]} activeOpacity={0.8} onPress={onPurchase} disabled={!selectedPkg || busy}>
            <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.ctaGradient}>
              {busy ? (
                <ActivityIndicator color={SolunaColors.deepIndigo} />
              ) : (
                <Text style={st.ctaText}>{selectedPkg ? `Subscribe · ${selectedPkg.product.priceString}` : "Subscribe"}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {message ? <Text style={st.purchaseMsg}>{message}</Text> : null}

          <TouchableOpacity style={st.restoreBtn} onPress={onRestore} disabled={busy} activeOpacity={0.7}>
            <Text style={st.restoreText}>Restore purchases</Text>
          </TouchableOpacity>

          {/* Trust copy */}
          <View style={st.trustBox}>
            <ShieldCheck size={14} color={SolunaColors.warmGold} />
            <Text style={st.trustText}>
              {selectedPkg ? `${selectedPkg.product.priceString} ${selectedPlan === "yearly" ? "per year" : "per month"}, billed through your App Store or Play account. ` : ""}Cancel anytime in your store account — no dark patterns, no retention flows. Your birth data stays yours: we never sell it, never share it, and never train on your chats.
            </Text>
          </View>

          {/* Coming soon */}
          <View style={st.comingSoon}><Sparkles size={12} color={SolunaColors.gentleLavender} /><Text style={st.comingSoonText}>Year-ahead transit report — coming later this year</Text></View>
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
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 20, marginBottom: 16 },
  premBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.12)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  premBadgeText: { fontSize: 10, fontWeight: "800", color: SolunaColors.warmGold, letterSpacing: 1.5, fontFamily: Fonts.body },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  headlineWrap: { alignItems: "center", marginBottom: 20 },
  headline: { fontSize: 26, fontFamily: Fonts.heading, color: SolunaColors.cream, textAlign: "center", marginTop: 10, marginBottom: 8, lineHeight: 34 },
  headlineSub: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 22, maxWidth: 320, fontFamily: Fonts.body },
  sectionLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 10, marginTop: 4 },
  ctaBtn: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginBottom: 12 },
  ctaGradient: { paddingVertical: 16, alignItems: "center" },
  ctaText: { fontSize: 17, fontWeight: "700", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  trustBox: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "rgba(232,184,109,0.05)", borderRadius: SolunaRadius.md, padding: 12, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 10 },
  trustText: { flex: 1, fontSize: 11, color: SolunaColors.creamSubtle, lineHeight: 17, fontFamily: Fonts.body },
  comingSoon: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 },
  comingSoonText: { fontSize: 12, color: SolunaColors.gentleLavender, fontFamily: Fonts.body, fontStyle: "italic" },
  pricingLoading: { paddingVertical: 24, alignItems: "center" },
  unavailable: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, textAlign: "center", paddingVertical: 16, lineHeight: 19 },
  purchaseMsg: { fontSize: 13, color: SolunaColors.gentleLavender, fontFamily: Fonts.body, textAlign: "center", marginBottom: 8, lineHeight: 19 },
  restoreBtn: { alignItems: "center", paddingVertical: 10, marginBottom: 6 },
  restoreText: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, textDecorationLine: "underline" },
});
