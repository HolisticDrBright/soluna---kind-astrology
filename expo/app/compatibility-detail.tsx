import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { CONNECTIONS, ZODIAC_SYMBOLS, Fonts } from "@/constants/mockData";
import { ChevronLeft, Heart, Star, Sparkles } from "lucide-react-native";

// ─── Relationship Lens Tabs ──────────────────────────────────────
type Lens = "Romance" | "Friendship" | "Work";

// ─── Compatibility Detail Screen ─────────────────────────────────
export default function CompatibilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppState();
  const [lens, setLens] = useState<Lens>("Romance");

  if (!user || !id) return null;

  const person = CONNECTIONS.find((c) => c.id === id);
  if (!person) return null;

  const color =
    person.compatibilityScore >= 80
      ? SolunaColors.warmGold
      : person.compatibilityScore >= 60
        ? SolunaColors.gentleLavender
        : SolunaColors.softPeach;

  const lensTips = {
    Romance: person.romanceTip,
    Friendship: person.friendshipTip,
    Work: person.workTip,
  };

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={SolunaColors.cream} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          {/* Two avatars */}
          <View style={styles.avatarsRow}>
            <View
              style={[styles.avatar, { borderColor: SolunaColors.softPeach }]}
            >
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              <Text style={styles.avatarSign}>
                {ZODIAC_SYMBOLS[user.chart.sun.sign]}
              </Text>
            </View>

            <View style={styles.avatarsConnector}>
              <Heart size={20} color={color} fill={color} opacity={0.6} />
              <View style={[styles.scoreCircle, { borderColor: color }]}>
                <Text style={[styles.scoreText, { color }]}>
                  {person.compatibilityScore}%
                </Text>
              </View>
            </View>

            <View style={[styles.avatar, { borderColor: color }]}>
              <Text style={styles.avatarText}>{person.avatarInitial}</Text>
              <Text style={styles.avatarSign}>
                {ZODIAC_SYMBOLS[person.sunSign]}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {user.name} & {person.name}
          </Text>
          <View style={[styles.labelBadge, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.labelText, { color }]}>
              {person.compatibilityLabel}
            </Text>
          </View>
        </View>

        {/* Lens Tabs */}
        <View style={styles.lensWrap}>
          {(["Romance", "Friendship", "Work"] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.lensTab, lens === l && { backgroundColor: `${color}15`, borderColor: `${color}30` }]}
              onPress={() => setLens(l)}
            >
              <Text
                style={[
                  styles.lensText,
                  lens === l && { color },
                ]}
              >
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Where You Flow */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={16} color={SolunaColors.warmGold} />
            <Text style={styles.sectionTitle}>Where You Flow</Text>
          </View>
          <Text style={styles.sectionText}>{person.whereYouFlow}</Text>
        </View>

        {/* Where You Grow */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={16} color={SolunaColors.gentleLavender} />
            <Text style={styles.sectionTitle}>Where You Grow</Text>
          </View>
          <Text style={styles.sectionText}>{person.whereYouGrow}</Text>
        </View>

        {/* How to Love Well */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={16} color={SolunaColors.softPeach} />
            <Text style={styles.sectionTitle}>How to Love Each Other Well</Text>
          </View>
          {person.howToLove.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>{i + 1}.</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Lens-specific insight */}
        <View style={styles.lensInsightCard}>
          <Text style={styles.lensInsightLabel}>
            {lens} insight
          </Text>
          <Text style={styles.lensInsightText}>{lensTips[lens]}</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SolunaSpacing.md,
    paddingTop: 60,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  hero: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
  },
  avatarSign: {
    fontSize: 18,
    marginTop: -4,
  },
  avatarsConnector: {
    alignItems: "center",
    gap: 6,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Fonts.body,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 10,
  },
  labelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  lensWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: SolunaRadius.md,
    padding: 4,
    marginBottom: 24,
  },
  lensTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: SolunaRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  lensText: {
    fontSize: 13,
    fontWeight: "600",
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  sectionText: {
    fontSize: 15,
    color: SolunaColors.creamMuted,
    lineHeight: 24,
    fontFamily: Fonts.body,
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  tipBullet: {
    fontSize: 14,
    fontWeight: "700",
    color: SolunaColors.softPeach,
    fontFamily: Fonts.body,
    width: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: SolunaColors.cream,
    lineHeight: 21,
    fontFamily: Fonts.body,
  },
  lensInsightCard: {
    backgroundColor: "rgba(242,168,141,0.05)",
    borderRadius: SolunaRadius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(242,168,141,0.1)",
  },
  lensInsightLabel: {
    fontSize: 11,
    color: SolunaColors.softPeach,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
    fontFamily: Fonts.body,
    marginBottom: 8,
  },
  lensInsightText: {
    fontSize: 14,
    color: SolunaColors.cream,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
});
