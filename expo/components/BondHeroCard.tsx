import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Heart, Sparkles, ChevronRight } from "lucide-react-native";

interface BondHeroCardProps {
  partnerName: string;
  partnerInitial: string;
  lens: string;
  todayReading?: string;
  onPress?: () => void;
}

export default function BondHeroCard({ partnerName, partnerInitial, lens, todayReading, onPress }: BondHeroCardProps) {
  return (
    <TouchableOpacity
      style={s.wrap}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["rgba(232,184,109,0.08)", "rgba(242,168,141,0.04)"]}
        style={s.inner}
      >
        <View style={s.topRow}>
          <View style={s.avatars}>
            <View style={[s.avatar, { borderColor: SolunaColors.warmGold }]}>
              <Text style={s.avatarText}>Y</Text>
            </View>
            <View style={s.heartCircle}>
              <Heart size={10} color={SolunaColors.warmGold} fill={SolunaColors.warmGold} />
            </View>
            <View style={[s.avatar, { borderColor: SolunaColors.softPeach }]}>
              <Text style={s.avatarText}>{partnerInitial}</Text>
            </View>
          </View>
          <View style={s.lensBadge}>
            <Text style={s.lensText}>{lens}</Text>
          </View>
        </View>

        <Text style={s.title}>You & {partnerName}</Text>

        {todayReading ? (
          <View style={s.readingRow}>
            <Sparkles size={14} color={SolunaColors.warmGold} />
            <Text style={s.readingText} numberOfLines={3}>{todayReading}</Text>
          </View>
        ) : (
          <Text style={s.noReading}>Tap to see your shared reading for today</Text>
        )}

        <View style={s.cta}>
          <Text style={s.ctaText}>Open Bond Space</Text>
          <ChevronRight size={14} color={SolunaColors.warmGold} />
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
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  avatars: { flexDirection: "row", alignItems: "center", gap: 4 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.heading },
  heartCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(232,184,109,0.1)",
    alignItems: "center", justifyContent: "center",
    marginHorizontal: -6, zIndex: 1,
  },
  lensBadge: {
    backgroundColor: "rgba(242,168,141,0.1)",
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  lensText: { fontSize: 10, color: SolunaColors.softPeach, fontWeight: "600", fontFamily: Fonts.body },
  title: {
    fontSize: 20, fontFamily: Fonts.heading, color: SolunaColors.cream,
    marginBottom: 8,
  },
  readingRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 12 },
  readingText: {
    flex: 1, fontSize: 13, color: SolunaColors.creamMuted,
    lineHeight: 19, fontFamily: Fonts.body,
  },
  noReading: {
    fontSize: 13, color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body, fontStyle: "italic", marginBottom: 12,
  },
  cta: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-end",
  },
  ctaText: {
    fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600",
    fontFamily: Fonts.body,
  },
});
