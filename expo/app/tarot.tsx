import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { MOCK_THREE_CARD_READING, TAROT_SPREADS, Fonts } from "@/constants/mockData";
import { ChevronLeft, Sparkles, Shuffle, BookOpen } from "lucide-react-native";

export default function TarotScreen() {
  const [showReading, setShowReading] = useState(false);
  const [question, setQuestion] = useState("");

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={ts.gradient}>
      <ScrollView contentContainerStyle={ts.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={ts.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>

        <View style={ts.heroWrap}>
          <Text style={ts.heroEmoji}>🃏</Text>
          <Text style={ts.heroTitle}>Tarot</Text>
          <Text style={ts.heroSub}>Gentle guidance through archetype and intuition</Text>
        </View>

        {!showReading ? (
          <View>
            {/* Card of the Day */}
            <View style={ts.cardOfDay}>
              <Text style={ts.sectionTitle}>Card of the Day</Text>
              <View style={ts.codCard}>
                <Text style={ts.codEmoji}>🌙</Text>
                <Text style={ts.codName}>The High Priestess</Text>
                <Text style={ts.codMeaning}>Today, The High Priestess invites you to trust what you know without knowing how you know it. Your intuition is especially sharp — pay attention to dreams, gut feelings, and the quiet voice inside.</Text>
              </View>
            </View>

            {/* Pull a spread */}
            <Text style={ts.sectionTitle}>Pull a Spread</Text>
            <View style={ts.inputWrap}>
              <TextInput style={ts.input} value={question} onChangeText={setQuestion} placeholder="Ask a question (optional)" placeholderTextColor={SolunaColors.creamSubtle} />
            </View>
            <Text style={ts.spreadLabel}>Choose a spread:</Text>
            {TAROT_SPREADS.map((spread) => (
              <TouchableOpacity key={spread.id} style={ts.spreadCard} onPress={() => setShowReading(true)} activeOpacity={0.8}>
                <View style={ts.spreadHeader}>
                  <Shuffle size={18} color={SolunaColors.warmGold} />
                  <View style={{ flex: 1 }}>
                    <Text style={ts.spreadName}>{spread.name}</Text>
                    <Text style={ts.spreadDesc}>{spread.description}</Text>
                  </View>
                </View>
                <View style={ts.spreadPositions}>
                  {spread.positions.map((p, i) => (
                    <View key={i} style={ts.spreadChip}><Text style={ts.spreadChipText}>{p}</Text></View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            {question ? <Text style={ts.questionLabel}>Your question: "{question}"</Text> : null}
            <Text style={ts.sectionTitle}>Your 3-Card Reading</Text>
            {/* Cards */}
            {MOCK_THREE_CARD_READING.cards.map((card, i) => (
              <View key={i} style={ts.cardResult}>
                <View style={ts.cardResultHeader}>
                  <Text style={ts.cardEmoji}>{card.imageEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.cardName}>{card.name}</Text>
                    <Text style={ts.cardArcana}>{card.arcana === "major" ? "Major Arcana" : `Minor Arcana · ${card.suit}`}</Text>
                  </View>
                </View>
                <View style={ts.positionBadge}><Text style={ts.positionText}>{MOCK_THREE_CARD_READING.cards[i].positionMeaning}</Text></View>
                <Text style={ts.cardMeaning}>{card.uprightMeaning}</Text>
              </View>
            ))}
            {/* Overall */}
            <View style={ts.overallCard}>
              <Text style={ts.overallTitle}>Your Reading</Text>
              <Text style={ts.overallText}>{MOCK_THREE_CARD_READING.overallReading}</Text>
            </View>
            <TouchableOpacity style={ts.newBtn} onPress={() => setShowReading(false)} activeOpacity={0.8}>
              <Shuffle size={16} color={SolunaColors.warmGold} />
              <Text style={ts.newBtnText}>Draw new reading</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const ts = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heroWrap: { alignItems: "center", marginBottom: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  heroSub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  sectionTitle: { fontSize: 13, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 12, marginTop: 8 },
  cardOfDay: { marginBottom: 24 },
  codCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, alignItems: "center" },
  codEmoji: { fontSize: 40, marginBottom: 10 },
  codName: { fontSize: 18, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body, marginBottom: 8 },
  codMeaning: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 21, textAlign: "center", fontFamily: Fonts.body },
  inputWrap: { marginBottom: 16 },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", fontFamily: Fonts.body },
  spreadLabel: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 8 },
  spreadCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 },
  spreadHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  spreadName: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 3 },
  spreadDesc: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 17 },
  spreadPositions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  spreadChip: { backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  spreadChipText: { fontSize: 10, color: SolunaColors.creamMuted },
  // Results
  questionLabel: { fontSize: 14, color: SolunaColors.gentleLavender, fontFamily: Fonts.body, fontStyle: "italic", marginBottom: 16, textAlign: "center" },
  cardResult: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 18, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 12 },
  cardResultHeader: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 10 },
  cardEmoji: { fontSize: 36 },
  cardName: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 2 },
  cardArcana: { fontSize: 11, color: SolunaColors.creamSubtle, fontWeight: "600" },
  positionBadge: { backgroundColor: "rgba(232,184,109,0.08)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 10, alignSelf: "flex-start" },
  positionText: { fontSize: 11, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  cardMeaning: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 21, fontFamily: Fonts.body },
  overallCard: { backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)", marginTop: 8, marginBottom: 16 },
  overallTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body, marginBottom: 10 },
  overallText: { fontSize: 14, color: SolunaColors.cream, lineHeight: 23, fontFamily: Fonts.body },
  newBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: SolunaRadius.md, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  newBtnText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600" },
});
