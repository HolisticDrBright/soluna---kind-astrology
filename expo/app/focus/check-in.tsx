import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  Fonts,
  FOCUS_CATEGORIES,
  type FocusCategory,
  type CheckInResult,
} from "@/constants/mockData";
import {
  ArrowLeft,
  Sparkles,
  Brain,
  Lightbulb,
  Eye,
  BookOpen,
  Heart,
  Check,
  RefreshCw,
} from "lucide-react-native";

const CHECK_IN_OPTIONS: { id: CheckInResult; label: string; emoji: string; color: string }[] = [
  { id: "Better", label: "Better", emoji: "🌤️", color: "#7BC89C" },
  { id: "Still unclear", label: "Still unclear", emoji: "🌫️", color: "#B9A3E3" },
  { id: "Harder than expected", label: "Harder than expected", emoji: "🌧️", color: "#F2A88D" },
  { id: "I took the step", label: "I took the step", emoji: "✨", color: "#E8B86D" },
  { id: "I didn't take the step yet", label: "I didn't take the step yet", emoji: "⏳", color: "#B9A3E3" },
];

type CheckInStep = "howDidItGo" | "whatChanged" | "updatedGuidance";

// ─── Mock updated guidance by check-in result ───
const MOCK_UPDATED_GUIDANCE: Record<CheckInResult, {
  whatShifted: string;
  recommendedNext: string;
  suggestion: "keep" | "pause" | "resolve";
}> = {
  "Better": {
    whatShifted: "You took a step, even a tiny one, and something moved. Your Generator design responds to momentum — each aligned action builds the next. The shift isn't just external; your systems show your Solar Plexus is settling, which means your Emotional Authority is finding clarity. You're learning to trust your timing.",
    recommendedNext: "Keep going, but gently. Your Cancer Sun still needs rest between steps. This week: identify the NEXT smallest action you can take. Not the whole plan — just the next five-minute move. Your systems agree: consistency over intensity.",
    suggestion: "keep",
  },
  "Still unclear": {
    whatShifted: "Not having clarity yet isn't failure — it's your Emotional Authority doing its work. Your wave hasn't crested yet, and that's okay. Your Expression 7 needs time to process deeply. Your 6/2 Hermit might need a bit more solitude to hear your own voice over everyone else's opinions.",
    recommendedNext: "Give yourself one more week of observation without pressure to decide. But change ONE thing about how you're approaching this: try journaling for five minutes each morning, or talk to ONE trusted person — not for advice, just to hear yourself think out loud.",
    suggestion: "keep",
  },
  "Harder than expected": {
    whatShifted: "When things feel harder, your Cancer Moon in the 8th house can spiral into self-blame. But your systems show this isn't about you doing something wrong — it's about the situation being genuinely complex. Hard doesn't mean wrong. Your Wood Pig resilience is real, but resilience needs rest too.",
    recommendedNext: "Pause the active pushing. Your Generator Sacral might be saying 'this isn't the right approach' — not 'give up.' Try stepping back for 3 days. Do something restorative. Come back with fresh eyes, or consider whether adjusting your approach (rather than your goal) is what's needed.",
    suggestion: "pause",
  },
  "I took the step": {
    whatShifted: "You did it. Your Life Path 3 thrives on authentic expression, and taking a real step — especially one that felt vulnerable — IS living your design. Your defined Root center just released pressure that's been building. Notice how your body feels now compared to before you acted.",
    recommendedNext: "Celebrate this — genuinely. Your Cancer Sun and Wood Pig generosity often skip celebration, but your systems need acknowledgment to sustain momentum. Tell one person you trust. Then ask: what's the next small step? You've proven you can do this.",
    suggestion: "resolve",
  },
  "I didn't take the step yet": {
    whatShifted: "Not taking the step yet is information, not failure. Your Generator Sacral might be waiting for the right timing, or your Emotional Authority might still be riding the wave. Force isn't your design — responding from alignment is. What's the hesitation telling you? Is it fear, or is it wisdom?",
    recommendedNext: "Name what's in the way — just for yourself, no judgment. Write it down. Then ask: is this fear of the outcome, fear of the process, or a genuine 'not yet' from your gut? If it's fear, your systems say: start smaller. Break the step into something so tiny it feels almost silly. If it's a genuine 'not yet,' trust that too.",
    suggestion: "keep",
  },
};

export default function FocusCheckInScreen() {
  const { user } = useAppState();
  const params = useLocalSearchParams<{
    focusId?: string;
    category?: string;
    title?: string;
  }>();

  const [step, setStep] = useState<CheckInStep>("howDidItGo");
  const [selectedResult, setSelectedResult] = useState<CheckInResult | null>(null);
  const [whatChanged, setWhatChanged] = useState("");

  const category = params.category ?? "Something Personal";
  const categoryConfig = FOCUS_CATEGORIES.find((c) => c.id === category);
  const guidance = selectedResult ? MOCK_UPDATED_GUIDANCE[selectedResult] : null;

  const handleNext = useCallback(() => {
    if (step === "howDidItGo" && selectedResult) {
      setStep("whatChanged");
    } else if (step === "whatChanged") {
      setStep("updatedGuidance");
    }
  }, [step, selectedResult]);

  const handleFinish = useCallback(() => {
    router.back();
  }, []);

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
            <Text style={st.headerTitle}>Check In</Text>
            {params.title && (
              <Text style={st.headerSub}>{params.title}</Text>
            )}
          </View>
          <View style={st.backBtn} />
        </View>

        {/* ─── Step 1: How did it go? ─── */}
        {step === "howDidItGo" && (
          <View style={st.stepWrap}>
            <Text style={st.question}>How did it go?</Text>
            <Text style={st.hint}>
              No judgment — just an honest check-in with yourself.
            </Text>

            <View style={st.optionsList}>
              {CHECK_IN_OPTIONS.map((opt) => {
                const isSelected = selectedResult === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      st.optionCard,
                      isSelected && {
                        borderColor: `${opt.color}40`,
                        backgroundColor: `${opt.color}10`,
                      },
                    ]}
                    onPress={() => setSelectedResult(opt.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={st.optionEmoji}>{opt.emoji}</Text>
                    <Text
                      style={[
                        st.optionLabel,
                        isSelected && { color: opt.color, fontWeight: "700" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <View style={[st.checkMark, { backgroundColor: opt.color }]}>
                        <Check size={10} color={SolunaColors.deepIndigo} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[st.nextBtn, !selectedResult && st.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!selectedResult}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  st.nextBtnText,
                  !selectedResult && { color: SolunaColors.creamSubtle },
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Step 2: What changed? ─── */}
        {step === "whatChanged" && (
          <View style={st.stepWrap}>
            <Text style={st.question}>What changed?</Text>
            <Text style={st.hint}>
              Even a small shift is worth noticing. What's different since you started this Focus?
            </Text>

            <TextInput
              style={st.textInput}
              value={whatChanged}
              onChangeText={setWhatChanged}
              placeholder="Something shifted in how I see this…"
              placeholderTextColor={SolunaColors.creamSubtle}
              multiline
              textAlignVertical="top"
              autoFocus
            />

            <TouchableOpacity
              style={st.nextBtn}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={st.nextBtnText}>See updated guidance</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Step 3: Updated Guidance ─── */}
        {step === "updatedGuidance" && guidance && (
          <View style={st.stepWrap}>
            <Text style={st.question}>Updated for where you are now</Text>

            {/* What Shifted */}
            <View style={st.guidanceCard}>
              <View style={st.guidanceHeader}>
                <View style={[st.guidanceIcon, { backgroundColor: "rgba(232,184,109,0.1)" }]}>
                  <Sparkles size={16} color={SolunaColors.warmGold} />
                </View>
                <Text style={st.guidanceTitle}>What shifted</Text>
              </View>
              <Text style={st.guidanceBody}>{guidance.whatShifted}</Text>
            </View>

            {/* Recommended Next */}
            <View style={st.guidanceCard}>
              <View style={st.guidanceHeader}>
                <View style={[st.guidanceIcon, { backgroundColor: "rgba(123,200,156,0.1)" }]}>
                  <Lightbulb size={16} color={SolunaColors.success} />
                </View>
                <Text style={[st.guidanceTitle, { color: SolunaColors.success }]}>
                  What Soluna recommends next
                </Text>
              </View>
              <Text style={st.guidanceBody}>{guidance.recommendedNext}</Text>
            </View>

            {/* Suggestion */}
            <View
              style={[
                st.suggestionCard,
                guidance.suggestion === "keep" && st.suggestionKeep,
                guidance.suggestion === "pause" && st.suggestionPause,
                guidance.suggestion === "resolve" && st.suggestionResolve,
              ]}
            >
              {guidance.suggestion === "keep" && (
                <>
                  <RefreshCw size={18} color={SolunaColors.warmGold} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.suggestionTitle}>Keep this Focus active</Text>
                    <Text style={st.suggestionBody}>
                      There's still momentum here. Check in again next week or when something shifts.
                    </Text>
                  </View>
                </>
              )}
              {guidance.suggestion === "pause" && (
                <>
                  <Eye size={18} color={SolunaColors.softPeach} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.suggestionTitle}>Pause and let it breathe</Text>
                    <Text style={st.suggestionBody}>
                      Step back for a bit. You can reactivate whenever you're ready. No pressure, no guilt.
                    </Text>
                  </View>
                </>
              )}
              {guidance.suggestion === "resolve" && (
                <>
                  <Check size={18} color={SolunaColors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.suggestionTitle}>Ready to resolve</Text>
                    <Text style={st.suggestionBody}>
                      You've moved through something real. Close this Focus with intention — you can always start a new one.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Privacy */}
            <View style={st.privacyNote}>
              <Text style={st.privacyText}>
                This is reflective guidance, not a command. You choose what happens next.
              </Text>
            </View>

            <TouchableOpacity
              style={st.finishBtn}
              onPress={handleFinish}
              activeOpacity={0.7}
            >
              <Check size={18} color={SolunaColors.deepIndigo} />
              <Text style={st.finishBtnText}>Done for now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={st.askBtn}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/ask",
                  params: {
                    prompt: `I'm checking in on my Focus about ${params.title ?? category}. ${selectedResult ? `I felt ${selectedResult.toLowerCase()}.` : ""} Can you help me reflect on this?`,
                  },
                })
              }
              activeOpacity={0.7}
            >
              <Brain size={16} color={SolunaColors.gentleLavender} />
              <Text style={st.askBtnText}>Explore this with Soluna</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
  },
  headerSub: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    marginTop: 2,
  },

  // Steps
  stepWrap: { gap: 16 },
  question: {
    fontSize: 20,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
  },
  hint: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 19,
  },

  // Check-in options
  optionsList: { gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  optionEmoji: { fontSize: 22, width: 32, textAlign: "center" },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  checkMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  // Text input
  textInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    fontSize: 15,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    lineHeight: 23,
    minHeight: 140,
  },

  // Buttons
  nextBtn: {
    backgroundColor: SolunaColors.warmGold,
    paddingVertical: 16,
    borderRadius: SolunaRadius.md,
    alignItems: "center",
  },
  nextBtnDisabled: {
    backgroundColor: "rgba(232,184,109,0.2)",
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: SolunaColors.deepIndigo,
    fontFamily: Fonts.body,
  },

  // Guidance cards
  guidanceCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  guidanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  guidanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  guidanceBody: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 22,
  },

  // Suggestion
  suggestionCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  suggestionKeep: {
    backgroundColor: "rgba(232,184,109,0.06)",
    borderColor: "rgba(232,184,109,0.12)",
  },
  suggestionPause: {
    backgroundColor: "rgba(242,168,141,0.06)",
    borderColor: "rgba(242,168,141,0.12)",
  },
  suggestionResolve: {
    backgroundColor: "rgba(123,200,156,0.06)",
    borderColor: "rgba(123,200,156,0.12)",
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 4,
  },
  suggestionBody: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },

  // Privacy
  privacyNote: {
    backgroundColor: "rgba(232,184,109,0.04)",
    borderRadius: 10,
    padding: 10,
  },
  privacyText: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Finish / Ask buttons
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: SolunaColors.warmGold,
    paddingVertical: 14,
    borderRadius: SolunaRadius.md,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: SolunaColors.deepIndigo,
    fontFamily: Fonts.body,
  },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(185,163,227,0.08)",
    paddingVertical: 14,
    borderRadius: SolunaRadius.md,
    borderWidth: 1,
    borderColor: "rgba(185,163,227,0.15)",
  },
  askBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: SolunaColors.gentleLavender,
    fontFamily: Fonts.body,
  },
});
