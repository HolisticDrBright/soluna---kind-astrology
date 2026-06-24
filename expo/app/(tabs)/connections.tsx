import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, Component } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { CONNECTIONS, ZODIAC_SYMBOLS, Fonts } from "@/constants/mockData";
import EmptyState from "@/components/EmptyState";
import {
  Heart, Plus, ChevronRight, Sparkles, Hash, Bird, Share2, Users,
} from "lucide-react-native";

// ─── Error Boundary ──────────────────────────────────────────
class CrashBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message ?? String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={errS.wrap}>
          <Text style={errS.title}>Connections Error</Text>
          <Text style={errS.msg}>{this.state.errorMsg}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
const errS = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: SolunaColors.deepIndigo, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 20, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 12 },
  msg: { fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 22 },
});

// ─── Compatibility Mini Ring ──────────────────────────────────
function MiniScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? SolunaColors.warmGold : score >= 60 ? SolunaColors.gentleLavender : SolunaColors.softPeach;
  return (
    <View style={mrS.ring}>
      <Text style={[mrS.score, { color }]}>{score}%</Text>
      <Text style={mrS.label}>{score >= 80 ? "Harmonious" : score >= 60 ? "Complementary" : "Growth"}</Text>
    </View>
  );
}
const mrS = StyleSheet.create({
  ring: { alignItems: "center", gap: 2 },
  score: { fontSize: 16, fontWeight: "700", fontFamily: Fonts.body },
  label: { fontSize: 9, color: SolunaColors.creamMuted, fontWeight: "600" },
});

// ─── Add Someone Form ─────────────────────────────────────────
function AddPersonForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  return (
    <View style={fS.wrap}>
      <Text style={fS.title}>Add Someone to Your Circle</Text>
      <TextInput
        style={fS.input} value={name} onChangeText={setName}
        placeholder="Their full name" placeholderTextColor={SolunaColors.creamSubtle}
      />
      <TextInput
        style={fS.input} value={date} onChangeText={setDate}
        placeholder="Birth date (e.g. July 5, 1993)" placeholderTextColor={SolunaColors.creamSubtle}
      />
      <Text style={fS.hint}>
        Just a name and birth date to get started. More details unlock deeper compatibility — but we keep it simple.
      </Text>
      <View style={fS.buttons}>
        <TouchableOpacity style={fS.cancelBtn} onPress={onClose}>
          <Text style={fS.cancelText}>Cancel</Text>
        </TouchableOpacity>
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

// ─── Person Card ──────────────────────────────────────────────
function PersonCard({ person }: { person: (typeof CONNECTIONS)[number] }) {
  return (
    <TouchableOpacity
      style={pcS.card}
      onPress={() => router.push({ pathname: "/compatibility-detail", params: { id: person.id } })}
      activeOpacity={0.7}
    >
      <View style={pcS.left}>
        <View style={pcS.avatar}>
          <Text style={pcS.avatarText}>{person.avatarInitial}</Text>
        </View>
        <View style={pcS.info}>
          <Text style={pcS.name}>{person.name}</Text>
          <Text style={pcS.meta}>
            {ZODIAC_SYMBOLS[person.sunSign]} {person.sunSign} · {person.relationship}
          </Text>
        </View>
      </View>
      <View style={pcS.right}>
        <MiniScoreRing score={person.compatibilityScore} />
        <ChevronRight size={16} color={SolunaColors.creamSubtle} />
      </View>
    </TouchableOpacity>
  );
}
const pcS = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 8 },
  left: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(232,184,109,0.1)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.heading },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 2 },
  meta: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
});

function ConnectionsContent() {
  const { user } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);
  if (!user) return null;

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Connections</Text>
        <Text style={st.sub}>
          See how you connect through astrology, numerology, and Chinese signs — framed with warmth, not judgment.
        </Text>

        {/* ── Hero CTA: Invite someone to create a Bond ── */}
        <TouchableOpacity style={st.inviteHero} activeOpacity={0.8}>
          <LinearGradient
            colors={["rgba(232,184,109,0.1)", "rgba(242,168,141,0.04)"]}
            style={st.inviteHeroInner}
          >
            <View style={st.inviteHeroIcon}>
              <Share2 size={24} color={SolunaColors.warmGold} />
            </View>
            <Text style={st.inviteHeroTitle}>Invite someone to create a Bond</Text>
            <Text style={st.inviteHeroDesc}>
              Linked partners get daily shared readings, a private Bond Space, and cross-system compatibility insight — for free.
            </Text>
            <View style={st.inviteHeroCta}>
              <Sparkles size={14} color={SolunaColors.warmGold} />
              <Text style={st.inviteHeroCtaText}>Send an invite</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Your Bonds Section ── */}
        <View style={st.sectionHeader}>
          <Heart size={16} color={SolunaColors.softPeach} fill={SolunaColors.softPeach} />
          <Text style={st.sectionTitle}>Your Bonds</Text>
        </View>
        <EmptyState
          icon={Heart}
          title="No Bonds yet"
          description="Bonds are linked partners who get daily shared readings with you. Invite someone special to start your first Bond — it's free for both of you."
          actionLabel="Invite someone"
          onAction={() => {}}
        />

        {/* ── Your Circle Section ── */}
        <View style={st.sectionHeader}>
          <Users size={16} color={SolunaColors.gentleLavender} />
          <Text style={st.sectionTitle}>Your Circle</Text>
        </View>

        {!showAddForm ? (
          <TouchableOpacity style={st.addButton} onPress={() => setShowAddForm(true)} activeOpacity={0.8}>
            <Plus size={20} color={SolunaColors.warmGold} />
            <Text style={st.addButtonText}>Add someone</Text>
          </TouchableOpacity>
        ) : (
          <AddPersonForm onClose={() => setShowAddForm(false)} />
        )}

        {CONNECTIONS.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}

        <View style={st.privacyNote}>
          <Text style={st.privacyText}>
            We never share real names or birth details between people unless both consent. Compatibility is always framed positively — even challenging aspects are growth edges.
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

export default function ConnectionsScreen() {
  return (
    <CrashBoundary>
      <ConnectionsContent />
    </CrashBoundary>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 }, scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 20, lineHeight: 20 },
  // Invite Hero
  inviteHero: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginBottom: 24 },
  inviteHeroInner: { padding: 20, borderRadius: SolunaRadius.lg, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)", alignItems: "center" },
  inviteHeroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(232,184,109,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1, borderColor: "rgba(232,184,109,0.2)" },
  inviteHeroTitle: { fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 8, textAlign: "center" },
  inviteHeroDesc: { fontSize: 13, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 20, marginBottom: 14, maxWidth: 280 },
  inviteHeroCta: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.15)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.25)" },
  inviteHeroCtaText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "700", fontFamily: Fonts.body },
  // Sections
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  // Circle
  addButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.lg,
    paddingVertical: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)",
    borderStyle: "dashed", marginBottom: 16,
  },
  addButtonText: { fontSize: 15, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  // Privacy
  privacyNote: { alignItems: "center", marginTop: 20, paddingHorizontal: 10 },
  privacyText: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 18, fontFamily: Fonts.body },
});
