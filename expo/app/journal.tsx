import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { JOURNAL_ENTRIES } from "@/constants/demoData";
import { isDemoMode } from "@/lib/runtimeMode";
import { formatISODateLong } from "@/lib/dates";
import EmptyState from "@/components/EmptyState";
import { LoadingState, ErrorState } from "@/components/DataStates";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getJournal, createJournalEntry } from "@/lib/api";
import { ChevronLeft, BookOpen, Sparkles, Calendar, Plus, Smile } from "lucide-react-native";

const USE_MOCK_DATA = isDemoMode;

/** Device-local YYYY-MM-DD (the user's own calendar day, not UTC's). */
function localEntryDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MOOD_OPTIONS = [
  { emoji: "☀️", label: "Radiant", value: 5 },
  { emoji: "🌤️", label: "Good", value: 4 },
  { emoji: "🌥️", label: "Okay", value: 3 },
  { emoji: "🌧️", label: "Low", value: 2 },
  { emoji: "🌙", label: "Reflective", value: 1 },
];
const moodLabelFor = (value?: number | null) =>
  MOOD_OPTIONS.find((m) => m.value === value)?.label ?? "Unmarked";

interface JournalItem {
  id: string;
  date: string;
  title: string;
  content: string;
  moodLabel: string;
  context: string | null;
}

function mapMockEntry(e: typeof JOURNAL_ENTRIES[number]): JournalItem {
  return { id: e.id, date: e.date, title: e.title, content: e.content, moodLabel: e.mood, context: e.transitContext };
}

function mapLiveEntry(raw: Record<string, unknown>): JournalItem {
  const body = String(raw.body ?? "");
  const [maybeTitle, ...rest] = body.split("\n\n");
  const hasTitle = rest.length > 0 && maybeTitle.length <= 80;
  return {
    id: String(raw.id ?? `j${String(raw.entry_date ?? "")}`),
    date: String(raw.entry_date ?? raw.created_at ?? new Date().toISOString().split("T")[0]),
    title: hasTitle ? maybeTitle : "",
    content: hasTitle ? rest.join("\n\n") : body,
    moodLabel: moodLabelFor(typeof raw.mood === "number" ? raw.mood : null),
    context: raw.prompt ? String(raw.prompt) : null,
  };
}

export default function JournalScreen() {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [mockEntries, setMockEntries] = useState<typeof JOURNAL_ENTRIES>(
    isDemoMode ? JOURNAL_ENTRIES : [],
  );

  const journalQuery = useAsyncData(() => getJournal(50), [], { enabled: !USE_MOCK_DATA });

  const entries: JournalItem[] = useMemo(() => {
    if (USE_MOCK_DATA) return mockEntries.map(mapMockEntry);
    const list = (journalQuery.data?.entries ?? []) as Record<string, unknown>[];
    return list.map(mapLiveEntry);
  }, [mockEntries, journalQuery.data]);

  const resetForm = () => {
    setShowNewEntry(false);
    setNewTitle("");
    setNewContent("");
    setSelectedMood("");
    setSaveError("");
  };

  const handleSave = async () => {
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title && !content) {
      setSaveError("Write a title or a few words first.");
      return;
    }
    const moodValue = MOOD_OPTIONS.find((m) => m.label === selectedMood)?.value;

    if (USE_MOCK_DATA) {
      const entry = {
        id: `j${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        title: title || "Reflection",
        content: content || "No content written.",
        mood: selectedMood || "Unmarked",
        transitContext: "",
      };
      setMockEntries((prev) => [entry, ...prev]);
      resetForm();
      return;
    }

    const body = [title, content].filter(Boolean).join("\n\n");
    setSaving(true);
    setSaveError("");
    const { error } = await createJournalEntry(body, moodValue, localEntryDate());
    setSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    resetForm();
    journalQuery.refetch();
  };

  const liveLoading = !USE_MOCK_DATA && journalQuery.loading;
  const liveError = !USE_MOCK_DATA ? journalQuery.error : null;

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={SolunaColors.cream} />
        </TouchableOpacity>

        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Cosmic Journal</Text>
            <Text style={s.sub}>Gentle reflections, kept private to you</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowNewEntry(true)} activeOpacity={0.8}>
            <Plus size={20} color={SolunaColors.warmGold} />
          </TouchableOpacity>
        </View>

        {/* Gentle reflection prompt */}
        <TouchableOpacity style={s.promptCard} activeOpacity={0.8} onPress={() => setShowNewEntry(true)}>
          <Sparkles size={16} color={SolunaColors.warmGold} />
          <View style={{ flex: 1 }}>
            <Text style={s.promptTitle}>Today's reflection prompt</Text>
            <Text style={s.promptText}>What is one feeling and one small moment from today you'd like to remember?</Text>
          </View>
        </TouchableOpacity>

        {showNewEntry && (
          <View style={s.newEntryCard}>
            <Text style={s.newEntryTitle}>New Reflection</Text>
            <Text style={s.newEntryContext}>A private space for your thoughts.</Text>

            <TextInput
              style={s.inputTitle}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Entry title (optional)…"
              placeholderTextColor={SolunaColors.creamSubtle}
            />
            <TextInput
              style={s.inputContent}
              value={newContent}
              onChangeText={setNewContent}
              placeholder="What's on your mind? How are you feeling? What's one thing you noticed today?"
              placeholderTextColor={SolunaColors.creamSubtle}
              multiline
              textAlignVertical="top"
            />

            {/* Mood selector */}
            <Text style={s.moodLabel}>How are you feeling?</Text>
            <View style={s.moodRow}>
              {MOOD_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m.label}
                  style={[s.moodChip, selectedMood === m.label && s.moodChipSelected]}
                  onPress={() => setSelectedMood(m.label)}
                >
                  <Text style={s.moodEmoji}>{m.emoji}</Text>
                  <Text style={[s.moodChipLabel, selectedMood === m.label && s.moodChipLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {saveError ? <Text style={s.saveError}>{saveError}</Text> : null}

            <View style={s.newEntryBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={resetForm} disabled={saving}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveEntryBtn, (!newTitle.trim() && !newContent.trim()) && { opacity: 0.5 }]}
                disabled={saving || (!newTitle.trim() && !newContent.trim())}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator color={SolunaColors.deepIndigo} />
                ) : (
                  <>
                    <BookOpen size={16} color={SolunaColors.deepIndigo} />
                    <Text style={s.saveEntryText}>Save Entry</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Entries */}
        <Text style={s.sectionTitle}>Your Entries</Text>

        {liveLoading ? (
          <LoadingState message="Opening your journal…" />
        ) : liveError ? (
          <ErrorState message={liveError} onRetry={journalQuery.refetch} retrying={journalQuery.reloading} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No entries yet"
            description="Your journal is a private space to reflect on the day's energy and your inner world. Start with today's prompt above."
          />
        ) : (
          entries.map((entry) => (
            <TouchableOpacity key={entry.id} style={s.entryCard} activeOpacity={0.7}>
              <View style={s.entryHeader}>
                <Calendar size={14} color={SolunaColors.creamMuted} />
                <Text style={s.entryDate}>
                  {formatISODateLong(entry.date)}
                </Text>
                <View style={s.moodBadge}>
                  <Smile size={10} color={SolunaColors.warmGold} />
                  <Text style={s.moodText}>{entry.moodLabel}</Text>
                </View>
              </View>
              {entry.title ? <Text style={s.entryTitle}>{entry.title}</Text> : null}
              <Text style={s.entryContent} numberOfLines={3}>{entry.content}</Text>
              {entry.context ? (
                <View style={s.entryFooter}>
                  <Sparkles size={12} color={SolunaColors.creamSubtle} />
                  <Text style={s.entryTransit}>{entry.context}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}

        {/* Look back */}
        {entries.length > 0 && (
          <View style={s.reflectionCard}>
            <Sparkles size={14} color={SolunaColors.warmGold} />
            <View style={{ flex: 1 }}>
              <Text style={s.reflectionTitle}>Look back</Text>
              <Text style={s.reflectionText}>
                Re-reading your own words often reveals patterns you didn't notice the first time. Revisit an earlier entry when you have a quiet moment.
              </Text>
            </View>
          </View>
        )}

        <Text style={s.footerNote}>
          Your journal is private — these reflections stay with you. We never read them, analyze them, or use them to train anything.
        </Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(232,184,109,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  // Prompt
  promptCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: "rgba(232,184,109,0.05)", borderRadius: SolunaRadius.md,
    padding: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 20,
  },
  promptTitle: { fontSize: 13, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body, marginBottom: 4 },
  promptText: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
  // New entry
  newEntryCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 24 },
  newEntryTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 4 },
  newEntryContext: { fontSize: 12, color: SolunaColors.creamSubtle, fontStyle: "italic", marginBottom: 16 },
  inputTitle: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", fontFamily: Fonts.body, marginBottom: 10 },
  inputContent: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", fontFamily: Fonts.body, minHeight: 100, marginBottom: 14 },
  moodLabel: { fontSize: 12, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, marginBottom: 8 },
  moodRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  moodChip: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  moodChipSelected: { backgroundColor: "rgba(232,184,109,0.1)", borderColor: "rgba(232,184,109,0.2)" },
  moodEmoji: { fontSize: 16, marginBottom: 2 },
  moodChipLabel: { fontSize: 9, color: SolunaColors.creamSubtle, fontWeight: "600" },
  moodChipLabelSelected: { color: SolunaColors.warmGold },
  saveError: { fontSize: 12, color: SolunaColors.softPeach, fontFamily: Fonts.body, marginBottom: 10 },
  newEntryBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: SolunaRadius.md, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
  cancelText: { fontSize: 14, color: SolunaColors.creamMuted, fontWeight: "600" },
  saveEntryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: SolunaRadius.md, backgroundColor: SolunaColors.warmGold },
  saveEntryText: { fontSize: 14, fontWeight: "600", color: SolunaColors.deepIndigo },
  // Section
  sectionTitle: { fontSize: 13, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 12 },
  // Entry card
  entryCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  entryDate: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  moodBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(232,184,109,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  moodText: { fontSize: 10, color: SolunaColors.warmGold, fontWeight: "600" },
  entryTitle: { fontSize: 16, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 6 },
  entryContent: { fontSize: 14, color: SolunaColors.creamMuted, lineHeight: 21, fontFamily: Fonts.body, marginBottom: 10 },
  entryFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  entryTransit: { fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, fontStyle: "italic" },
  // Reflection card
  reflectionCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: "rgba(185,163,227,0.05)", borderRadius: SolunaRadius.md,
    padding: 16, borderWidth: 1, borderColor: "rgba(185,163,227,0.08)", marginTop: 8, marginBottom: 16,
  },
  reflectionTitle: { fontSize: 13, fontWeight: "700", color: SolunaColors.gentleLavender, fontFamily: Fonts.body, marginBottom: 4 },
  reflectionText: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18, fontFamily: Fonts.body },
  // Footer
  footerNote: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 19, fontFamily: Fonts.body, fontStyle: "italic", paddingHorizontal: 20 },
});
