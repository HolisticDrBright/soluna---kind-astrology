import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Crown, Sparkles } from "lucide-react-native";

interface PremiumGateCardProps {
  title: string;
  description: string;
  feature?: string;
}

export default function PremiumGateCard({ title, description, feature }: PremiumGateCardProps) {
  return (
    <TouchableOpacity style={s.wrap} onPress={() => router.push("/paywall")} activeOpacity={0.8}>
      <LinearGradient
        colors={["rgba(232,184,109,0.08)", "rgba(185,163,227,0.04)"]}
        style={s.inner}
      >
        <View style={s.topRow}>
          <Crown size={18} color={SolunaColors.warmGold} />
          <View style={s.premBadge}>
            <Text style={s.premBadgeText}>PREMIUM</Text>
          </View>
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.desc}>{description}</Text>
        {feature && (
          <View style={s.featureRow}>
            <Sparkles size={12} color={SolunaColors.warmGold} />
            <Text style={s.featureText}>{feature}</Text>
          </View>
        )}
        <View style={s.cta}>
          <Text style={s.ctaText}>Unlock →</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  inner: {
    padding: 18, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(232,184,109,0.15)",
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  premBadge: {
    backgroundColor: "rgba(232,184,109,0.12)",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  premBadgeText: {
    fontSize: 9, fontWeight: "800", color: SolunaColors.warmGold,
    letterSpacing: 1.5, fontFamily: Fonts.body,
  },
  title: {
    fontSize: 16, fontFamily: Fonts.heading, color: SolunaColors.cream,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19,
    fontFamily: Fonts.body, marginBottom: 10,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  featureText: {
    fontSize: 12, color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body, flex: 1,
  },
  cta: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(232,184,109,0.12)",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(232,184,109,0.2)",
  },
  ctaText: {
    fontSize: 12, fontWeight: "700", color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
  },
});
