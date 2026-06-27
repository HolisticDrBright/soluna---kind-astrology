import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Crown, X } from "lucide-react-native";
import { getRevenueCatUI, isRevenueCatAvailable } from "@/lib/revenuecat";

export default function PaywallScreen() {
  const RevenueCatUI = getRevenueCatUI();

  // RevenueCat-hosted paywall — designed in the dashboard, renders the current
  // offering (Lifetime / Yearly / Monthly). Purchases + restore are handled by
  // RevenueCat; the billing webhook then syncs the backend entitlement.
  // Only render it when billing is actually configured (a publishable key is set);
  // otherwise fall through to an honest "unavailable" state — never a broken paywall.
  if (RevenueCatUI && isRevenueCatAvailable()) {
    return (
      <View style={st.full}>
        <RevenueCatUI.Paywall
          style={st.full}
          onPurchaseCompleted={() => router.back()}
          onRestoreCompleted={() => router.back()}
          onDismiss={() => router.back()}
        />
      </View>
    );
  }

  // Billing unavailable — on web (purchases happen in the native app) or when no
  // RevenueCat key is configured yet. Honest message, never a fake unlock.
  return (
    <View style={st.overlay}>
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.sheet}>
        <TouchableOpacity style={st.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <X size={20} color={SolunaColors.creamMuted} />
        </TouchableOpacity>
        <Crown size={28} color={SolunaColors.warmGold} />
        <Text style={st.title}>Soluna Premium</Text>
        <Text style={st.body}>
          Subscriptions aren&apos;t available here right now. Please make sure you&apos;re on the latest
          version of the Soluna app on your phone, then try again — unlock your full Blueprint, unlimited
          Ask Soluna, and cross-system reports.
        </Text>
        <TouchableOpacity style={st.cta} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={st.ctaText}>Got it</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  full: { flex: 1, backgroundColor: SolunaColors.deepIndigo },
  overlay: { flex: 1, justifyContent: "center", padding: SolunaSpacing.lg, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { borderRadius: SolunaRadius.xl, padding: 28, alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  closeBtn: { position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: Fonts.heading, color: SolunaColors.cream, marginTop: 6 },
  body: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 21, fontFamily: Fonts.body },
  cta: { marginTop: 8, backgroundColor: SolunaColors.warmGold, borderRadius: SolunaRadius.lg, paddingVertical: 14, paddingHorizontal: 40 },
  ctaText: { color: SolunaColors.deepIndigo, fontWeight: "700", fontFamily: Fonts.body, fontSize: 16 },
});
