import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useAddJournal, useJournal } from "@/lib/hooks";
import { ChevronLeft, BookOpen, Sparkles, Calendar, Plus } from "lucide-react-native";

export default function JournalScreen() {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const { data: entries = [] } = useJournal();
  const addJournal = useAddJournal();

  const saveEntry = async () => {
    if (!newTitle) return;
    await addJournal.mutateAsync({ title: newTitle, body: newContent || newTitle });
    setShowNewEntry(false);
    setNewTitle("");
    setNewContent("");
  };

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>

        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Cosmic Journal</Text>
            <Text style={s.sub}>Gentle reflections tied to the day's energy</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowNewEntry(true)} activeOpacity={0.8}>
            <Plus size={20} color={SolunaColors.warmGold} />
          </TouchableOpacity>
        </View>

        {showNewEntry && (
          <View style={s.newEntryCard}>
            <Text style={s.newEntryTitle}>Today's Reflection</Text>
            <Text style={s.newEntryContext}>Moon in Cancer · Personal Day 7 · Generator energy</Text>
            <TextInput style={s.inputTitle} value={newTitle} onChangeText={setNewTitle} placeholder="Entry title…" placeholderTextColor={SolunaColors.creamSubtle} />
            <TextInput style={s.inputContent} value={newContent} onChangeText={setNewContent} placeholder="What's on your mind? How are you feeling? What's one thing you noticed today?" placeholderTextColor={SolunaColors.creamSubtle} multiline textAlignVertical="top" />
            <View style={s.newEntryBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowNewEntry(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.saveEntryBtn, !newTitle && { opacity: 0.5 }]} disabled={!newTitle} onPress={saveEntry}>
                <BookOpen size={16} color={SolunaColors.deepIndigo} />
                <Text style={s.saveEntryText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={s.sectionTitle}>Your Entries</Text>
        {entries.map((entry) => (
          <TouchableOpacity key={entry.id} style={s.entryCard} activeOpacity={0.7}>
            <View style={s.entryHeader}>
              <Calendar size={14} color={SolunaColors.creamMuted} />
              <Text style={s.entryDate}>{new Date(entry.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
              <View style={s.moodBadge}><Text style={s.moodText}>{entry.mood}</Text></View>
            </View>
            <Text style={s.entryTitle}>{entry.title}</Text>
            <Text style={s.entryContent} numberOfLines={3}>{entry.content}</Text>
            <View style={s.entryFooter}>
              <Sparkles size={12} color={SolunaColors.creamSubtle} />
              <Text style={s.entryTransit}>{entry.transitContext}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={s.footerNote}>Your journal is private — these reflections stay with you. We never read them, analyze them, or use them to train anything.</Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(232,184,109,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  newEntryCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 24 },
  newEntryTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 4 },
  newEntryContext: { fontSize: 12, color: SolunaColors.creamSubtle, fontStyle: "italic", marginBottom: 16 },
  inputTitle: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", fontFamily: Fonts.body, marginBottom: 10 },
  inputContent: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", fontFamily: Fonts.body, minHeight: 100, marginBottom: 14 },
  newEntryBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: SolunaRadius.md, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
  cancelText: { fontSize: 14, color: SolunaColors.creamMuted, fontWeight: "600" },
  saveEntryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: SolunaRadius.md, backgroundColor: SolunaColors.warmGold },
  saveEntryText: { fontSize: 14, fontWeight: "600", color: SolunaColors.deepIndigo },
  sectionTitle: { fontSize: 13, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 12 },
  entryCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  entryDate: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  moodBadge: { backgroundColor: "rgba(232,184,109,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  moodText: { fontSize: 10, color: SolunaColors.warmGold, fontWeight: "600" },
  entryTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 6 },
  entryContent: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 21, fontFamily: Fonts.body, marginBottom: 10 },
  entryFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  entryTransit: { fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, fontStyle: "italic" },
  footerNote: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 19, fontFamily: Fonts.body, fontStyle: "italic", paddingHorizontal: 20, marginTop: 8 },
});
