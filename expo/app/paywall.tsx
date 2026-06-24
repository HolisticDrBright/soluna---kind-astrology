import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Crown, Sparkles, X, Check, ShieldCheck } from "lucide-react-native";

// ─── Premium Benefit Row ──────────────────────────────────────────
function Benefit({ text }: { text: string }) {
  return (
    <View style={benefitStyles.row}>
      <Check size={18} color={SolunaColors.warmGold} />
      <Text style={benefitStyles.text}>{text}</Text>
    </View>
  );
}

const benefitStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  text: {
    flex: 1,
    fontSize: 15,
    color: SolunaColors.cream,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
});

// ─── Pricing Card ─────────────────────────────────────────────────
function PricingCard({
  title,
  price,
  period,
  savings,
  selected,
  onSelect,
}: {
  title: string;
  price: string;
  period: string;
  savings?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[pricingStyles.card, selected && pricingStyles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={pricingStyles.radio}>
        <View
          style={[
            pricingStyles.radioOuter,
            selected && pricingStyles.radioOuterSelected,
          ]}
        >
          {selected && <View style={pricingStyles.radioInner} />}
        </View>
      </View>

      <View style={pricingStyles.info}>
        <Text style={pricingStyles.title}>{title}</Text>
        {savings && (
          <View style={pricingStyles.savingsBadge}>
            <Text style={pricingStyles.savingsText}>{savings}</Text>
          </View>
        )}
      </View>

      <View style={pricingStyles.priceWrap}>
        <Text style={pricingStyles.price}>{price}</Text>
        <Text style={pricingStyles.period}>{period}</Text>
      </View>
    </TouchableOpacity>
  );
}

const pricingStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    marginBottom: 10,
    gap: 14,
  },
  cardSelected: {
    borderColor: "rgba(232,184,109,0.3)",
    backgroundColor: "rgba(232,184,109,0.05)",
  },
  radio: {
    justifyContent: "center",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: SolunaColors.warmGold,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SolunaColors.warmGold,
  },
  info: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  savingsBadge: {
    backgroundColor: "rgba(232,184,109,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: "700",
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
  },
  priceWrap: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  period: {
    fontSize: 11,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
});

// ─── Paywall Screen ──────────────────────────────────────────────
export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly",
  );

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.dismissArea} onPress={() => router.back()} />
      <LinearGradient
        colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
        style={styles.sheet}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Close + icon */}
          <View style={styles.topBar}>
            <View style={styles.premBadge}>
              <Crown size={12} color={SolunaColors.warmGold} />
              <Text style={styles.premBadgeText}>SOLUNA PREMIUM</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
            >
              <X size={20} color={SolunaColors.creamMuted} />
            </TouchableOpacity>
          </View>

          {/* Headline */}
          <View style={styles.headlineWrap}>
            <Sparkles size={28} color={SolunaColors.warmGold} />
            <Text style={styles.headline}>
              A deeper journey{'\n'}with the stars
            </Text>
            <Text style={styles.headlineSub}>
              Everything in Soluna free, plus unlimited personal readings, full
              compatibility insights, and exclusive daily content.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsWrap}>
            <Benefit text="Unlimited conversations with your personal AI astrologer — ask anything, anytime" />
            <Benefit text="Complete compatibility breakdowns for everyone in your circle, across romance, friendship & work" />
            <Benefit text="All current and upcoming transits explained warmly and personally for your chart" />
            <Benefit text="Exclusive premium daily readings, affirmations, and deep-dive content" />
            <Benefit text="Priority access to new features as we grow" />
          </View>

          {/* Pricing */}
          <PricingCard
            title="Monthly"
            price="$6.99"
            period="/ month"
            selected={selectedPlan === "monthly"}
            onSelect={() => setSelectedPlan("monthly")}
          />
          <PricingCard
            title="Yearly"
            price="$4.99"
            period="/ month"
            savings="Save $24/yr"
            selected={selectedPlan === "yearly"}
            onSelect={() => setSelectedPlan("yearly")}
          />

          {/* CTA */}
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={[SolunaColors.warmGold, SolunaColors.softPeach]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>
                Start Your Free Trial
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.ctaSub}>
            7-day free trial, then{" "}
            {selectedPlan === "yearly" ? "$4.99/month" : "$6.99/month"}
          </Text>

          {/* Honest small print */}
          <View style={styles.footer}>
            <ShieldCheck size={14} color={SolunaColors.creamSubtle} />
            <Text style={styles.footerText}>
              Cancel anytime in one tap. No tricks, no dark patterns, no
              retention flows. If Soluna isn't right for you, we want you to
              leave easily — and come back whenever you're ready. Your data
              stays yours, always.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: SolunaRadius.xl,
    borderTopRightRadius: SolunaRadius.xl,
    overflow: "hidden",
  },
  sheetContent: {
    paddingHorizontal: SolunaSpacing.lg,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 20,
  },
  premBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(232,184,109,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  premBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: SolunaColors.warmGold,
    letterSpacing: 1.5,
    fontFamily: Fonts.body,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headlineWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  headline: {
    fontSize: 26,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 10,
    lineHeight: 34,
  },
  headlineSub: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    fontFamily: Fonts.body,
  },
  benefitsWrap: {
    marginBottom: 24,
  },
  ctaBtn: {
    borderRadius: SolunaRadius.lg,
    overflow: "hidden",
    marginBottom: 10,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: SolunaColors.deepIndigo,
    fontFamily: Fonts.body,
  },
  ctaSub: {
    fontSize: 13,
    color: SolunaColors.creamSubtle,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: Fonts.body,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    lineHeight: 17,
    fontFamily: Fonts.body,
  },
});
