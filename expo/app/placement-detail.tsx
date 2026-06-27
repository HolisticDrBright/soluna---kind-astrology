import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  PLANET_SYMBOLS,
  ZODIAC_SYMBOLS,
  HOUSE_NAMES,
  BIG_THREE_DESCRIPTIONS,
  getPlacementInterpretation,
  Fonts,
  type Planet,
  type ZodiacSign,
} from "@/constants/mockData";
import { Sparkles, ChevronLeft, MessageCircle, Star } from "lucide-react-native";

// ─── Generic interpretation for placements without custom text ──
function getGenericInterpretation(planet: Planet, sign: ZodiacSign, house: number): {
  description: string;
  strengths: string[];
  growthEdge: string;
} {
  const planetMeanings: Record<Planet, string> = {
    Sun: "your core self — your identity, vitality, and the essence of who you are",
    Moon: "your emotional world — how you feel, what you need to feel safe, and how you nurture yourself",
    Mercury: "your mind and communication — how you think, learn, and express your ideas",
    Venus: "your heart and values — how you love, what you find beautiful, and what brings you pleasure",
    Mars: "your drive and desire — how you take action, assert yourself, and pursue what you want",
    Jupiter: "your growth and abundance — how you expand, find meaning, and experience optimism",
    Saturn: "your structure and wisdom — how you build, commit, and grow through life's lessons",
    Uranus: "your originality and freedom — how you innovate, break patterns, and express your uniqueness",
    Neptune: "your imagination and transcendence — how you dream, connect spiritually, and experience the ineffable",
    Pluto: "your power and transformation — how you evolve, release what no longer serves, and access your depth",
  };

  const signQualities: Record<ZodiacSign, string> = {
    Aries: "courageous, direct, and pioneering",
    Taurus: "steady, sensual, and deeply loyal",
    Gemini: "curious, adaptable, and wonderfully expressive",
    Cancer: "nurturing, intuitive, and emotionally rich",
    Leo: "warm, generous, and naturally radiant",
    Virgo: "precise, thoughtful, and quietly brilliant",
    Libra: "graceful, fair-minded, and beautifully relational",
    Scorpio: "intense, perceptive, and profoundly transformative",
    Sagittarius: "adventurous, optimistic, and wisdom-seeking",
    Capricorn: "determined, wise, and quietly powerful",
    Aquarius: "innovative, humanitarian, and refreshingly original",
    Pisces: "compassionate, creative, and deeply soulful",
  };

  return {
    description: `Your ${planet} in ${sign} lives in your ${house}${["th","st","nd","rd"][house%10>3?0:house%10]||"th"} house, the ${HOUSE_NAMES[house]?.toLowerCase() || `${house}th house`}. This means ${planetMeanings[planet]} expresses itself through the lens of ${sign.toLowerCase()} energy — ${signQualities[sign]}. When filtered through your ${house}${["th","st","nd","rd"][house%10>3?0:house%10]||"th"} house, this placement colors how you experience ${HOUSE_NAMES[house]?.toLowerCase() || `this area of life`}.\n\nEvery placement in your chart tells part of your story, and this one is a meaningful thread. Take what resonates — your lived experience is the real interpreter here.`,
    strengths: [
      `A natural ${signQualities[sign].split(",")[0]} approach to ${HOUSE_NAMES[house]?.toLowerCase() || "this area of life"}`,
      `The ability to bring ${planet.toLowerCase()} energy into ${HOUSE_NAMES[house]?.toLowerCase() || "your daily experience"} with grace`,
      `A unique perspective that blends ${sign.toLowerCase()} qualities with the themes of your ${house}${["th","st","nd","rd"][house%10>3?0:house%10]||"th"} house`,
    ],
    growthEdge:
      `With ${planet} in ${sign}, you might sometimes feel the pull between your natural ${sign.toLowerCase()} expression and what the world expects. Remember that your chart is not a rulebook — it's an invitation to understand yourself more deeply. Give yourself permission to grow into this placement at your own pace.`,
  };
}

// ─── Rising Sign Detail ──────────────────────────────────────────
function RisingDetail({ sign }: { sign: ZodiacSign }) {
  const desc = BIG_THREE_DESCRIPTIONS[`Rising-${sign}`] || `Your rising sign is ${sign}. This is the mask you wear, the first impression you give, and how you approach new experiences. It's the lens through which the world first sees you.`;
  return (
    <View style={styles.section}>
      <Text style={styles.interpretationTitle}>Your Rising Sign</Text>
      <Text style={styles.interpretationText}>{desc}</Text>
      <Text style={styles.interpretationText}>
        Your rising sign is often called your "ascendant" — it's the zodiac sign
        that was literally rising on the eastern horizon at the moment you were
        born. It changes about every two hours, which is why your exact birth
        time matters so much. Your rising sign shapes your personal style, your
        instinctive reactions, and the energy you bring into a room before you
        even say a word. Think of it as the doorway through which everything
        else in your chart enters the world.
      </Text>
    </View>
  );
}

// ─── Placement Detail Screen ──────────────────────────────────────
export default function PlacementDetailScreen() {
  const { planet } = useLocalSearchParams<{ planet: string }>();
  const { user } = useAppState();

  if (!user || !planet) return null;

  const chart = user.chart;

  // Handle Rising sign
  if (planet === "Rising") {
    return (
      <LinearGradient
        colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={SolunaColors.cream} />
          </TouchableOpacity>

          <View style={styles.heroWrap}>
            <View style={styles.glyphCircle}>
              <Star size={32} color={SolunaColors.softPeach} />
            </View>
            <Text style={styles.heroTitle}>Rising Sign</Text>
            <Text style={styles.heroSign}>
              {ZODIAC_SYMBOLS[chart.rising]} {chart.rising}
            </Text>
            <Text style={styles.heroHouse}>Ascendant · 1st House</Text>
          </View>

          <RisingDetail sign={chart.rising} />

          <TouchableOpacity
            style={styles.askBtn}
            onPress={() => router.push("/(tabs)/ask")}
          >
            <MessageCircle size={18} color={SolunaColors.warmGold} />
            <Text style={styles.askBtnText}>
              Ask Soluna about your Rising sign
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  const placement = chart.placements.find((p) => p.planet === planet);
  if (!placement) return null;

  const interpretation =
    getPlacementInterpretation(placement.planet, placement.sign, placement.house) ??
    getGenericInterpretation(placement.planet, placement.sign, placement.house);

  const isBigThree =
    placement.planet === "Sun" || placement.planet === "Moon";

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
        <View style={styles.heroWrap}>
          <View
            style={[
              styles.glyphCircle,
              isBigThree && styles.glyphCircleBigThree,
            ]}
          >
            <Text style={styles.glyphText}>
              {PLANET_SYMBOLS[placement.planet]}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{placement.planet}</Text>
          <Text style={styles.heroSign}>
            {ZODIAC_SYMBOLS[placement.sign]} {placement.sign}
          </Text>
          <Text style={styles.heroHouse}>
            {placement.house}
            {["th", "st", "nd", "rd"][
              placement.house % 10 > 3 ? 0 : placement.house % 10
            ] || "th"}{" "}
            House · {placement.degree}°
          </Text>
        </View>

        {/* Interpretation */}
        <View style={styles.section}>
          <Text style={styles.interpretationTitle}>What This Means</Text>
          <Text style={styles.interpretationText}>
            {interpretation.description}
          </Text>
        </View>

        {/* Strengths */}
        <View style={styles.section}>
          <Text style={styles.interpretationTitle}>What This Gives You</Text>
          {interpretation.strengths.map((s, i) => (
            <View key={i} style={styles.strengthRow}>
              <Sparkles size={14} color={SolunaColors.warmGold} />
              <Text style={styles.strengthText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Growth Edge */}
        <View style={styles.section}>
          <Text style={styles.interpretationTitle}>Gentle Growth Edge</Text>
          <Text style={styles.growthText}>{interpretation.growthEdge}</Text>
        </View>

        {/* Ask CTA */}
        <TouchableOpacity
          style={styles.askBtn}
          onPress={() => router.push("/(tabs)/ask")}
        >
          <MessageCircle size={18} color={SolunaColors.warmGold} />
          <Text style={styles.askBtnText}>
            Ask Soluna about your {placement.planet} in {placement.sign}
          </Text>
        </TouchableOpacity>

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
  heroWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  glyphCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
  },
  glyphCircleBigThree: {
    borderColor: "rgba(232,184,109,0.25)",
    backgroundColor: "rgba(232,184,109,0.06)",
  },
  glyphText: {
    fontSize: 36,
    color: SolunaColors.warmGold,
  },
  heroTitle: {
    fontSize: 13,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
    fontFamily: Fonts.body,
    marginBottom: 6,
  },
  heroSign: {
    fontSize: 32,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 6,
  },
  heroHouse: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  section: {
    marginBottom: 24,
  },
  interpretationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  interpretationText: {
    fontSize: 15,
    color: SolunaColors.creamMuted,
    lineHeight: 24,
    fontFamily: Fonts.body,
    marginBottom: 12,
  },
  strengthRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  strengthText: {
    flex: 1,
    fontSize: 14,
    color: SolunaColors.cream,
    lineHeight: 21,
    fontFamily: Fonts.body,
  },
  growthText: {
    fontSize: 15,
    color: SolunaColors.softPeach,
    lineHeight: 24,
    fontFamily: Fonts.body,
    fontStyle: "italic",
  },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(232,184,109,0.08)",
    borderRadius: SolunaRadius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.12)",
    marginTop: 8,
  },
  askBtnText: {
    fontSize: 14,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
});
