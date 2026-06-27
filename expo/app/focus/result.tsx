import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  Fonts,
  MOCK_FOCUS_RESULTS,
  FOCUS_CATEGORIES,
  type FocusCategory,
  type FocusResult,
} from "@/constants/mockData";
import ConfidencePill from "@/components/ConfidencePill";
import ResonanceFeedbackCard from "@/components/ResonanceFeedbackCard";
import {
  ArrowLeft,
  Sparkles,
  Brain,
  Eye,
  Lightbulb,
  Heart,
  BookOpen,
  Save,
  MessageCircle,
  Clock,
  Share2,
} from "lucide-react-native";

export default function FocusResultScreen() {
  const { user } = useAppState();
  const params = useLocalSearchParams<{
    category: string;
    supportMode: string;
    connectedPersonName: string;
    freeText: string;
  }>();

  const category = (params.category as FocusCategory) ?? "Something Personal";
  const categoryConfig = FOCUS_CATEGORIES.find((c) => c.id === category);
  const result: FocusResult =
    MOCK_FOCUS_RESULTS[category] ?? MOCK_FOCUS_RESULTS.fallback!;

  const [saved, setSaved] = useState(false);
  const [showSystemDetail, setShowSystemDetail] = useState<string | null>(null);

  const systemExplanations: Record<string, string> = {
    Astrology:
      "Your birth chart provides a map of your natural tendencies, emotional patterns, and current transits. This insight draws from your Sun in Cancer, Moon in Pisces, rising sign, and current planetary movements.",
    Numerology:
      "Your Life Path, Expression, Soul Urge, and Personal Year numbers create a numerical blueprint of your purpose, gifts, and current season. This insight draws from your core numbers and current personal cycles.",
    "Human Design":
      "Your Human Design type, strategy, authority, and defined centers reveal how you're designed to make decisions and use energy. This insight draws from your Generator design and Emotional Authority.",
    Chinese:
      "Your Chinese zodiac animal and element offer a complementary lens on your character, timing, and natural rhythms. This insight draws from your Wood Pig nature and current animal-year dynamics.",
  };

  const handleSave = useCallback(() => setSaved(true), []);

  if (!user) return null;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={st.gradient}
    >
      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={st.backBtn}
          >
            <ArrowLeft size={20} color={SolunaColors.creamMuted} />
          </TouchableOpacity>
          <View style={st.headerCenter}>
            <Text style={st.headerTitle}>Your Focus</Text>
            {categoryConfig && (
              <View style={st.categoryBadge}>
                <Text style={st.categoryBadgeEmoji}>{categoryConfig.emoji}</Text>
                <Text style={[st.categoryBadgeText, { color: categoryConfig.color }]}>
                  {categoryConfig.label}
                </Text>
              </View>
            )}
          </View>
          <View style={st.backBtn} />
        </View>

        {/* ─── What Soluna Notices ─── */}
        <View style={st.sectionCard}>
          <View style={st.sectionHeader}>
            <View style={[st.sectionIcon, { backgroundColor: "rgba(232,184,109,0.1)" }]}>
              <Sparkles size={16} color={SolunaColors.warmGold} />
            </View>
            <Text style={st.sectionTitle}>What Soluna Notices</Text>
          </View>
          <Text style={st.sectionBody}>{result.whatSolunaNotices}</Text>
        </View>

        {/* ─── The Deeper Pattern ─── */}
        <View style={st.sectionCard}>
          <View style={st.sectionHeader}>
            <View style={[st.sectionIcon, { backgroundColor: "rgba(185,163,227,0.1)" }]}>
              <Brain size={16} color={SolunaColors.gentleLavender} />
            </View>
            <Text style={[st.sectionTitle, { color: SolunaColors.gentleLavender }]}>
              The Deeper Pattern
            </Text>
          </View>
          <Text style={st.sectionBody}>{result.deeperPattern}</Text>
        </View>

        {/* ─── Watch For ─── */}
        <View style={st.sectionCard}>
          <View style={st.sectionHeader}>
            <View style={[st.sectionIcon, { backgroundColor: "rgba(242,168,141,0.1)" }]}>
              <Eye size={16} color={SolunaColors.softPeach} />
            </View>
            <Text style={[st.sectionTitle, { color: SolunaColors.softPeach }]}>
              Watch For
            </Text>
          </View>
          <Text style={st.sectionBody}>{result.watchFor}</Text>
        </View>

        {/* ─── Try This Next ─── */}
        <View style={st.sectionCard}>
          <View style={st.sectionHeader}>
            <View style={[st.sectionIcon, { backgroundColor: "rgba(123,200,156,0.1)" }]}>
              <Lightbulb size={16} color={SolunaColors.success} />
            </View>
            <Text style={[st.sectionTitle, { color: SolunaColors.success }]}>
              Try This Next
            </Text>
          </View>
          <Text style={st.sectionBody}>{result.tryThisNext}</Text>
        </View>

        {/* ─── If This Involves Another Person ─── */}
        {result.ifInvolvesOther && (
          <View style={st.sectionCard}>
            <View style={st.sectionHeader}>
              <View style={[st.sectionIcon, { backgroundColor: "rgba(242,168,141,0.1)" }]}>
                <Heart size={16} color={SolunaColors.softPeach} />
              </View>
              <Text style={[st.sectionTitle, { color: SolunaColors.softPeach }]}>
                If This Involves Another Person
              </Text>
            </View>
            <Text style={st.sectionBody}>{result.ifInvolvesOther}</Text>
          </View>
        )}

        {/* ─── Reflection Prompt ─── */}
        <View style={st.sectionCard}>
          <View style={st.sectionHeader}>
            <View style={[st.sectionIcon, { backgroundColor: "rgba(185,163,227,0.1)" }]}>
              <BookOpen size={16} color={SolunaColors.gentleLavender} />
            </View>
            <Text style={[st.sectionTitle, { color: SolunaColors.gentleLavender }]}>
              Reflection Prompt
            </Text>
          </View>
          <Text style={st.reflectionText}>{result.reflectionPrompt}</Text>
        </View>

        {/* ─── Resonance feedback on the focus guidance ─── */}
        <ResonanceFeedbackCard sourceType="focus" sourceId={category} />

        {/* ─── Systems Referenced ─── */}
        <View style={st.systemsSection}>
          <Text style={st.systemsLabel}>Systems referenced in this guidance</Text>
          <View style={st.systemsRow}>
            {result.systemsReferenced.map((sys) => {
              const isExpanded = showSystemDetail === sys;
              return (
                <View key={sys}>
                  <TouchableOpacity
                    style={[
                      st.systemChip,
                      isExpanded && {
                        backgroundColor: "rgba(232,184,109,0.1)",
                        borderColor: "rgba(232,184,109,0.2)",
                      },
                    ]}
                    onPress={() =>
                      setShowSystemDetail(isExpanded ? null : sys)
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        st.systemChipText,
                        isExpanded && { color: SolunaColors.warmGold },
                      ]}
                    >
                      {sys}
                    </Text>
                  </TouchableOpacity>
                  {isExpanded && systemExplanations[sys] && (
                    <View style={st.systemDetail}>
                      <Text style={st.systemDetailText}>
                        {systemExplanations[sys]}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── Confidence ─── */}
        <View style={st.confWrap}>
          <ConfidencePill level="verified" />
        </View>

        {/* ─── Privacy note ─── */}
        <View style={st.privacyNote}>
          <Text style={st.privacyText}>
            This is reflective guidance, not a command. You choose what Soluna remembers.
          </Text>
        </View>

        {/* ─── Follow-Up Actions ─── */}
        <View style={st.actions}>
          <TouchableOpacity
            style={st.actionBtn}
            onPress={() =>
              router.push({
                pathname: "/focus/check-in",
                params: {
                  focusId: "new",
                  category,
                  title: categoryConfig?.label ?? category,
                },
              })
            }
            activeOpacity={0.7}
          >
            <Clock size={16} color={SolunaColors.warmGold} />
            <Text style={st.actionText}>Check in after I try this</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.actionBtn, saved && st.actionBtnSaved]}
            onPress={handleSave}
            disabled={saved}
            activeOpacity={0.7}
          >
            <Save size={16} color={saved ? SolunaColors.success : SolunaColors.creamMuted} />
            <Text style={[st.actionText, saved && { color: SolunaColors.success }]}>
              {saved ? "Focus saved" : "Save this Focus"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={st.actionBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/ask",
                params: {
                  prompt: `I'm working through something around ${categoryConfig?.label.toLowerCase() ?? category.toLowerCase()}. Can you help me go deeper?`,
                },
              })
            }
            activeOpacity={0.7}
          >
            <MessageCircle size={16} color={SolunaColors.gentleLavender} />
            <Text style={[st.actionText, { color: SolunaColors.gentleLavender }]}>
              Ask a follow-up
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeEmoji: { fontSize: 12 },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  sectionBody: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 22,
  },

  // Reflection
  reflectionText: {
    fontSize: 15,
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
    lineHeight: 24,
    fontStyle: "italic",
  },

  // Systems
  systemsSection: { marginBottom: 14 },
  systemsLabel: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  systemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  systemChip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  systemChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  systemDetail: {
    marginTop: 6,
    backgroundColor: "rgba(232,184,109,0.04)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.08)",
    maxWidth: 280,
  },
  systemDetailText: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    lineHeight: 17,
  },

  // Confidence
  confWrap: { marginBottom: 10 },

  // Privacy
  privacyNote: {
    backgroundColor: "rgba(232,184,109,0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.1)",
  },
  privacyText: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Actions
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 14,
    borderRadius: SolunaRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionBtnSaved: {
    borderColor: "rgba(123,200,156,0.2)",
    backgroundColor: "rgba(123,200,156,0.06)",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
});
