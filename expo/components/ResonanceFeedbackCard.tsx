import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import SolunaColors, { SolunaRadius } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Sparkles, Check, RefreshCw } from "lucide-react-native";
import {
  submitResonanceFeedback,
  type ResonanceSource,
  type ResonanceValue,
} from "@/lib/api";

// ─── Vocabularies (mirror the backend's accepted values) ─────────────────────
const REASONS: { label: string; tag: string }[] = [
  { label: "Too vague", tag: "too_vague" },
  { label: "Too intense", tag: "too_intense" },
  { label: "Too mystical", tag: "too_mystical" },
  { label: "Not practical enough", tag: "not_practical_enough" },
  { label: "Wrong focus", tag: "wrong_focus" },
  { label: "Tone didn't fit me", tag: "tone_didnt_fit" },
  { label: "I wanted more depth", tag: "wanted_more_depth" },
  { label: "I wanted more emotional support", tag: "wanted_more_support" },
  { label: "Other", tag: "other" },
];

const REFRAMES: { label: string; value: string }[] = [
  { label: "Make it more practical", value: "make_it_more_practical" },
  { label: "Make it gentler", value: "make_it_gentler" },
  { label: "Go deeper", value: "go_deeper" },
  { label: "Make it less mystical", value: "make_it_less_mystical" },
  { label: "Focus on relationships", value: "focus_on_relationships" },
  { label: "Focus on work/school", value: "focus_on_work" },
  { label: "Give me one next step", value: "give_me_one_next_step" },
];

interface Props {
  sourceType: ResonanceSource;
  sourceId?: string;
  systemsReferenced?: string[];
  onSubmitted?: () => void;
  compact?: boolean;
}

type Phase = "ask" | "reasons" | "done" | "error";

export default function ResonanceFeedbackCard({
  sourceType,
  sourceId,
  systemsReferenced,
  onSubmitted,
  compact,
}: Props) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [resonance, setResonance] = useState<ResonanceValue>("partly");
  const [reasons, setReasons] = useState<string[]>([]);
  const [reframe, setReframe] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Got it. Soluna will tune future guidance to you.");

  const send = useCallback(async (value: ResonanceValue, withDetails: boolean) => {
    setSubmitting(true);
    const { data, error } = await submitResonanceFeedback({
      sourceType,
      sourceId,
      resonance: value,
      reasonTags: withDetails ? reasons : undefined,
      freeText: withDetails && freeText.trim() ? freeText.trim() : undefined,
      reframeRequested: withDetails && reframe ? reframe : undefined,
      systemsReferenced,
    });
    setSubmitting(false);
    if (error || !data?.ok) {
      setPhase("error");
      return;
    }
    setSuccessMsg(data.message || "Got it. Soluna will tune future guidance to you.");
    setPhase("done");
    onSubmitted?.();
  }, [sourceType, sourceId, reasons, freeText, reframe, systemsReferenced, onSubmitted]);

  const pickResonance = useCallback((value: ResonanceValue) => {
    setResonance(value);
    if (value === "yes") {
      void send("yes", false); // a clear yes needs no follow-up
    } else {
      setPhase("reasons");
    }
  }, [send]);

  const toggleReason = useCallback((tag: string) => {
    setReasons((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  // ── Success ──
  if (phase === "done") {
    return (
      <View style={[s.wrap, compact && s.wrapCompact, s.doneWrap]}>
        <View style={s.doneIcon}><Check size={15} color={SolunaColors.success} /></View>
        <Text style={s.doneText}>{successMsg}</Text>
      </View>
    );
  }

  // ── Error / retry ──
  if (phase === "error") {
    return (
      <View style={[s.wrap, compact && s.wrapCompact]}>
        <Text style={s.errorText}>That didn&apos;t go through. Mind trying once more?</Text>
        <TouchableOpacity
          style={s.retryBtn}
          onPress={() => send(resonance, resonance !== "yes")}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator size="small" color={SolunaColors.warmGold} />
            : (<><RefreshCw size={13} color={SolunaColors.warmGold} /><Text style={s.retryText}>Try again</Text></>)}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      <View style={s.header}>
        <Sparkles size={13} color={SolunaColors.warmGold} />
        <Text style={s.question}>Did this resonate with you?</Text>
      </View>

      {/* Primary: Yes / Partly / Not really */}
      <View style={s.row}>
        {([["yes", "Yes"], ["partly", "Partly"], ["no", "Not really"]] as const).map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[s.choice, resonance === val && phase === "reasons" && val !== "yes" && s.choiceActive]}
            onPress={() => pickResonance(val)}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={[s.choiceText, resonance === val && phase === "reasons" && val !== "yes" && s.choiceTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {submitting && phase === "ask" && (
        <ActivityIndicator size="small" color={SolunaColors.warmGold} style={{ marginTop: 12 }} />
      )}

      {/* Follow-up for partly / not really */}
      {phase === "reasons" && (
        <View style={s.followup}>
          <Text style={s.subLabel}>What felt off?</Text>
          <View style={s.chips}>
            {REASONS.map((r) => {
              const on = reasons.includes(r.tag);
              return (
                <TouchableOpacity key={r.tag} style={[s.chip, on && s.chipOn]} onPress={() => toggleReason(r.tag)} activeOpacity={0.8}>
                  <Text style={[s.chipText, on && s.chipTextOn]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={s.input}
            placeholder="What would have helped? (optional)"
            placeholderTextColor={SolunaColors.creamSubtle}
            value={freeText}
            onChangeText={setFreeText}
            multiline
            maxLength={1000}
          />

          <Text style={s.subLabel}>Want Soluna to reframe this?</Text>
          <View style={s.chips}>
            {REFRAMES.map((r) => {
              const on = reframe === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[s.chip, on && s.chipOn]}
                  onPress={() => setReframe(on ? null : r.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={s.sendBtn} onPress={() => send(resonance, true)} disabled={submitting} activeOpacity={0.85}>
            {submitting
              ? <ActivityIndicator size="small" color={SolunaColors.deepIndigo} />
              : <Text style={s.sendText}>Send feedback</Text>}
          </TouchableOpacity>
          <Text style={s.privacy}>This only tunes how Soluna talks with you — never your chart.</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(185,163,227,0.05)",
    borderRadius: SolunaRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(185,163,227,0.12)",
    padding: 16,
    marginVertical: 10,
  },
  wrapCompact: { padding: 13, marginVertical: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
  question: { fontSize: 13, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body },
  row: { flexDirection: "row", gap: 8 },
  choice: {
    flex: 1, paddingVertical: 10, borderRadius: SolunaRadius.md,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  choiceActive: { backgroundColor: "rgba(232,184,109,0.12)", borderColor: "rgba(232,184,109,0.3)" },
  choiceText: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, fontWeight: "600" },
  choiceTextActive: { color: SolunaColors.warmGold },
  followup: { marginTop: 16 },
  subLabel: {
    fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body,
    textTransform: "uppercase", letterSpacing: 1, fontWeight: "700", marginBottom: 10, marginTop: 4,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  chipOn: { backgroundColor: "rgba(185,163,227,0.15)", borderColor: "rgba(185,163,227,0.35)" },
  chipText: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  chipTextOn: { color: SolunaColors.gentleLavender, fontWeight: "600" },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: SolunaRadius.md,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 12, minHeight: 56,
    color: SolunaColors.cream, fontFamily: Fonts.body, fontSize: 13, marginBottom: 14,
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: SolunaColors.warmGold, borderRadius: SolunaRadius.md,
    paddingVertical: 12, alignItems: "center",
  },
  sendText: { fontSize: 14, fontWeight: "700", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  privacy: {
    fontSize: 10, color: SolunaColors.creamSubtle, fontFamily: Fonts.body,
    textAlign: "center", marginTop: 10, fontStyle: "italic",
  },
  doneWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  doneIcon: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(123,200,156,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  doneText: { flex: 1, fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 19 },
  errorText: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 12 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: "rgba(232,184,109,0.1)", borderRadius: SolunaRadius.md, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(232,184,109,0.2)",
  },
  retryText: { fontSize: 13, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});
