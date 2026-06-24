import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { CONNECTIONS, ZODIAC_SYMBOLS, Fonts } from "@/constants/mockData";
import { Heart, Plus, ChevronRight, Sparkles } from "lucide-react-native";

// ─── Compatibility Score Ring ─────────────────────────────────────
function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? SolunaColors.warmGold
      : score >= 60
        ? SolunaColors.gentleLavender
        : SolunaColors.softPeach;

  return (
    <View style={ringStyles.wrap}>
      <View style={[ringStyles.ring, { borderColor: "rgba(255,255,255,0.08)" }]}>
        <View
          style={[
            ringStyles.ringFill,
            {
              borderColor: color,
              borderTopColor: "transparent",
              borderRightColor: "transparent",
              transform: [{ rotate: `${(score / 100) * 360 - 90}deg` }],
            },
          ]}
        />
        <Text style={[ringStyles.score, { color }]}>{score}%</Text>
      </View>
      <Text style={ringStyles.label}>{label}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ringFill: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
  },
  score: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: Fonts.body,
  },
  label: {
    fontSize: 10,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    fontWeight: "600",
  },
});

// ─── Add Person Form (mini) ───────────────────────────────────────
function AddPersonForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  return (
    <View style={formStyles.wrap}>
      <Text style={formStyles.title}>Add Someone</Text>
      <TextInput
        style={formStyles.input}
        value={name}
        onChangeText={setName}
        placeholder="Their name"
        placeholderTextColor={SolunaColors.creamSubtle}
      />
      <TextInput
        style={formStyles.input}
        value={date}
        onChangeText={setDate}
        placeholder="Birth date (e.g. July 5, 1993)"
        placeholderTextColor={SolunaColors.creamSubtle}
      />
      <Text style={formStyles.hint}>
        Just a name and birth date is enough to get started. We'll keep it
        simple.
      </Text>
      <View style={formStyles.buttons}>
        <TouchableOpacity style={formStyles.cancelBtn} onPress={onClose}>
          <Text style={formStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[formStyles.addBtn, !name && formStyles.addBtnDisabled]}
          onPress={onClose}
          disabled={!name}
        >
          <Text
            style={[
              formStyles.addText,
              !name && { color: SolunaColors.creamSubtle },
            ]}
          >
            Add to Circle
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const formStyles = StyleSheet.create({
  wrap: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: SolunaRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: SolunaColors.cream,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    fontFamily: Fonts.body,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
    fontStyle: "italic",
    marginBottom: 16,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SolunaRadius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  addBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SolunaRadius.md,
    backgroundColor: "rgba(232, 184, 109, 0.15)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(232, 184, 109, 0.2)",
  },
  addBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.05)",
  },
  addText: {
    fontSize: 14,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
});

// ─── Connections Screen ──────────────────────────────────────────
export default function ConnectionsScreen() {
  const { user } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);

  if (!user) return null;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={screenStyles.gradient}
    >
      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={screenStyles.title}>Your Circle</Text>
        <Text style={screenStyles.subtitle}>
          See how you connect with the people who matter
        </Text>

        {/* Add button */}
        {!showAddForm && (
          <TouchableOpacity
            style={screenStyles.addButton}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.8}
          >
            <Plus size={20} color={SolunaColors.warmGold} />
            <Text style={screenStyles.addButtonText}>Add someone</Text>
          </TouchableOpacity>
        )}

        {showAddForm && <AddPersonForm onClose={() => setShowAddForm(false)} />}

        {/* People list */}
        <View style={screenStyles.peopleWrap}>
          {CONNECTIONS.map((person) => (
            <TouchableOpacity
              key={person.id}
              style={screenStyles.personCard}
              onPress={() =>
                router.push({
                  pathname: "/compatibility-detail",
                  params: { id: person.id },
                })
              }
              activeOpacity={0.7}
            >
              <View style={screenStyles.personLeft}>
                <View
                  style={[
                    screenStyles.avatar,
                    {
                      backgroundColor:
                        person.compatibilityScore >= 80
                          ? "rgba(232,184,109,0.12)"
                          : person.compatibilityScore >= 60
                            ? "rgba(185,163,227,0.12)"
                            : "rgba(242,168,141,0.12)",
                    },
                  ]}
                >
                  <Text style={screenStyles.avatarText}>
                    {person.avatarInitial}
                  </Text>
                </View>
                <View style={screenStyles.personInfo}>
                  <Text style={screenStyles.personName}>{person.name}</Text>
                  <Text style={screenStyles.personMeta}>
                    {ZODIAC_SYMBOLS[person.sunSign]} {person.sunSign} ·{" "}
                    {person.relationship}
                  </Text>
                </View>
              </View>

              <View style={screenStyles.personRight}>
                <ScoreRing
                  score={person.compatibilityScore}
                  label={person.compatibilityLabel}
                />
                <ChevronRight size={16} color={SolunaColors.creamSubtle} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty state hint */}
        <View style={screenStyles.emptyHint}>
          <Heart size={20} color={SolunaColors.creamSubtle} />
          <Text style={screenStyles.emptyText}>
            Add friends, partners, and family to see how your charts interact.
            Even challenging aspects are framed with warmth — every connection
            has something to teach us.
          </Text>
        </View>

        <View style={screenStyles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

const screenStyles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  title: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    marginBottom: 20,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(232, 184, 109, 0.08)",
    borderRadius: SolunaRadius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(232, 184, 109, 0.15)",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 15,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  peopleWrap: {
    gap: 10,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
  },
  personLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 3,
  },
  personMeta: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  personRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyHint: {
    alignItems: "center",
    gap: 10,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    color: SolunaColors.creamSubtle,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  bottomSpacer: { height: 100 },
});
