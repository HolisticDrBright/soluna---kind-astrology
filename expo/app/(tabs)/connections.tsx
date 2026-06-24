import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { CONNECTIONS, ZODIAC_SYMBOLS, Fonts } from "@/constants/mockData";
import { Heart, Plus, ChevronRight, Sparkles, Hash, Bird } from "lucide-react-native";

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? SolunaColors.warmGold : score >= 60 ? SolunaColors.gentleLavender : SolunaColors.softPeach;
  return (
    <View style={rS.wrap}>
      <View style={[rS.ring, { borderColor: "rgba(255,255,255,0.08)" }]}>
        <View style={[rS.ringFill, { borderColor: color, borderTopColor: "transparent", borderRightColor: "transparent", transform: [{ rotate: `${(score / 100) * 360 - 90}deg` }] }]} />
        <Text style={[rS.score, { color }]}>{score}%</Text>
      </View>
      <Text style={rS.label}>{label}</Text>
    </View>
  );
}
const rS = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  ring: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, position: "relative", alignItems: "center", justifyContent: "center" },
  ringFill: { position: "absolute", width: 50, height: 50, borderRadius: 25, borderWidth: 3 },
  score: { fontSize: 15, fontWeight: "700", fontFamily: Fonts.body },
  label: { fontSize: 9, color: SolunaColors.creamMuted, fontFamily: Fonts.body, fontWeight: "600" },
});

function AddPersonForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  return (
    <View style={fS.wrap}>
      <Text style={fS.title}>Add Someone</Text>
      <TextInput style={fS.input} value={name} onChangeText={setName} placeholder="Their full name" placeholderTextColor={SolunaColors.creamSubtle} />
      <TextInput style={fS.input} value={date} onChangeText={setDate} placeholder="Birth date (e.g. July 5, 1993)" placeholderTextColor={SolunaColors.creamSubtle} />
      <Text style={fS.hint}>Just a name and birth date to get started. More details unlock deeper compatibility — but we keep it simple.</Text>
      <View style={fS.buttons}>
        <TouchableOpacity style={fS.cancelBtn} onPress={onClose}><Text style={fS.cancelText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={[fS.addBtn, !name && fS.addBtnDisabled]} onPress={onClose} disabled={!name}>
          <Text style={[fS.addText, !name && { color: SolunaColors.creamSubtle }]}>Add to Circle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const fS = StyleSheet.create({
  wrap: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 16 },
  title: { fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 16 },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", fontFamily: Fonts.body, marginBottom: 12 },
  hint: { fontSize: 12, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, fontStyle: "italic", marginBottom: 16, lineHeight: 18 },
  buttons: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: SolunaRadius.md, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
  cancelText: { fontSize: 14, color: SolunaColors.creamMuted, fontWeight: "600", fontFamily: Fonts.body },
  addBtn: { flex: 1, paddingVertical: 14, borderRadius: SolunaRadius.md, backgroundColor: "rgba(232,184,109,0.15)", alignItems: "center", borderWidth: 1, borderColor: "rgba(232,184,109,0.2)" },
  addBtnDisabled: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" },
  addText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});

export default function ConnectionsScreen() {
  const { user } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);

  if (!user) return null;

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Your Circle</Text>
        <Text style={st.sub}>See how you connect through astrology, numerology, and Chinese signs — together.</Text>

        {!showAddForm && (
          <TouchableOpacity style={st.addButton} onPress={() => setShowAddForm(true)} activeOpacity={0.8}>
            <Plus size={20} color={SolunaColors.warmGold} />
            <Text style={st.addButtonText}>Add someone</Text>
          </TouchableOpacity>
        )}
        {showAddForm && <AddPersonForm onClose={() => setShowAddForm(false)} />}

        <View style={st.peopleWrap}>
          {CONNECTIONS.map((person) => (
            <TouchableOpacity
              key={person.id} style={st.personCard}
              onPress={() => router.push({ pathname: "/compatibility-detail", params: { id: person.id } })}
              activeOpacity={0.7}
            >
              <View style={st.personLeft}>
                <View style={[st.avatar, { backgroundColor: person.compatibilityScore >= 80 ? "rgba(232,184,109,0.12)" : person.compatibilityScore >= 60 ? "rgba(185,163,227,0.12)" : "rgba(242,168,141,0.12)" }]}>
                  <Text style={st.avatarText}>{person.avatarInitial}</Text>
                </View>
                <View style={st.personInfo}>
                  <Text style={st.personName}>{person.name}</Text>
                  <Text style={st.personMeta}>{ZODIAC_SYMBOLS[person.sunSign]} {person.sunSign} · {person.relationship}</Text>
                  <View style={st.blendedRow}>
                    <View style={st.blendedBadge}><Text style={st.blendedBadgeText}>♋</Text></View>
                    <View style={st.blendedBadge}><Hash size={8} color={SolunaColors.creamSubtle} /></View>
                    <View style={st.blendedBadge}><Bird size={8} color={SolunaColors.creamSubtle} /></View>
                    <Text style={st.blendedLabel}>blended</Text>
                  </View>
                </View>
              </View>
              <View style={st.personRight}>
                <ScoreRing score={person.compatibilityScore} label={person.compatibilityLabel} />
                <ChevronRight size={16} color={SolunaColors.creamSubtle} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={st.emptyHint}>
          <Heart size={20} color={SolunaColors.creamSubtle} />
          <Text style={st.emptyText}>
            Add friends, partners, family, and colleagues to see how your systems interact. We look across astrology, numerology, and Chinese signs — and every connection, even the challenging ones, is framed with warmth and growth in mind.
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 }, scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 20, lineHeight: 20 },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "rgba(232,184,109,0.08)", borderRadius: SolunaRadius.lg, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)", borderStyle: "dashed", marginBottom: 20 },
  addButtonText: { fontSize: 15, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  peopleWrap: { gap: 10 },
  personCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder },
  personLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.heading },
  personInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 3 },
  personMeta: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 4 },
  blendedRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  blendedBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  blendedBadgeText: { fontSize: 8 },
  blendedLabel: { fontSize: 9, color: SolunaColors.creamSubtle, fontWeight: "600" },
  personRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyHint: { alignItems: "center", gap: 10, marginTop: 32, paddingHorizontal: 20 },
  emptyText: { fontSize: 13, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 20, fontFamily: Fonts.body },
});
