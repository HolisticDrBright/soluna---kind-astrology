import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { useToggleSaved } from "@/lib/hooks";
import {
  PLANET_SYMBOLS, ZODIAC_SYMBOLS, HOUSE_NAMES,
  NUMBER_MEANINGS, CHINESE_INTERPRETATIONS, HD_INTERPRETATIONS,
  getPlacementInterpretation, Fonts, type Planet, type ZodiacSign,
} from "@/constants/mockData";
import { Sparkles, ChevronLeft, MessageCircle, Bookmark } from "lucide-react-native";

function getGenericInterpretation(planet: Planet, sign: ZodiacSign, house: number) {
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
    Aries: "courageous, direct, and pioneering", Taurus: "steady, sensual, and deeply loyal",
    Gemini: "curious, adaptable, and wonderfully expressive", Cancer: "nurturing, intuitive, and emotionally rich",
    Leo: "warm, generous, and naturally radiant", Virgo: "precise, thoughtful, and quietly brilliant",
    Libra: "graceful, fair-minded, and beautifully relational", Scorpio: "intense, perceptive, and profoundly transformative",
    Sagittarius: "adventurous, optimistic, and wisdom-seeking", Capricorn: "determined, wise, and quietly powerful",
    Aquarius: "innovative, humanitarian, and refreshingly original", Pisces: "compassionate, creative, and deeply soulful",
  };
  return {
    description: `Your ${planet} in ${sign} lives in your ${house}${["th","st","nd","rd"][house%10>3?0:house%10]||"th"} house, the ${HOUSE_NAMES[house]?.toLowerCase() || `${house}th house`}. This means ${planetMeanings[planet]} expresses itself through the lens of ${sign.toLowerCase()} energy — ${signQualities[sign]}. When filtered through your ${house}${["th","st","nd","rd"][house%10>3?0:house%10]||"th"} house, this placement colors how you experience ${HOUSE_NAMES[house]?.toLowerCase() || "this area of life"}.\n\nEvery placement in your chart tells part of your story, and this one is a meaningful thread. Take what resonates — your lived experience is the real interpreter here.`,
    strengths: [
      `A natural ${signQualities[sign].split(",")[0]} approach to ${HOUSE_NAMES[house]?.toLowerCase() || "this area of life"}`,
      `The ability to bring ${planet.toLowerCase()} energy into ${HOUSE_NAMES[house]?.toLowerCase() || "your daily experience"} with grace`,
    ],
    growthEdge: `With ${planet} in ${sign}, you might sometimes feel the pull between your natural ${sign.toLowerCase()} expression and what the world expects. Remember that your chart is not a rulebook — it's an invitation to understand yourself more deeply.`,
  };
}

export default function InsightDetailScreen() {
  const { type, planet, number } = useLocalSearchParams<{ type: string; planet: string; number: string }>();
  const { user } = useAppState();
  const toggleSaved = useToggleSaved();
  const [saved, setSaved] = useState(false);
  if (!user || !type) return null;

  // Numeric insight
  if (type === "number" && number) {
    const num = parseInt(number, 10);
    const info = NUMBER_MEANINGS[num];
    if (!info) return null;
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>
          <View style={s.heroWrap}>
            <View style={[s.glyphCircle, { borderColor: "rgba(185,163,227,0.3)", backgroundColor: "rgba(185,163,227,0.08)" }]}>
              <Text style={[s.glyphText, { color: SolunaColors.gentleLavender }]}>{num}</Text>
            </View>
            <Text style={s.heroTitle}>Number {num}</Text>
            <Text style={s.heroSign}>{info.title}</Text>
          </View>
          <View style={s.section}><Text style={s.interpretationTitle}>What This Means</Text><Text style={s.interpretationText}>{info.description}</Text></View>
          <View style={s.section}><Text style={s.interpretationTitle}>What This Gives You</Text>{info.strengths.map((sx, i) => (<View key={i} style={s.strengthRow}><Sparkles size={14} color={SolunaColors.warmGold} /><Text style={s.strengthText}>{sx}</Text></View>))}</View>
          <View style={s.section}><Text style={s.interpretationTitle}>Gentle Growth Edge</Text><Text style={s.growthText}>{info.growthEdge}</Text></View>
          <View style={s.section}><Text style={s.interpretationTitle}>Why You're Seeing This</Text><Text style={s.whyText}>In numerology, each number carries an archetypal vibration. Your {num} emerges from calculations based on your full birth name and birth date — it's not random, it's mathematical. This number describes a core thread in your life's pattern.</Text></View>
          <TouchableOpacity style={[s.askBtn, { marginBottom: 10 }]} onPress={() => { setSaved(true); toggleSaved.mutate({ kind: "insight", refId: `number:${num}`, payload: { title: info.title } }); }}>
            <Bookmark size={18} color={saved ? SolunaColors.warmGold : SolunaColors.creamMuted} fill={saved ? SolunaColors.warmGold : "none"} /><Text style={s.askBtnText}>{saved ? "Saved" : "Save this insight"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.askBtn} onPress={() => router.push("/(tabs)/ask")}><MessageCircle size={18} color={SolunaColors.warmGold} /><Text style={s.askBtnText}>Ask Soluna about your number {num}</Text></TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>
    );
  }

  // Astrology placement insight
  if (type === "placement" && planet) {
    if (planet === "Rising") {
      return (
        <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
          <ScrollView contentContainerStyle={s.scrollContent}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>
            <View style={s.heroWrap}>
              <View style={[s.glyphCircle, { borderColor: "rgba(242,168,141,0.25)" }]}>
                <Text style={[s.glyphText, { color: SolunaColors.softPeach, fontSize: 28 }]}>ASC</Text>
              </View>
              <Text style={s.heroTitle}>Rising Sign</Text>
              <Text style={s.heroSign}>{ZODIAC_SYMBOLS[user.chart.rising]} {user.chart.rising}</Text>
              <Text style={s.heroHouse}>Ascendant · 1st House</Text>
            </View>
            <View style={s.section}><Text style={s.interpretationTitle}>What This Means</Text><Text style={s.interpretationText}>Your rising sign (or ascendant) is the zodiac sign that was literally rising on the eastern horizon at the exact moment you were born. It changes about every two hours — which is why your birth time matters so much. Your rising sign shapes your personal style, your instinctive reactions, and the energy you bring into a room before you even say a word. Think of it as the doorway through which everything else in your chart enters the world. With {user.chart.rising} rising, you greet the world with warmth and grace — people feel at ease around you.</Text></View>
            <TouchableOpacity style={s.askBtn} onPress={() => router.push("/(tabs)/ask")}><MessageCircle size={18} color={SolunaColors.warmGold} /><Text style={s.askBtnText}>Ask Soluna about your Rising sign</Text></TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      );
    }

    const placement = user.chart.placements.find((p) => p.planet === planet);
    if (!placement) return null;
    const interp = getPlacementInterpretation(placement.planet, placement.sign, placement.house) ?? getGenericInterpretation(placement.planet, placement.sign, placement.house);
    const isBigThree = placement.planet === "Sun" || placement.planet === "Moon";

    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>
          <View style={s.heroWrap}>
            <View style={[s.glyphCircle, isBigThree && { borderColor: "rgba(232,184,109,0.25)", backgroundColor: "rgba(232,184,109,0.06)" }]}>
              <Text style={s.glyphText}>{PLANET_SYMBOLS[placement.planet]}</Text>
            </View>
            <Text style={s.heroTitle}>{placement.planet}</Text>
            <Text style={s.heroSign}>{ZODIAC_SYMBOLS[placement.sign]} {placement.sign}</Text>
            <Text style={s.heroHouse}>{placement.house}{["th","st","nd","rd"][placement.house%10>3?0:placement.house%10]||"th"} House · {placement.degree}°</Text>
          </View>
          <View style={s.section}><Text style={s.interpretationTitle}>What This Means</Text><Text style={s.interpretationText}>{interp.description}</Text></View>
          <View style={s.section}><Text style={s.interpretationTitle}>What This Gives You</Text>{interp.strengths.map((sx, i) => (<View key={i} style={s.strengthRow}><Sparkles size={14} color={SolunaColors.warmGold} /><Text style={s.strengthText}>{sx}</Text></View>))}</View>
          <View style={s.section}><Text style={s.interpretationTitle}>Gentle Growth Edge</Text><Text style={s.growthText}>{interp.growthEdge}</Text></View>
          <View style={s.section}><Text style={s.interpretationTitle}>Why You're Seeing This</Text><Text style={s.whyText}>This placement comes from the exact position of {placement.planet} at the moment of your birth — {placement.degree}° into {placement.sign}, falling in your {placement.house}{["th","st","nd","rd"][placement.house%10>3?0:placement.house%10]||"th"} house. Your birth time and location determine which house each planet falls into.</Text></View>
          <TouchableOpacity style={[s.askBtn, { marginBottom: 10 }]} onPress={() => { setSaved(true); toggleSaved.mutate({ kind: "insight", refId: `placement:${placement.planet}`, payload: { title: `${placement.planet} in ${placement.sign}` } }); }}>
            <Bookmark size={18} color={saved ? SolunaColors.warmGold : SolunaColors.creamMuted} fill={saved ? SolunaColors.warmGold : "none"} /><Text style={s.askBtnText}>{saved ? "Saved" : "Save this insight"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.askBtn} onPress={() => router.push("/(tabs)/ask")}><MessageCircle size={18} color={SolunaColors.warmGold} /><Text style={s.askBtnText}>Ask Soluna about your {placement.planet} in {placement.sign}</Text></TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>
    );
  }

  return null;
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heroWrap: { alignItems: "center", marginBottom: 28 },
  glyphCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.08)" },
  glyphText: { fontSize: 36, color: SolunaColors.warmGold },
  heroTitle: { fontSize: 13, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 6 },
  heroSign: { fontSize: 32, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 6 },
  heroHouse: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  section: { marginBottom: 24 },
  interpretationTitle: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 10 },
  interpretationText: { fontSize: 15, color: SolunaColors.creamMuted, lineHeight: 24, fontFamily: Fonts.body, marginBottom: 12 },
  strengthRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  strengthText: { flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 21, fontFamily: Fonts.body },
  growthText: { fontSize: 15, color: SolunaColors.softPeach, lineHeight: 24, fontFamily: Fonts.body, fontStyle: "italic" },
  whyText: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 22, fontFamily: Fonts.body },
  askBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "rgba(232,184,109,0.08)", borderRadius: SolunaRadius.lg, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)", marginTop: 8 },
  askBtnText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});
