import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Share, Alert, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import * as Linking from "expo-linking";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { useAuth } from "@/state/useAuth";
import { useAddConnection, useBonds, useConnections, useCreateInvite } from "@/lib/hooks";
import { CONNECTIONS, ZODIAC_SYMBOLS, Fonts, type ZodiacSign } from "@/constants/mockData";
import { Heart, Plus, ChevronRight, Hash, Bird, UserPlus, Send } from "lucide-react-native";

const LENSES = ["Romance", "Friendship", "Work", "Family"] as const;
type Lens = (typeof LENSES)[number];

interface DisplayConn {
  id: string;
  name: string;
  initial: string;
  sunSign?: ZodiacSign;
  relationship?: string;
  score: number | null;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? SolunaColors.warmGold : score >= 60 ? SolunaColors.gentleLavender : SolunaColors.softPeach;
  return (
    <View style={rS.ring}>
      <Text style={[rS.score, { color }]}>{score}%</Text>
    </View>
  );
}
const rS = StyleSheet.create({
  ring: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  score: { fontSize: 14, fontWeight: "700", fontFamily: Fonts.body },
});

export default function ConnectionsScreen() {
  const { user } = useAppState();
  const { authActive, isAuthenticated } = useAuth();
  const live = authActive && isAuthenticated;
  const [lens, setLens] = useState<Lens>("Romance");
  const [showAddForm, setShowAddForm] = useState(false);
  const [inviting, setInviting] = useState(false);

  const { data: bonds = [] } = useBonds();
  const { data: rawConnections } = useConnections();
  const createInvite = useCreateInvite();
  const addConnection = useAddConnection();

  if (!user) return null;

  // Normalize manual connections to a single display shape (mock vs backend).
  const connections: DisplayConn[] = live
    ? ((rawConnections ?? []) as any[]).map((c) => ({
      id: c.id,
      name: c.name,
      initial: (c.name ?? "?").charAt(0).toUpperCase(),
      sunSign: c.blueprint?.summary?.sunSign,
      relationship: c.relationship ?? undefined,
      score: null,
    }))
    : CONNECTIONS.map((c) => ({
      id: c.id, name: c.name, initial: c.avatarInitial, sunSign: c.sunSign,
      relationship: c.relationship, score: c.compatibilityScore,
    }));

  const onInvite = async () => {
    if (!live) {
      Alert.alert("Sign in to invite", "Partner Bonds need an account so you can both share a daily reading.");
      return;
    }
    setInviting(true);
    try {
      const { inviteCode, rewardTeaser } = await createInvite.mutateAsync({ lens: lens.toLowerCase() });
      const url = Linking.createURL(`invite/${inviteCode}`);
      await Share.share({
        message: `Join me on Soluna for our ${lens} Bond ✨ ${rewardTeaser}\n${url}`,
      });
    } catch (e) {
      Alert.alert("Couldn't create invite", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const onAdd = async (name: string, dateText: string) => {
    setShowAddForm(false);
    if (!live) {
      Alert.alert("Sign in to add people", "Connections sync to your account once you're signed in.");
      return;
    }
    const parsed = new Date(dateText);
    const birthDate = isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
    if (!birthDate) {
      Alert.alert("Add a birth date", "Please include a birth date like 1993-07-05 so we can read the connection.");
      return;
    }
    try {
      await addConnection.mutateAsync({ name, birthDate });
    } catch (e) {
      Alert.alert("Couldn't add", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Your Circle</Text>
        <Text style={st.sub}>See how you connect across astrology, numerology, and Chinese signs — together.</Text>

        {/* Lens tabs */}
        <View style={st.lensRow}>
          {LENSES.map((l) => (
            <TouchableOpacity key={l} style={[st.lensTab, lens === l && st.lensTabActive]} onPress={() => setLens(l)}>
              <Text style={[st.lensText, lens === l && st.lensTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invite partner CTA */}
        <TouchableOpacity style={st.inviteCard} onPress={onInvite} activeOpacity={0.85} disabled={inviting}>
          <LinearGradient colors={["rgba(232,184,109,0.14)", "rgba(242,168,141,0.07)"]} style={st.inviteInner}>
            {inviting ? <ActivityIndicator color={SolunaColors.warmGold} /> : <Send size={18} color={SolunaColors.warmGold} />}
            <View style={{ flex: 1 }}>
              <Text style={st.inviteTitle}>Invite a partner</Text>
              <Text style={st.inviteSub}>Link up for a daily {lens} Bond — you both get a free reading.</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Your Bonds */}
        {bonds.length > 0 && (
          <>
            <Text style={st.sectionTitle}>Your Bonds</Text>
            <View style={st.peopleWrap}>
              {bonds.map((b) => (
                <TouchableOpacity key={b.linkId} style={st.personCard} activeOpacity={0.7}
                  onPress={() => router.push({ pathname: "/bond-space", params: { linkId: b.linkId } })}>
                  <View style={st.personLeft}>
                    <View style={[st.avatar, { backgroundColor: "rgba(242,168,141,0.14)" }]}>
                      <Heart size={20} color={SolunaColors.softPeach} />
                    </View>
                    <View style={st.personInfo}>
                      <Text style={st.personName}>{b.partnerName}</Text>
                      <Text style={st.personMeta}>{b.lens.charAt(0).toUpperCase() + b.lens.slice(1)} Bond · linked</Text>
                    </View>
                  </View>
                  <View style={st.personRight}>
                    {b.score != null && <ScoreRing score={b.score} />}
                    <ChevronRight size={16} color={SolunaColors.creamSubtle} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Manual connections */}
        <View style={st.addRow}>
          <Text style={st.sectionTitle}>People in your circle</Text>
          {!showAddForm && (
            <TouchableOpacity style={st.addChip} onPress={() => setShowAddForm(true)}>
              <Plus size={14} color={SolunaColors.warmGold} /><Text style={st.addChipText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
        {showAddForm && <AddPersonForm onClose={() => setShowAddForm(false)} onSubmit={onAdd} />}

        <View style={st.peopleWrap}>
          {connections.map((person) => (
            <TouchableOpacity
              key={person.id} style={st.personCard}
              onPress={() => router.push({ pathname: "/compatibility-detail", params: { id: person.id, lens: lens.toLowerCase() } })}
              activeOpacity={0.7}
            >
              <View style={st.personLeft}>
                <View style={[st.avatar, { backgroundColor: "rgba(185,163,227,0.12)" }]}>
                  <Text style={st.avatarText}>{person.initial}</Text>
                </View>
                <View style={st.personInfo}>
                  <Text style={st.personName}>{person.name}</Text>
                  <Text style={st.personMeta}>
                    {person.sunSign ? `${ZODIAC_SYMBOLS[person.sunSign]} ${person.sunSign}` : "Tap to read"}
                    {person.relationship ? ` · ${person.relationship}` : ""}
                  </Text>
                  <View style={st.blendedRow}>
                    <View style={st.blendedBadge}><Text style={st.blendedBadgeText}>☉</Text></View>
                    <View style={st.blendedBadge}><Hash size={8} color={SolunaColors.creamSubtle} /></View>
                    <View style={st.blendedBadge}><Bird size={8} color={SolunaColors.creamSubtle} /></View>
                    <Text style={st.blendedLabel}>blended</Text>
                  </View>
                </View>
              </View>
              <View style={st.personRight}>
                {person.score != null && <ScoreRing score={person.score} />}
                <ChevronRight size={16} color={SolunaColors.creamSubtle} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {connections.length === 0 && bonds.length === 0 && (
          <View style={st.emptyHint}>
            <UserPlus size={20} color={SolunaColors.creamSubtle} />
            <Text style={st.emptyText}>
              Invite a partner for a daily Bond, or add friends and family to see how your systems
              interact — every connection framed with warmth and growth in mind.
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function AddPersonForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, date: string) => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  return (
    <View style={fS.wrap}>
      <Text style={fS.title}>Add Someone</Text>
      <TextInput style={fS.input} value={name} onChangeText={setName} placeholder="Their name" placeholderTextColor={SolunaColors.creamSubtle} />
      <TextInput style={fS.input} value={date} onChangeText={setDate} placeholder="Birth date (e.g. 1993-07-05)" placeholderTextColor={SolunaColors.creamSubtle} />
      <Text style={fS.hint}>Just a name and birth date to get started. More details unlock deeper compatibility.</Text>
      <View style={fS.buttons}>
        <TouchableOpacity style={fS.cancelBtn} onPress={onClose}><Text style={fS.cancelText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={[fS.addBtn, !name && fS.addBtnDisabled]} onPress={() => name && onSubmit(name, date)} disabled={!name}>
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

const st = StyleSheet.create({
  gradient: { flex: 1 }, scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 16, lineHeight: 20 },
  lensRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: SolunaRadius.md, padding: 4, marginBottom: 16 },
  lensTab: { flex: 1, paddingVertical: 8, borderRadius: SolunaRadius.sm, alignItems: "center" },
  lensTabActive: { backgroundColor: "rgba(232,184,109,0.1)", borderWidth: 1, borderColor: "rgba(232,184,109,0.2)" },
  lensText: { fontSize: 11, fontWeight: "600", color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  lensTextActive: { color: SolunaColors.warmGold },
  inviteCard: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginBottom: 20 },
  inviteInner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)", borderRadius: SolunaRadius.lg },
  inviteTitle: { fontSize: 15, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body, marginBottom: 2 },
  inviteSub: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 17 },
  sectionTitle: { fontSize: 12, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 10, marginTop: 4 },
  addRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(232,184,109,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  addChipText: { fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  peopleWrap: { gap: 10, marginBottom: 8 },
  personCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder },
  personLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.heading },
  personInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 3 },
  personMeta: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 4 },
  blendedRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  blendedBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  blendedBadgeText: { fontSize: 8, color: SolunaColors.creamMuted },
  blendedLabel: { fontSize: 9, color: SolunaColors.creamSubtle, fontWeight: "600" },
  personRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyHint: { alignItems: "center", gap: 10, marginTop: 32, paddingHorizontal: 20 },
  emptyText: { fontSize: 13, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 20, fontFamily: Fonts.body },
});
