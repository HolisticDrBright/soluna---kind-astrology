import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { ZODIAC_SYMBOLS, Fonts, type RelationshipLens, type BondRitualData } from "@/constants/mockData";
import { CONNECTIONS, MOCK_BOND_RITUALS } from "@/constants/demoData";
import EmptyState from "@/components/EmptyState";
import ConfidencePill from "@/components/ConfidencePill";
import { Heart, Plus, ChevronRight, Sparkles, Share2, Shield, Star, Briefcase, HeartHandshake, Baby, BookOpen, Calendar, AlertTriangle, Target } from "lucide-react-native";
import { LoadingState, ErrorState } from "@/components/DataStates";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getConnections, addConnection, getCompatibility } from "@/lib/api";
import { isDemoMode } from "@/lib/runtimeMode";

const USE_MOCK_DATA = isDemoMode;

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const parseBirthDate = (text: string): string | null => {
  const t = text.trim();
  if (!t) return null;
  const d = new Date(t);
  if (isNaN(d.getTime()) || d.getFullYear() < 1900 || d.getFullYear() > new Date().getFullYear()) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const formatBirth = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

// ─── Lens config ───────────────────────────────────────────
const LENSES: { key: RelationshipLens; label: string; icon: typeof Heart; color: string }[] = [
  { key: "Romance", label: "Romance", icon: Heart, color: SolunaColors.softPeach },
  { key: "Friendship", label: "Friends", icon: Star, color: SolunaColors.warmGold },
  { key: "Work", label: "Work", icon: Briefcase, color: SolunaColors.gentleLavender },
  { key: "Family", label: "Family", icon: Baby, color: "#7BC89C" },
];

// ─── Mini Score Ring ───────────────────────────────────────
function MiniScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? SolunaColors.warmGold : score >= 60 ? SolunaColors.gentleLavender : SolunaColors.softPeach;
  return (
    <View style={mrS.ring}>
      <Text style={[mrS.score, { color }]}>{score}%</Text>
      <Text style={mrS.label}>{score >= 80 ? "Harmonious" : score >= 60 ? "Complementary" : "Growth"}</Text>
    </View>
  );
}
const mrS = StyleSheet.create({ ring: { alignItems: "center", gap: 2 }, score: { fontSize: 16, fontWeight: "700", fontFamily: Fonts.body }, label: { fontSize: 9, color: SolunaColors.creamMuted, fontWeight: "600" } });

// ─── Add Person Form ───────────────────────────────────────
function AddPersonForm({ onClose, onAdded, defaultLens }: { onClose: () => void; onAdded: () => void; defaultLens: string }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    const n = name.trim();
    if (!n) { setErr("Add their name."); return; }
    const iso = parseBirthDate(date);
    if (!iso) { setErr("Add a valid birth date, like July 5, 1993."); return; }
    if (USE_MOCK_DATA) { onClose(); return; }
    setSaving(true);
    setErr("");
    const { error } = await addConnection({ name: n, birth_date: iso, lens: defaultLens });
    setSaving(false);
    if (error) { setErr(error); return; }
    onAdded();
  };

  return (
    <View style={fS.wrap}>
      <Text style={fS.title}>Add Someone to Your Circle</Text>
      <TextInput style={fS.input} value={name} onChangeText={setName} placeholder="Their full name" placeholderTextColor={SolunaColors.creamSubtle} />
      <TextInput style={fS.input} value={date} onChangeText={setDate} placeholder="Birth date (e.g. July 5, 1993)" placeholderTextColor={SolunaColors.creamSubtle} />
      <Text style={fS.hint}>Just a name and birth date to get started. More details unlock deeper compatibility.</Text>
      {err ? <Text style={fS.err}>{err}</Text> : null}
      <View style={fS.buttons}>
        <TouchableOpacity style={fS.cancelBtn} onPress={onClose} disabled={saving}><Text style={fS.cancelText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={[fS.addBtn, (!name.trim() || saving) && fS.addBtnDisabled]} onPress={submit} disabled={!name.trim() || saving}>
          {saving ? <ActivityIndicator color={SolunaColors.warmGold} /> : <Text style={[fS.addText, !name.trim() && { color: SolunaColors.creamSubtle }]}>Add to Circle</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Live connection card (real list + on-demand compatibility) ──
function LiveConnectionCard({ conn, lens }: { conn: { id: string; name: string; birth_date: string; lens: string }; lens: string }) {
  const [open, setOpen] = useState(false);
  // Fetch the report once on first expand, then keep it cached so collapsing and
  // re-opening the card is instant and doesn't re-hit the network. A change to
  // conn.id or lens still triggers a fresh fetch via the deps array.
  const [hasOpened, setHasOpened] = useState(false);
  const compat = useAsyncData(() => getCompatibility(conn.id, lens), [conn.id, lens], { enabled: hasOpened });
  const report = compat.data;

  return (
    <TouchableOpacity style={pcS.card} onPress={() => { setHasOpened(true); setOpen((o) => !o); }} activeOpacity={0.7}>
      <View style={pcS.top}>
        <View style={pcS.left}>
          <View style={pcS.avatar}><Text style={pcS.avatarText}>{(conn.name[0] ?? "?").toUpperCase()}</Text></View>
          <View style={pcS.info}>
            <Text style={pcS.name}>{conn.name}</Text>
            <Text style={pcS.meta}>Born {formatBirth(conn.birth_date)} · {capitalize(conn.lens)}</Text>
          </View>
        </View>
        <ChevronRight size={16} color={SolunaColors.creamSubtle} style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }} />
      </View>

      {open && (
        <View style={pcS.expanded}>
          {compat.loading ? (
            <LoadingState message="Reading your compatibility…" />
          ) : compat.error ? (
            <ErrorState message={compat.error} onRetry={compat.refetch} retrying={compat.reloading} />
          ) : report ? (
            <>
              <View style={pcS.scoresRow}>
                <View style={pcS.scoreCell}>
                  <Text style={pcS.scoreVal}>{report.score}%</Text>
                  <Text style={pcS.scoreSrc}>{report.label}</Text>
                </View>
              </View>
              {report.whereYouFlow?.length ? (
                <View style={pcS.section}>
                  <Text style={pcS.sectionLabel}>Where you flow</Text>
                  {report.whereYouFlow.map((t, i) => <Text key={i} style={pcS.sectionText}>{t}</Text>)}
                </View>
              ) : null}
              {report.whereYouGrow?.length ? (
                <View style={pcS.section}>
                  <Text style={pcS.sectionLabel}>Where you grow</Text>
                  {report.whereYouGrow.map((t, i) => <Text key={i} style={pcS.sectionText}>{t}</Text>)}
                </View>
              ) : null}
              {report.howToSupport?.length ? (
                <View style={pcS.section}>
                  <Text style={pcS.sectionLabel}>How to support each other</Text>
                  {report.howToSupport.map((t, i) => (
                    <View key={i} style={pcS.tipRow}><Sparkles size={10} color={SolunaColors.warmGold} /><Text style={pcS.tipText}>{t}</Text></View>
                  ))}
                </View>
              ) : null}
              {(report.astrologyNote || report.numerologyNote || report.baziNote) ? (
                <View style={pcS.section}>
                  <Text style={pcS.sectionLabel}>The lens</Text>
                  {report.astrologyNote ? <Text style={pcS.sectionText}>{report.astrologyNote}</Text> : null}
                  {report.numerologyNote ? <Text style={[pcS.sectionText, { marginTop: 4 }]}>{report.numerologyNote}</Text> : null}
                  {report.baziNote ? <Text style={[pcS.sectionText, { marginTop: 4 }]}>{report.baziNote}</Text> : null}
                </View>
              ) : null}
              {report.confidenceNote ? (
                <Text style={[pcS.sectionText, { fontStyle: "italic", color: SolunaColors.creamSubtle, marginTop: 2 }]}>
                  {report.confidenceNote}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}
const fS = StyleSheet.create({
  wrap: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 16 },
  title: { fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 16 },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: SolunaColors.cream, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", fontFamily: Fonts.body, marginBottom: 12 },
  hint: { fontSize: 12, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, fontStyle: "italic", marginBottom: 16, lineHeight: 18 },
  err: { fontSize: 12, color: SolunaColors.softPeach, fontFamily: Fonts.body, marginBottom: 12 },
  buttons: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: SolunaRadius.md, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
  cancelText: { fontSize: 14, color: SolunaColors.creamMuted, fontWeight: "600", fontFamily: Fonts.body },
  addBtn: { flex: 1, paddingVertical: 14, borderRadius: SolunaRadius.md, backgroundColor: "rgba(232,184,109,0.15)", alignItems: "center", borderWidth: 1, borderColor: "rgba(232,184,109,0.2)" },
  addBtnDisabled: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" },
  addText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});

// ─── Bond Ritual Section ──────────────────────────────────
function BondRitualSection({ ritual, partnerName }: { ritual: BondRitualData; partnerName: string }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggle = (key: string) => setExpandedSection((prev) => (prev === key ? null : key));

  return (
    <View style={brS.wrap}>
      <View style={brS.header}>
        <Sparkles size={14} color={SolunaColors.warmGold} />
        <Text style={brS.headerTitle}>Bond Rituals</Text>
      </View>

      {/* How to support today */}
      <TouchableOpacity style={brS.item} onPress={() => toggle("support")} activeOpacity={0.7}>
        <View style={brS.itemRow}>
          <View style={[brS.itemIcon, { backgroundColor: "rgba(232,184,109,0.1)" }]}>
            <Heart size={13} color={SolunaColors.warmGold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[brS.itemLabel, expandedSection === "support" ? { marginBottom: 6 } : null]}>How to support {partnerName} today</Text>
            {expandedSection === "support" && (
              <Text style={brS.itemText}>{ritual.howToSupportToday}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Best day for deep conversation */}
      <TouchableOpacity style={brS.item} onPress={() => toggle("bestDay")} activeOpacity={0.7}>
        <View style={brS.itemRow}>
          <View style={[brS.itemIcon, { backgroundColor: "rgba(185,163,227,0.1)" }]}>
            <Calendar size={13} color={SolunaColors.gentleLavender} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[brS.itemLabel, { color: SolunaColors.gentleLavender }, expandedSection === "bestDay" ? { marginBottom: 6 } : null]}>Best day this week for a deeper conversation</Text>
            {expandedSection === "bestDay" && (
              <Text style={brS.itemText}>{ritual.bestDayForDeepConversation}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Where you may be misreading */}
      <TouchableOpacity style={brS.item} onPress={() => toggle("misread")} activeOpacity={0.7}>
        <View style={brS.itemRow}>
          <View style={[brS.itemIcon, { backgroundColor: "rgba(242,168,141,0.1)" }]}>
            <AlertTriangle size={13} color={SolunaColors.softPeach} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[brS.itemLabel, { color: SolunaColors.softPeach }, expandedSection === "misread" ? { marginBottom: 6 } : null]}>Where you may be misreading each other</Text>
            {expandedSection === "misread" && (
              <Text style={brS.itemText}>{ritual.whereYouMayBeMisreading}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Shared journal prompt */}
      <TouchableOpacity style={[brS.item, { borderBottomWidth: 0 }]} onPress={() => toggle("journal")} activeOpacity={0.7}>
        <View style={brS.itemRow}>
          <View style={[brS.itemIcon, { backgroundColor: "rgba(123,200,156,0.1)" }]}>
            <BookOpen size={13} color="#7BC89C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[brS.itemLabel, { color: "#7BC89C" }, expandedSection === "journal" ? { marginBottom: 6 } : null]}>Shared journal prompt</Text>
            {expandedSection === "journal" && (
              <Text style={brS.itemText}>{ritual.sharedJournalPrompt}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
const brS = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(185,163,227,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(185,163,227,0.1)",
    marginBottom: 10,
    marginTop: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  itemRow: {
    flexDirection: "row",
    gap: 10,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  itemText: {
    fontSize: 12,
    color: SolunaColors.creamMuted,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});

function ConnectionsContent() {
  const { user } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeLens, setActiveLens] = useState<RelationshipLens>("Romance");
  const [tapState, setTapState] = useState<Record<string, boolean>>({});
  const connQuery = useAsyncData(() => getConnections(), [], { enabled: !USE_MOCK_DATA });
  const liveConnections = connQuery.data?.connections ?? [];
  if (!user) return null;

  const toggleTap = (id: string) => setTapState((prev) => ({ ...prev, [id]: !prev[id] }));

  const getLensTip = (person: (typeof CONNECTIONS)[number], lens: RelationshipLens): string => {
    switch (lens) {
      case "Romance": return person.romanceTip;
      case "Friendship": return person.friendshipTip;
      case "Work": return person.workTip;
      case "Family": return person.familyTip;
    }
  };

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Connections</Text>
        <Text style={st.sub}>See how you connect through astrology, numerology, and Chinese signs — framed with warmth, not judgment.</Text>

        {/* ── Hero: Linked Bonds ── */}
        <TouchableOpacity style={st.inviteHero} activeOpacity={0.8}>
          <LinearGradient colors={["rgba(232,184,109,0.1)", "rgba(242,168,141,0.04)"]} style={st.inviteHeroInner}>
            <View style={st.inviteHeroIcon}><Share2 size={24} color={SolunaColors.warmGold} /></View>
            <Text style={st.inviteHeroTitle}>Invite someone to create a Bond</Text>
            <Text style={st.inviteHeroDesc}>Linked partners get daily shared readings, Bond Rituals, and cross-system compatibility insight — free for both of you. You choose what you share. Unlink anytime.</Text>
            <View style={st.inviteHeroCta}><Sparkles size={14} color={SolunaColors.warmGold} /><Text style={st.inviteHeroCtaText}>Send an invite</Text></View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Your Bonds ── */}
        <View style={st.sectionHeader}><Heart size={16} color={SolunaColors.softPeach} fill={SolunaColors.softPeach} /><Text style={st.sectionTitle}>Linked Bonds</Text></View>
        <EmptyState icon={Heart} title="No Bonds yet" description="Bonds are linked partners who get daily shared readings and Bond Rituals with you. Invite someone special — it's free for both of you." actionLabel="Invite someone" onAction={() => {}} />

        {/* ── Lens Switcher ── */}
        <View style={st.sectionHeader}>
          <HeartHandshake size={16} color={SolunaColors.gentleLavender} />
          <Text style={st.sectionTitle}>Your Circle</Text>
        </View>
        <View style={st.lensWrap}>
          {LENSES.map((lens) => {
            const isActive = activeLens === lens.key;
            return (
              <TouchableOpacity key={lens.key} style={[st.lensTab, isActive && st.lensTabActive]} onPress={() => setActiveLens(lens.key)}>
                <lens.icon size={13} color={isActive ? lens.color : SolunaColors.creamSubtle} />
                <Text style={[st.lensText, isActive && { color: lens.color, fontWeight: "700" }]}>{lens.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Add button ── */}
        {!showAddForm ? (
          <TouchableOpacity style={st.addButton} onPress={() => setShowAddForm(true)} activeOpacity={0.8}>
            <Plus size={20} color={SolunaColors.warmGold} /><Text style={st.addButtonText}>Add someone</Text>
          </TouchableOpacity>
        ) : (
          <AddPersonForm
            onClose={() => setShowAddForm(false)}
            onAdded={() => { setShowAddForm(false); connQuery.refetch(); }}
            defaultLens={activeLens.toLowerCase()}
          />
        )}

        {/* ── Person Cards (demo only) ── */}
        {USE_MOCK_DATA && CONNECTIONS.map((person) => {
          const isOpen = tapState[person.id] ?? false;
          const lensActive = LENSES.find((l) => l.key === activeLens)!;
          const ritual = MOCK_BOND_RITUALS[person.id];

          return (
            <TouchableOpacity key={person.id} style={pcS.card} onPress={() => toggleTap(person.id)} activeOpacity={0.7}>
              <View style={pcS.top}>
                <View style={pcS.left}>
                  <View style={pcS.avatar}><Text style={pcS.avatarText}>{person.avatarInitial}</Text></View>
                  <View style={pcS.info}>
                    <Text style={pcS.name}>{person.name}</Text>
                    <Text style={pcS.meta}>{ZODIAC_SYMBOLS[person.sunSign]} {person.sunSign} · {person.relationship}</Text>
                  </View>
                </View>
                <View style={pcS.right}>
                  <MiniScoreRing score={person.compatibilityScore} />
                  <ChevronRight size={16} color={SolunaColors.creamSubtle} style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }} />
                </View>
              </View>

              {isOpen && (
                <View style={pcS.expanded}>
                  {/* Lens-specific tip */}
                  <View style={pcS.lensCard}>
                    <View style={pcS.lensChip}>
                      <lensActive.icon size={12} color={lensActive.color} />
                      <Text style={[pcS.lensChipText, { color: lensActive.color }]}>{lensActive.label}</Text>
                    </View>
                    <Text style={pcS.lensTip}>{getLensTip(person, activeLens)}</Text>
                  </View>

                  {/* Where you flow */}
                  <View style={pcS.section}>
                    <Text style={pcS.sectionLabel}>Where you flow</Text>
                    <Text style={pcS.sectionText}>{person.whereYouFlow}</Text>
                  </View>

                  {/* Where you grow */}
                  <View style={pcS.section}>
                    <Text style={pcS.sectionLabel}>Where you grow</Text>
                    <Text style={pcS.sectionText}>{person.whereYouGrow}</Text>
                  </View>

                  {/* How to support */}
                  <View style={pcS.section}>
                    <Text style={pcS.sectionLabel}>How to support each other</Text>
                    {person.howToLove.map((tip, i) => (
                      <View key={i} style={pcS.tipRow}><Sparkles size={10} color={SolunaColors.warmGold} /><Text style={pcS.tipText}>{tip}</Text></View>
                    ))}
                  </View>

                  {/* Bond Rituals */}
                  {ritual && <BondRitualSection ritual={ritual} partnerName={person.name} />}

                  {/* Cross-system scores */}
                  <View style={pcS.scoresRow}>
                    <View style={pcS.scoreCell}><Text style={pcS.scoreVal}>{person.compatibilityScore}%</Text><Text style={pcS.scoreSrc}>Astrology</Text></View>
                    <View style={pcS.scoreCell}><Text style={pcS.scoreVal}>{person.numerologyScore}%</Text><Text style={pcS.scoreSrc}>Numerology</Text></View>
                    <View style={pcS.scoreCell}><Text style={pcS.scoreVal}>{person.chineseScore}%</Text><Text style={pcS.scoreSrc}>Chinese</Text></View>
                  </View>

                  {/* Confidence */}
                  <View style={pcS.confWrap}><ConfidencePill level="approximate" /></View>

                  {/* Deep link */}
                  <TouchableOpacity style={pcS.fullBtn} onPress={() => router.push({ pathname: "/compatibility-detail", params: { id: person.id } })}>
                    <Text style={pcS.fullBtnText}>Full Compatibility Report</Text><ChevronRight size={14} color={SolunaColors.warmGold} />
                  </TouchableOpacity>

                  {/* Focus on this relationship */}
                  <TouchableOpacity
                    style={pcS.focusBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/focus/setup",
                        params: {
                          preselectedCategory: "Relationship",
                          preselectedBondId: person.id,
                          preselectedBondName: person.name,
                        },
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Target size={14} color={SolunaColors.gentleLavender} />
                    <Text style={pcS.focusBtnText}>Focus on this relationship</Text>
                    <ChevronRight size={14} color={SolunaColors.gentleLavender} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* ── Your Circle (real data) ── */}
        {!USE_MOCK_DATA && (
          connQuery.loading ? (
            <LoadingState message="Loading your circle…" />
          ) : connQuery.error ? (
            <ErrorState message={connQuery.error} onRetry={connQuery.refetch} retrying={connQuery.reloading} />
          ) : liveConnections.length === 0 ? (
            <EmptyState icon={HeartHandshake} title="No one in your circle yet" description="Add someone with their name and birth date to explore how you connect across systems." />
          ) : (
            liveConnections.map((c) => (
              <LiveConnectionCard key={c.id} conn={c} lens={activeLens.toLowerCase()} />
            ))
          )
        )}

        {/* ── Privacy ── */}
        <View style={st.privacyCard}>
          <Shield size={18} color={SolunaColors.warmGold} />
          <Text style={st.privacyText}>
            You choose what you share. Unlink anytime — no guilt, no retention tactics. We never share real names or birth details without mutual consent. Compatibility is always framed positively — even challenging aspects are growth edges.
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

export default function ConnectionsScreen() { return <ConnectionsContent />; }

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
  inviteHeroDesc: { fontSize: 13, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 20, marginBottom: 14, maxWidth: 280, fontFamily: Fonts.body },
  inviteHeroCta: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.15)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.25)" },
  inviteHeroCtaText: { fontSize: 14, color: SolunaColors.warmGold, fontWeight: "700", fontFamily: Fonts.body },
  // Sections
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  // Lens Switcher
  lensWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: SolunaRadius.md, padding: 4, marginBottom: 14 },
  lensTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: SolunaRadius.sm, borderWidth: 1, borderColor: "transparent" },
  lensTabActive: { backgroundColor: "rgba(232,184,109,0.08)", borderColor: "rgba(232,184,109,0.15)" },
  lensText: { fontSize: 11, fontWeight: "600", color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  // Add
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.lg, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.12)", borderStyle: "dashed", marginBottom: 16 },
  addButtonText: { fontSize: 15, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  // Privacy
  privacyCard: { flexDirection: "row", gap: 12, backgroundColor: "rgba(232,184,109,0.05)", borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginTop: 20, marginBottom: 10, alignItems: "flex-start" },
  privacyText: { flex: 1, fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
});

// ─── Person Card ───────────────────────────────────────────
const pcS = StyleSheet.create({
  card: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(232,184,109,0.1)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.heading },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 2 },
  meta: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  // Expanded
  expanded: { marginTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 14 },
  lensCard: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, marginBottom: 10 },
  lensChip: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  lensChipText: { fontSize: 11, fontWeight: "700", fontFamily: Fonts.body },
  lensTip: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
  section: { marginBottom: 10 },
  sectionLabel: { fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 4 },
  sectionText: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
  tipRow: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginBottom: 5 },
  tipText: { flex: 1, fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 17, fontFamily: Fonts.body },
  scoresRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 10 },
  scoreCell: { alignItems: "center" },
  scoreVal: { fontSize: 16, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.heading },
  scoreSrc: { fontSize: 9, color: SolunaColors.creamSubtle, marginTop: 2, textTransform: "uppercase" },
  confWrap: { marginBottom: 8 },
  fullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.08)", paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  fullBtnText: { fontSize: 13, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  focusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(185,163,227,0.06)",
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(185,163,227,0.12)",
    marginTop: 8,
  },
  focusBtnText: { fontSize: 13, color: SolunaColors.gentleLavender, fontWeight: "600", fontFamily: Fonts.body },
});
