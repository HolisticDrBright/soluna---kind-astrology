import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { ZODIAC_SYMBOLS, CHINESE_ANIMAL_EMOJI, MOCK_PATTERN_THEMES, MOCK_WEEKLY_REPORT, WIDGET_PREVIEWS, MOCK_ACTIVE_FOCUSES, Fonts, type PatternTheme, type WeeklyReport, type WidgetPreview } from "@/constants/mockData";
import { getBlueprintSummary } from "@/constants/mockData";
import { Sun, Moon, Star, Bell, Clock, Lock, ChevronRight, Sparkles, Crown, LogOut, Shield, CircleHelp, Hash, Heart, Brain, Plus, X, Pencil, Trash2, BookOpen, Calendar, BellRing, Target } from "lucide-react-native";

// ─── Setting Row / Toggle ───────────────────────────────
function SettingRow({ icon, label, value, onPress, isLast }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; isLast?: boolean }) {
  return (
    <TouchableOpacity style={[rS.row, !isLast && rS.border]} onPress={onPress} activeOpacity={0.6}>
      <View style={rS.icon}>{icon}</View>
      <Text style={rS.label}>{label}</Text>
      <View style={rS.right}>{value && <Text style={rS.value}>{value}</Text>}{onPress && <ChevronRight size={16} color={SolunaColors.creamSubtle} />}</View>
    </TouchableOpacity>
  );
}
function SettingToggle({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[rS.row, rS.border]}>
      <View style={rS.icon}>{icon}</View>
      <Text style={rS.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(232,184,109,0.3)" }} thumbColor={value ? SolunaColors.warmGold : SolunaColors.creamSubtle} />
    </View>
  );
}
const rS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14, paddingHorizontal: 4 },
  border: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 15, color: SolunaColors.cream, fontFamily: Fonts.body },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
  value: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
});

// ─── System Chip ─────────────────────────────────────────
function SystemChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={cS.wrap}>
      <Text style={[cS.value, { color }]}>{value}</Text>
      <Text style={cS.label}>{label}</Text>
    </View>
  );
}
const cS = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", minWidth: 60 },
  value: { fontSize: 14, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 2 },
  label: { fontSize: 9, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "600", fontFamily: Fonts.body },
});

// ─── Premium Banner ──────────────────────────────────────
function PremiumBanner() {
  return (
    <TouchableOpacity style={pS.wrap} onPress={() => router.push("/paywall")} activeOpacity={0.8}>
      <LinearGradient colors={["rgba(232,184,109,0.12)", "rgba(242,168,141,0.06)"]} style={pS.inner}>
        <View style={pS.topRow}>
          <Crown size={20} color={SolunaColors.warmGold} />
          <View style={pS.premBadge}><Text style={pS.premBadgeText}>SOLUNA PREMIUM</Text></View>
        </View>
        <Text style={pS.title}>Unlock your full Blueprint</Text>
        <Text style={pS.body}>All four lenses fully unlocked, unlimited Ask Soluna, cross-system reports, full compatibility, and more.</Text>
        <View style={pS.cta}><Text style={pS.ctaText}>Go Premium</Text><ChevronRight size={16} color={SolunaColors.deepIndigo} /></View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const pS = StyleSheet.create({
  wrap: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginBottom: 24 },
  inner: { padding: 20, borderRadius: SolunaRadius.lg, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  premBadge: { backgroundColor: "rgba(232,184,109,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  premBadgeText: { fontSize: 9, fontWeight: "800", color: SolunaColors.warmGold, letterSpacing: 1.5, fontFamily: Fonts.body },
  title: { fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 8 },
  body: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 20, marginBottom: 16, fontFamily: Fonts.body },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: SolunaColors.warmGold, paddingVertical: 12, borderRadius: SolunaRadius.md },
  ctaText: { fontSize: 15, fontWeight: "700", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
});

// ─── Pattern Memory Section ──────────────────────────────
function PatternMemorySection() {
  const [themes, setThemes] = useState<PatternTheme[]>(MOCK_PATTERN_THEMES.map(t => ({ ...t })));
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const toggleActive = useCallback((id: string) => {
    setThemes(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  }, []);

  const startEdit = useCallback((theme: PatternTheme) => {
    setEditingId(theme.id);
    setEditLabel(theme.label);
  }, []);

  const saveEdit = useCallback(() => {
    if (editLabel.trim()) {
      setThemes(prev => prev.map(t => t.id === editingId ? { ...t, label: editLabel.trim() } : t));
    }
    setEditingId(null);
    setEditLabel("");
  }, [editLabel, editingId]);

  const deleteTheme = useCallback((id: string) => {
    setThemes(prev => prev.filter(t => t.id !== id));
  }, []);

  const addTheme = useCallback(() => {
    if (newLabel.trim()) {
      const newTheme: PatternTheme = {
        id: `t${Date.now()}`,
        label: newLabel.trim(),
        active: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setThemes(prev => [...prev, newTheme]);
      setNewLabel("");
      setIsAdding(false);
    }
  }, [newLabel]);

  return (
    <View style={pmS.wrap}>
      <View style={pmS.header}>
        <View style={pmS.headerLeft}>
          <Brain size={16} color={SolunaColors.gentleLavender} />
          <Text style={pmS.headerTitle}>What Soluna remembers</Text>
        </View>
        <TouchableOpacity onPress={() => setIsAdding(true)} activeOpacity={0.7}>
          <Plus size={18} color={SolunaColors.warmGold} />
        </TouchableOpacity>
      </View>
      <Text style={pmS.description}>
        You choose what Soluna remembers — these themes help personalize your readings without ever feeling invasive. Toggle off anything you'd rather keep private.
      </Text>

      {themes.map((theme) => (
        <View key={theme.id} style={pmS.themeRow}>
          {editingId === theme.id ? (
            <View style={pmS.editWrap}>
              <TextInput
                style={pmS.editInput}
                value={editLabel}
                onChangeText={setEditLabel}
                onSubmitEditing={saveEdit}
                autoFocus
              />
              <TouchableOpacity onPress={saveEdit}>
                <Text style={pmS.saveBtn}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[pmS.dot, { backgroundColor: theme.active ? "#7BC89C" : SolunaColors.creamSubtle }]} />
              <Text style={[pmS.themeLabel, !theme.active && pmS.themeInactive]}>{theme.label}</Text>
              <View style={pmS.themeActions}>
                <TouchableOpacity onPress={() => toggleActive(theme.id)} style={pmS.toggleBtn}>
                  <Text style={pmS.toggleText}>{theme.active ? "ON" : "OFF"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => startEdit(theme)} style={pmS.iconBtn}>
                  <Pencil size={13} color={SolunaColors.creamSubtle} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTheme(theme.id)} style={pmS.iconBtn}>
                  <Trash2 size={13} color={SolunaColors.creamSubtle} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}

      {isAdding && (
        <View style={pmS.addWrap}>
          <TextInput
            style={pmS.addInput}
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="e.g. Exploring a move, working on sleep…"
            placeholderTextColor={SolunaColors.creamSubtle}
            onSubmitEditing={addTheme}
            autoFocus
          />
          <View style={pmS.addActions}>
            <TouchableOpacity onPress={() => setIsAdding(false)}>
              <Text style={pmS.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addTheme} disabled={!newLabel.trim()}>
              <Text style={[pmS.addText, !newLabel.trim() && { color: SolunaColors.creamSubtle }]}>Add theme</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {themes.length === 0 && !isAdding && (
        <Text style={pmS.emptyText}>No remembered themes yet. Add one to help Soluna personalize your readings.</Text>
      )}
    </View>
  );
}
const pmS = StyleSheet.create({
  wrap: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 14, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  description: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 17, marginBottom: 14, fontStyle: "italic" },
  themeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  themeLabel: { flex: 1, fontSize: 14, color: SolunaColors.cream, fontFamily: Fonts.body },
  themeInactive: { color: SolunaColors.creamSubtle, textDecorationLine: "line-through" },
  themeActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleBtn: { backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  toggleText: { fontSize: 9, fontWeight: "700", color: SolunaColors.creamSubtle },
  iconBtn: { padding: 4 },
  editWrap: { flexDirection: "row", alignItems: "center", flex: 1, gap: 8 },
  editInput: { flex: 1, fontSize: 14, color: SolunaColors.cream, fontFamily: Fonts.body, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  saveBtn: { fontSize: 13, fontWeight: "600", color: SolunaColors.warmGold, fontFamily: Fonts.body },
  addWrap: { marginTop: 10, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12 },
  addInput: { fontSize: 14, color: SolunaColors.cream, fontFamily: Fonts.body, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 8 },
  addActions: { flexDirection: "row", justifyContent: "flex-end", gap: 14 },
  cancelText: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  addText: { fontSize: 13, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body },
  emptyText: { fontSize: 13, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, textAlign: "center", paddingVertical: 10, fontStyle: "italic" },
});

// ─── Weekly Report Card ──────────────────────────────────
function WeeklyReportCard({ report }: { report: WeeklyReport }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={wrS.wrap} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={wrS.header}>
        <View style={wrS.headerLeft}>
          <Calendar size={16} color={SolunaColors.warmGold} />
          <Text style={wrS.title}>This Week in Your Patterns</Text>
        </View>
        <Text style={wrS.dateRange}>
          {report.startDate} – {report.endDate}
        </Text>
      </View>

      <Text style={wrS.moodPattern}>{report.moodPattern}</Text>

      {/* Stats row */}
      <View style={wrS.statsRow}>
        <View style={wrS.stat}>
          <Text style={wrS.statNum}>{report.repeatingThemes.length}</Text>
          <Text style={wrS.statLabel}>Repeating themes</Text>
        </View>
        <View style={wrS.stat}>
          <Text style={wrS.statNum}>{report.savedReadings}</Text>
          <Text style={wrS.statLabel}>Saved readings</Text>
        </View>
        <View style={wrS.stat}>
          <Text style={wrS.statNum}>{report.journalReflections}</Text>
          <Text style={wrS.statLabel}>Journal entries</Text>
        </View>
      </View>

      {expanded && (
        <View style={wrS.expanded}>
          {/* Repeating themes */}
          <Text style={wrS.sectionLabel}>Repeating Themes</Text>
          {report.repeatingThemes.map((theme, i) => (
            <View key={i} style={wrS.themeRow}>
              <Sparkles size={10} color={SolunaColors.warmGold} />
              <Text style={wrS.themeText}>{theme}</Text>
            </View>
          ))}

          {/* Systems that agreed most */}
          <Text style={wrS.sectionLabel}>Systems That Agreed Most Often</Text>
          <View style={wrS.systemsRow}>
            {report.systemsAgreedMost.map((s, i) => (
              <View key={i} style={wrS.systemChip}>
                <Text style={wrS.systemChipText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Carry forward */}
          <View style={wrS.carryWrap}>
            <BookOpen size={14} color={SolunaColors.gentleLavender} />
            <Text style={wrS.carryLabel}>One thing to carry into next week</Text>
          </View>
          <Text style={wrS.carryText}>{report.carryForward}</Text>
        </View>
      )}

      <Text style={wrS.expandHint}>{expanded ? "Tap to collapse" : "Tap to see full report"}</Text>
    </TouchableOpacity>
  );
}
const wrS = StyleSheet.create({
  wrap: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 20 },
  header: { marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { fontSize: 15, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  dateRange: { fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body },
  moodPattern: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 17, marginBottom: 10, fontStyle: "italic" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 10, marginBottom: 8 },
  stat: { alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.heading },
  statLabel: { fontSize: 10, color: SolunaColors.creamSubtle, fontWeight: "600", marginTop: 2 },
  expanded: { marginTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12 },
  sectionLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 8, marginTop: 8 },
  themeRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 8 },
  themeText: { flex: 1, fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 18, fontFamily: Fonts.body },
  systemsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  systemChip: { backgroundColor: "rgba(185,163,227,0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: "rgba(185,163,227,0.15)" },
  systemChipText: { fontSize: 10, fontWeight: "600", color: SolunaColors.gentleLavender, fontFamily: Fonts.body },
  carryWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, marginTop: 4 },
  carryLabel: { fontSize: 12, fontWeight: "700", color: SolunaColors.gentleLavender, fontFamily: Fonts.body },
  carryText: { fontSize: 13, color: SolunaColors.cream, lineHeight: 20, fontFamily: Fonts.body },
  expandHint: { fontSize: 11, color: SolunaColors.warmGold, fontFamily: Fonts.body, textAlign: "center", marginTop: 8, fontWeight: "600" },
});

// ─── Widget Preview Cards ────────────────────────────────
function WidgetPreviewCard({ widget }: { widget: WidgetPreview }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={wpS.wrap} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={wpS.top}>
        <Text style={wpS.emoji}>{widget.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={wpS.title}>{widget.title}</Text>
          <Text style={wpS.desc} numberOfLines={expanded ? undefined : 2}>{widget.description}</Text>
        </View>
        <ChevronRight size={14} color={SolunaColors.creamSubtle} style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }} />
      </View>
      {expanded && (
        <View style={wpS.expanded}>
          <View style={wpS.notifyPreview}>
            <BellRing size={12} color={SolunaColors.warmGold} />
            <Text style={wpS.notifyLabel}>Example notification:</Text>
          </View>
          <Text style={wpS.notifyText}>"{widget.notificationExample}"</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const wpS = StyleSheet.create({
  wrap: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.sm, padding: 14, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 8 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  emoji: { fontSize: 22, width: 32, textAlign: "center" },
  title: { fontSize: 14, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 3 },
  desc: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 17, fontFamily: Fonts.body },
  expanded: { marginTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", paddingTop: 10 },
  notifyPreview: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  notifyLabel: { fontSize: 11, fontWeight: "600", color: SolunaColors.creamSubtle, fontFamily: Fonts.body },
  notifyText: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body, fontStyle: "italic", lineHeight: 17 },
});

function ProfileContent() {
  const { user, resetOnboarding } = useAppState();
  const [dailyReading, setDailyReading] = useState(true);
  const [moonAlerts, setMoonAlerts] = useState(true);
  const [transitAlerts, setTransitAlerts] = useState(false);
  const [personalDayAlert, setPersonalDayAlert] = useState(true);

  if (!user) return null;
  const bp = getBlueprintSummary(user);

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={st.profileHeader}>
          <View style={st.avatarLarge}><Text style={st.avatarLargeText}>{user.preferredName.charAt(0)}</Text></View>
          <Text style={st.userName}>{user.preferredName}</Text>
          {user.fullName !== user.preferredName && <Text style={st.fullName}>{user.fullName}</Text>}

          <View style={st.summaryRow}>
            <SystemChip label="Sun" value={`${ZODIAC_SYMBOLS[bp.sunSign]} ${bp.sunSign}`} color={SolunaColors.warmGold} />
            <SystemChip label="Moon" value={`${ZODIAC_SYMBOLS[bp.moonSign]} ${bp.moonSign}`} color={SolunaColors.gentleLavender} />
            <SystemChip label="Rising" value={`${ZODIAC_SYMBOLS[bp.rising]} ${bp.rising}`} color={SolunaColors.softPeach} />
          </View>
          <View style={st.summaryRow}>
            <SystemChip label="Life Path" value={String(bp.lifePath)} color={SolunaColors.gentleLavender} />
            <SystemChip label="Chinese" value={`${CHINESE_ANIMAL_EMOJI[bp.animal]} ${bp.animal}`} color={SolunaColors.softPeach} />
            <SystemChip label="Type" value={bp.hdType} color={SolunaColors.warmGold} />
          </View>
        </View>

        <PremiumBanner />

        {/* ── Your Active Focuses ── */}
        <Text style={st.sectionTitle}>Your Active Focuses</Text>
        <View style={st.card}>
          {MOCK_ACTIVE_FOCUSES.filter(f => f.status === "active").slice(0, 2).map((focus) => (
            <TouchableOpacity
              key={focus.id}
              style={[rS.row, rS.border]}
              onPress={() => router.push({ pathname: "/focus/check-in", params: { focusId: focus.id, category: focus.category, title: focus.title } })}
              activeOpacity={0.7}
            >
              <View style={rS.icon}>
                <Target size={16} color={SolunaColors.gentleLavender} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={rS.label} numberOfLines={1}>{focus.title}</Text>
                <Text style={st.focusMeta}>{focus.category} · {focus.supportMode}</Text>
              </View>
              <ChevronRight size={16} color={SolunaColors.creamSubtle} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[rS.row, { borderBottomWidth: 0 }]}
            onPress={() => router.push("/focus/active")}
            activeOpacity={0.7}
          >
            <View style={rS.icon}>
              <Plus size={16} color={SolunaColors.warmGold} />
            </View>
            <Text style={[rS.label, { color: SolunaColors.warmGold }]}>View all & start new</Text>
            <ChevronRight size={16} color={SolunaColors.warmGold} />
          </TouchableOpacity>
        </View>

        {/* ── Weekly Integration Report ── */}
        <Text style={st.sectionTitle}>Weekly Integration</Text>
        <WeeklyReportCard report={MOCK_WEEKLY_REPORT} />

        {/* ── Pattern Memory ── */}
        <Text style={st.sectionTitle}>What Soluna Remembers</Text>
        <PatternMemorySection />

        {/* ── Widget Previews ── */}
        <Text style={st.sectionTitle}>Home Screen Widgets</Text>
        <Text style={st.widgetIntro}>
          Glanceable, kind reminders right on your home screen — designed to support, not interrupt. Available when you place the widget.
        </Text>
        {WIDGET_PREVIEWS.map((widget) => (
          <WidgetPreviewCard key={widget.id} widget={widget} />
        ))}

        {/* ── Birth Details ── */}
        <Text style={st.sectionTitle}>Your Birth Details</Text>
        <View style={st.card}>
          <SettingRow icon={<Star size={18} color={SolunaColors.warmGold} />} label="Full name" value={user.fullName} />
          <SettingRow icon={<Heart size={18} color={SolunaColors.softPeach} />} label="Preferred name" value={user.preferredName} />
          <SettingRow icon={<Star size={18} color={SolunaColors.warmGold} />} label="Birth date" value={new Date(user.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          <SettingRow icon={<Clock size={18} color={SolunaColors.gentleLavender} />} label="Birth time" value={user.birthTimeKnown ? user.birthTime : "Unknown (noon estimate)"} />
          <SettingRow icon={<Star size={18} color={SolunaColors.softPeach} />} label="Birth place" value={user.birthPlace} isLast />
        </View>

        {/* ── Notifications ── */}
        <Text style={st.sectionTitle}>Notifications</Text>
        <View style={st.card}>
          <SettingToggle icon={<Bell size={18} color={SolunaColors.warmGold} />} label="Daily reading" value={dailyReading} onChange={setDailyReading} />
          <SettingRow icon={<Clock size={18} color={SolunaColors.creamMuted} />} label="Reading time" value="8:00 AM" />
          <SettingToggle icon={<Hash size={18} color={SolunaColors.gentleLavender} />} label="Personal Day number" value={personalDayAlert} onChange={setPersonalDayAlert} />
          <SettingToggle icon={<Moon size={18} color={SolunaColors.gentleLavender} />} label="Moon phase / ritual alerts" value={moonAlerts} onChange={setMoonAlerts} />
          <SettingToggle icon={<Sparkles size={18} color={SolunaColors.softPeach} />} label="Big transit heads-up" value={transitAlerts} onChange={setTransitAlerts} />
        </View>

        {/* ── About ── */}
        <Text style={st.sectionTitle}>About</Text>
        <View style={st.card}>
          <SettingRow icon={<Lock size={18} color={SolunaColors.gentleLavender} />} label="Privacy" value="Your data stays private" onPress={() => {}} />
          <SettingRow icon={<Shield size={18} color={SolunaColors.softPeach} />} label="Data policy" value="We never sell or train on your data" onPress={() => {}} />
          <SettingRow icon={<CircleHelp size={18} color={SolunaColors.creamMuted} />} label="About Soluna" onPress={() => {}} isLast />
        </View>

        <View style={st.privacyCard}>
          <Shield size={18} color={SolunaColors.warmGold} />
          <Text style={st.privacyText}>Your birth data stays private. We never sell it, never share it, and never train AI on your chats. This is a sacred promise.</Text>
        </View>

        <TouchableOpacity style={st.resetBtn} onPress={resetOnboarding}>
          <LogOut size={16} color={SolunaColors.creamSubtle} />
          <Text style={st.resetText}>Reset onboarding</Text>
        </TouchableOpacity>

        <Text style={st.version}>Soluna v1.0 · Made with care</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

export default function ProfileScreen() {
  return <ProfileContent />;
}

const st = StyleSheet.create({
  gradient: { flex: 1 }, scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  profileHeader: { alignItems: "center", marginBottom: 24 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(232,184,109,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 2, borderColor: "rgba(232,184,109,0.2)" },
  avatarLargeText: { fontSize: 30, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.heading },
  userName: { fontSize: 24, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  fullName: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 12 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 12, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 10, marginTop: 8 },
  widgetIntro: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, lineHeight: 19, marginBottom: 14 },
  card: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 20 },
  privacyCard: { flexDirection: "row", gap: 12, backgroundColor: "rgba(232,184,109,0.05)", borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 20, alignItems: "flex-start" },
  privacyText: { flex: 1, fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
  focusMeta: { fontSize: 11, color: SolunaColors.creamSubtle, fontFamily: Fonts.body, marginTop: 1 },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginTop: 8 },
  resetText: { fontSize: 13, color: SolunaColors.creamSubtle, fontFamily: Fonts.body },
  version: { fontSize: 11, color: SolunaColors.creamSubtle, textAlign: "center", fontFamily: Fonts.body, marginTop: 4 },
});
