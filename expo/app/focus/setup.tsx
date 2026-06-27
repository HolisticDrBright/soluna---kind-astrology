import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useCallback, useMemo } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  Fonts,
  FOCUS_CATEGORIES,
  FOCUS_SUPPORT_OPTIONS,
  FOCUS_CONTEXT_OPTIONS,
  type FocusCategory,
  type FocusSupport,
  type FocusContext,
} from "@/constants/mockData";
import { CONNECTIONS } from "@/constants/demoData";
import { isDemoMode } from "@/lib/runtimeMode";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Shield,
  Check,
} from "lucide-react-native";

type Step = "category" | "support" | "connections" | "context" | "freetext";

const STEP_ORDER: Step[] = ["category", "support", "connections", "context", "freetext"];
const STEP_LABELS: Record<Step, string> = {
  category: "What are you navigating?",
  support: "What kind of support do you want?",
  connections: "Should Soluna consider anyone?",
  context: "What context may Soluna use?",
  freetext: "Tell Soluna what's going on",
};

const FREETEXT_PLACEHOLDERS = [
  "I'm deciding whether to leave my job.",
  "I'm having conflict with my partner.",
  "I feel stuck choosing between two schools.",
  "I need to have a hard conversation with my mom.",
  "I'm trying to stop people-pleasing.",
];

export default function FocusSetupScreen() {
  const { user } = useAppState();
  const params = useLocalSearchParams<{
    preselectedCategory?: string;
    preselectedBondId?: string;
    preselectedBondName?: string;
  }>();

  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<FocusCategory | null>(
    (params.preselectedCategory as FocusCategory) ?? null,
  );
  const [supportMode, setSupportMode] = useState<FocusSupport | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<string[]>(
    params.preselectedBondId ? [params.preselectedBondId] : [],
  );
  const [selectedContext, setSelectedContext] = useState<FocusContext[]>([]);
  const [freeText, setFreeText] = useState("");
  const [placeHolderIdx] = useState(
    Math.floor(Math.random() * FREETEXT_PLACEHOLDERS.length),
  );

  // Demo-only sample connections; live mode shows the picker with none.
  const connections = isDemoMode ? CONNECTIONS : [];

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;
  // Skip connections step if no connection people exist
  const effectiveSteps = connections.length > 0 ? totalSteps : totalSteps - 1;

  const canAdvance = useMemo(() => {
    switch (step) {
      case "category":
        return category !== null;
      case "support":
        return supportMode !== null;
      case "connections":
        return true; // optional
      case "context":
        return selectedContext.length > 0;
      case "freetext":
        return freeText.trim().length > 0;
    }
  }, [step, category, supportMode, selectedContext, freeText]);

  const handleNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    let nextIdx = idx + 1;
    // Skip connections if no connections exist
    if (
      STEP_ORDER[nextIdx] === "connections" &&
      connections.length === 0
    ) {
      nextIdx = nextIdx + 1;
    }
    if (nextIdx < STEP_ORDER.length) {
      setStep(STEP_ORDER[nextIdx]);
    } else {
      // Navigate to result
      const connectedPerson =
        selectedConnections.length > 0
          ? connections.find((c) => c.id === selectedConnections[0])
          : undefined;
      router.push({
        pathname: "/focus/result",
        params: {
          category: category!,
          supportMode: supportMode!,
          connectedPersonId: connectedPerson?.id ?? "",
          connectedPersonName: connectedPerson?.name ?? "",
          contextUsed: selectedContext.join(","),
          freeText,
        },
      });
    }
  }, [step, category, supportMode, selectedConnections, selectedContext, freeText]);

  const handleBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      let prevIdx = idx - 1;
      if (
        STEP_ORDER[prevIdx] === "connections" &&
        connections.length === 0
      ) {
        prevIdx = prevIdx - 1;
      }
      setStep(STEP_ORDER[Math.max(0, prevIdx)]);
    } else {
      router.back();
    }
  }, [step]);

  const toggleConnection = useCallback((id: string) => {
    setSelectedConnections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [id],
    );
  }, []);

  const toggleContext = useCallback((ctx: FocusContext) => {
    setSelectedContext((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx],
    );
  }, []);

  if (!user) return null;

  const progressPercent = ((stepIndex + 1) / effectiveSteps) * 100;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={st.gradient}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={handleBack} style={st.backBtn}>
            <ArrowLeft size={20} color={SolunaColors.creamMuted} />
          </TouchableOpacity>
          <View style={st.headerCenter}>
            <Text style={st.headerTitle}>Soluna Focus</Text>
            <Text style={st.headerStep}>
              Step {stepIndex + 1} of {effectiveSteps}
            </Text>
          </View>
          <View style={st.backBtn} />
        </View>

        {/* Progress bar */}
        <View style={st.progressBar}>
          <View
            style={[st.progressFill, { width: `${progressPercent}%` as unknown as number }]}
          />
        </View>

        <ScrollView
          style={st.body}
          contentContainerStyle={st.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Privacy note ─── */}
          <View style={st.privacyNote}>
            <Shield size={12} color={SolunaColors.warmGold} />
            <Text style={st.privacyText}>
              You choose what Soluna considers. This is reflective guidance, not
              a command. You can change this anytime.
            </Text>
          </View>

          <Text style={st.question}>{STEP_LABELS[step]}</Text>

          {/* ─── Step: Category ─── */}
          {step === "category" && (
            <View style={st.optionsGrid}>
              {FOCUS_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      st.categoryCard,
                      isSelected && {
                        borderColor: `${cat.color}40`,
                        backgroundColor: `${cat.color}10`,
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={st.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        st.categoryLabel,
                        isSelected && { color: cat.color, fontWeight: "700" },
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {isSelected && (
                      <View style={[st.checkMark, { backgroundColor: cat.color }]}>
                        <Check size={10} color={SolunaColors.deepIndigo} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ─── Step: Support Mode ─── */}
          {step === "support" && (
            <View style={st.optionsList}>
              {FOCUS_SUPPORT_OPTIONS.map((opt) => {
                const isSelected = supportMode === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      st.supportCard,
                      isSelected && {
                        borderColor: `${opt.color}40`,
                        backgroundColor: `${opt.color}10`,
                      },
                    ]}
                    onPress={() => setSupportMode(opt.id)}
                    activeOpacity={0.7}
                  >
                    <View style={st.supportTop}>
                      <Text style={st.supportEmoji}>{opt.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            st.supportLabel,
                            isSelected && { color: opt.color, fontWeight: "700" },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text style={st.supportDesc}>{opt.description}</Text>
                      </View>
                      {isSelected && (
                        <View
                          style={[st.checkMark, { backgroundColor: opt.color }]}
                        >
                          <Check size={10} color={SolunaColors.deepIndigo} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ─── Step: Connections ─── */}
          {step === "connections" && (
            <View style={st.optionsList}>
              <TouchableOpacity
                style={[
                  st.connectionCard,
                  selectedConnections.length === 0 && st.connectionCardActive,
                ]}
                onPress={() => setSelectedConnections([])}
                activeOpacity={0.7}
              >
                <View style={st.connectionTop}>
                  <Text style={st.connectionEmoji}>🧘</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.connectionLabel}>No, just me</Text>
                    <Text style={st.connectionDesc}>
                      Keep this Focus private to your own reflection.
                    </Text>
                  </View>
                  {selectedConnections.length === 0 && (
                    <View
                      style={[
                        st.checkMark,
                        { backgroundColor: SolunaColors.gentleLavender },
                      ]}
                    >
                      <Check size={10} color={SolunaColors.deepIndigo} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {connections.map((person) => {
                const isSelected = selectedConnections.includes(person.id);
                return (
                  <TouchableOpacity
                    key={person.id}
                    style={[
                      st.connectionCard,
                      isSelected && st.connectionCardActive,
                    ]}
                    onPress={() => toggleConnection(person.id)}
                    activeOpacity={0.7}
                  >
                    <View style={st.connectionTop}>
                      <View style={st.connectionAvatarSmall}>
                        <Text style={st.connectionAvatarText}>
                          {person.avatarInitial}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={st.connectionLabel}>{person.name}</Text>
                        <Text style={st.connectionDesc}>
                          {person.relationship} · {person.sunSign}
                        </Text>
                      </View>
                      {isSelected && (
                        <View
                          style={[
                            st.checkMark,
                            { backgroundColor: SolunaColors.warmGold },
                          ]}
                        >
                          <Check size={10} color={SolunaColors.deepIndigo} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ─── Step: Context ─── */}
          {step === "context" && (
            <View style={st.optionsList}>
              <Text style={st.contextHint}>
                You choose what Soluna considers. You can change this anytime.
              </Text>
              {FOCUS_CONTEXT_OPTIONS.map((ctx) => {
                const isSelected = selectedContext.includes(ctx.id);
                return (
                  <TouchableOpacity
                    key={ctx.id}
                    style={[
                      st.contextCard,
                      isSelected && st.contextCardActive,
                    ]}
                    onPress={() => toggleContext(ctx.id)}
                    activeOpacity={0.7}
                  >
                    <View style={st.contextTop}>
                      <Text style={st.contextEmoji}>{ctx.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={st.contextLabel}>{ctx.label}</Text>
                        <Text style={st.contextDesc}>{ctx.description}</Text>
                      </View>
                      <View
                        style={[
                          st.contextCheckbox,
                          isSelected && st.contextCheckboxActive,
                        ]}
                      >
                        {isSelected && (
                          <Check size={12} color={SolunaColors.deepIndigo} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ─── Step: Free Text ─── */}
          {step === "freetext" && (
            <View style={st.freeTextWrap}>
              <TextInput
                style={st.freeTextInput}
                value={freeText}
                onChangeText={setFreeText}
                placeholder={FREETEXT_PLACEHOLDERS[placeHolderIdx]}
                placeholderTextColor={SolunaColors.creamSubtle}
                multiline
                textAlignVertical="top"
                autoFocus
                maxLength={800}
              />
              <Text style={st.charCount}>{freeText.length}/800</Text>
            </View>
          )}
        </ScrollView>

        {/* ─── Bottom Nav ─── */}
        <View style={st.bottomNav}>
          <TouchableOpacity
            style={st.nextBtn}
            onPress={handleNext}
            disabled={!canAdvance}
            activeOpacity={0.7}
          >
            <Text
              style={[
                st.nextBtnText,
                !canAdvance && { color: SolunaColors.creamSubtle },
              ]}
            >
              {step === "freetext" ? "Receive Guidance" : "Next"}
            </Text>
            <ArrowRight
              size={18}
              color={
                canAdvance ? SolunaColors.deepIndigo : SolunaColors.creamSubtle
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SolunaSpacing.md,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
  },
  headerStep: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: SolunaSpacing.md,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%" as unknown as number,
    backgroundColor: SolunaColors.warmGold,
    borderRadius: 2,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: SolunaSpacing.md,
    paddingTop: 16,
    paddingBottom: 24,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(232,184,109,0.06)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.1)",
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 16,
  },
  question: {
    fontSize: 20,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
    marginBottom: 20,
  },

  // Category
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "47%" as unknown as number,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    position: "relative",
  },
  categoryEmoji: { fontSize: 28, marginBottom: 8 },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  checkMark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Support Mode
  optionsList: { gap: 10 },
  supportCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  supportTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  supportEmoji: { fontSize: 24, width: 32, textAlign: "center" },
  supportLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 3,
  },
  supportDesc: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 17,
  },

  // Connections
  connectionCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  connectionCardActive: {
    borderColor: "rgba(185,163,227,0.3)",
    backgroundColor: "rgba(185,163,227,0.06)",
  },
  connectionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  connectionEmoji: { fontSize: 24, width: 32, textAlign: "center" },
  connectionAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(232,184,109,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  connectionAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: SolunaColors.warmGold,
    fontFamily: Fonts.heading,
  },
  connectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  connectionDesc: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },

  // Context
  contextHint: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    fontStyle: "italic",
    marginBottom: 6,
    paddingHorizontal: 4,
    lineHeight: 17,
  },
  contextCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  contextCardActive: {
    borderColor: "rgba(232,184,109,0.25)",
    backgroundColor: "rgba(232,184,109,0.06)",
  },
  contextTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contextEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  contextLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 3,
  },
  contextDesc: {
    fontSize: 11,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 16,
  },
  contextCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  contextCheckboxActive: {
    backgroundColor: SolunaColors.warmGold,
    borderColor: SolunaColors.warmGold,
  },

  // Free Text
  freeTextWrap: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 4,
  },
  freeTextInput: {
    fontSize: 15,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    lineHeight: 23,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 160,
  },
  charCount: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    textAlign: "right",
    paddingHorizontal: 14,
    paddingBottom: 10,
    fontFamily: Fonts.body,
  },

  // Bottom Nav
  bottomNav: {
    paddingHorizontal: SolunaSpacing.md,
    paddingBottom: Platform.OS === "ios" ? 100 : 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: SolunaColors.warmGold,
    paddingVertical: 16,
    borderRadius: SolunaRadius.md,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: SolunaColors.deepIndigo,
    fontFamily: Fonts.body,
  },
});
