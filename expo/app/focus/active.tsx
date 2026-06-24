import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  Fonts,
  MOCK_ACTIVE_FOCUSES,
  FOCUS_CATEGORIES,
  type FocusData,
  type FocusStatus,
} from "@/constants/mockData";
import EmptyState from "@/components/EmptyState";
import {
  ArrowLeft,
  Plus,
  Clock,
  Target,
  ChevronRight,
  Pause,
  Play,
  CheckCircle,
  Heart,
  Brain,
  Briefcase,
  Home,
  Sparkles,
} from "lucide-react-native";

const STATUS_CONFIG: Record<
  FocusStatus,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: "Active",
    color: "#7BC89C",
    bg: "rgba(123,200,156,0.08)",
  },
  paused: {
    label: "Paused",
    color: SolunaColors.warmGold,
    bg: "rgba(232,184,109,0.08)",
  },
  resolved: {
    label: "Resolved",
    color: SolunaColors.gentleLavender,
    bg: "rgba(185,163,227,0.08)",
  },
};

export default function ActiveFocusesScreen() {
  const { user } = useAppState();
  const [focuses, setFocuses] = useState<FocusData[]>(MOCK_ACTIVE_FOCUSES);

  const toggleStatus = useCallback((id: string, current: FocusStatus) => {
    setFocuses((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const next: FocusStatus =
          current === "active"
            ? "paused"
            : current === "paused"
              ? "resolved"
              : "active";
        return { ...f, status: next, lastUpdated: new Date().toISOString().split("T")[0] };
      }),
    );
  }, []);

  if (!user) return null;

  const activeFocuses = focuses.filter((f) => f.status === "active");
  const pausedResolved = focuses.filter((f) => f.status !== "active");

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
            <Text style={st.headerTitle}>Your Focuses</Text>
            <Text style={st.headerSub}>
              {activeFocuses.length} active · {pausedResolved.length} paused or resolved
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/focus/setup")}
            style={st.addBtn}
          >
            <Plus size={20} color={SolunaColors.warmGold} />
          </TouchableOpacity>
        </View>

        {/* ─── Active Focuses ─── */}
        <Text style={st.sectionLabel}>Active</Text>
        {activeFocuses.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No active focuses"
            description="When you start a Focus, it'll appear here so you can check in and track your progress. Start one from Today, Ask Soluna, or your Bonds."
            actionLabel="Start a Focus"
            onAction={() => router.push("/focus/setup")}
          />
        ) : (
          activeFocuses.map((focus) => {
            const cat = FOCUS_CATEGORIES.find((c) => c.id === focus.category);
            const statusCfg = STATUS_CONFIG[focus.status];
            return (
              <FocusCard
                key={focus.id}
                focus={focus}
                categoryConfig={cat}
                statusConfig={statusCfg}
                onToggleStatus={() => toggleStatus(focus.id, focus.status)}
              />
            );
          })
        )}

        {/* ─── Paused / Resolved ─── */}
        {pausedResolved.length > 0 && (
          <>
            <Text style={st.sectionLabel}>Paused & Resolved</Text>
            {pausedResolved.map((focus) => {
              const cat = FOCUS_CATEGORIES.find((c) => c.id === focus.category);
              const statusCfg = STATUS_CONFIG[focus.status];
              return (
                <FocusCard
                  key={focus.id}
                  focus={focus}
                  categoryConfig={cat}
                  statusConfig={statusCfg}
                  onToggleStatus={() => toggleStatus(focus.id, focus.status)}
                />
              );
            })}
          </>
        )}

        {/* ─── Privacy ─── */}
        <View style={st.privacyNote}>
          <Sparkles size={12} color={SolunaColors.warmGold} />
          <Text style={st.privacyText}>
            You choose what Soluna remembers. You can pause or resolve any Focus
            anytime — this is your space, at your pace.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Focus Card ────────────────────────────────────────────
function FocusCard({
  focus,
  categoryConfig,
  statusConfig,
  onToggleStatus,
}: {
  focus: FocusData;
  categoryConfig?: { emoji: string; label: string; color: string };
  statusConfig: { label: string; color: string; bg: string };
  onToggleStatus: () => void;
}) {
  return (
    <TouchableOpacity
      style={fcS.card}
      onPress={() =>
        router.push({
          pathname: "/focus/check-in",
          params: { focusId: focus.id, category: focus.category, title: focus.title },
        })
      }
      activeOpacity={0.7}
    >
      <View style={fcS.top}>
        <View style={fcS.left}>
          <Text style={fcS.emoji}>{categoryConfig?.emoji ?? "💭"}</Text>
          <View style={fcS.info}>
            <Text style={fcS.title}>{focus.title}</Text>
            <View style={fcS.metaRow}>
              <View style={[fcS.statusPill, { backgroundColor: statusConfig.bg }]}>
                <View style={[fcS.statusDot, { backgroundColor: statusConfig.color }]} />
                <Text style={[fcS.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
              {focus.connectedPersonName && (
                <View style={fcS.connectedPill}>
                  <Heart size={10} color={SolunaColors.softPeach} />
                  <Text style={fcS.connectedText}>
                    {focus.connectedPersonName}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <ChevronRight size={16} color={SolunaColors.creamSubtle} />
      </View>

      {/* Bottom row */}
      <View style={fcS.bottom}>
        <View style={fcS.bottomItem}>
          <Clock size={12} color={SolunaColors.creamSubtle} />
          <Text style={fcS.bottomText}>
            Updated {focus.lastUpdated}
          </Text>
        </View>
        {focus.nextCheckIn && focus.status === "active" && (
          <View style={fcS.bottomItem}>
            <Target size={12} color={SolunaColors.warmGold} />
            <Text style={[fcS.bottomText, { color: SolunaColors.warmGold }]}>
              Check in by {focus.nextCheckIn}
            </Text>
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={fcS.quickActions}>
        <TouchableOpacity
          style={fcS.quickBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            router.push({
              pathname: "/focus/check-in",
              params: { focusId: focus.id, category: focus.category, title: focus.title },
            });
          }}
          activeOpacity={0.7}
        >
          <Target size={13} color={SolunaColors.warmGold} />
          <Text style={fcS.quickBtnText}>Check in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={fcS.quickBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleStatus();
          }}
          activeOpacity={0.7}
        >
          {focus.status === "active" ? (
            <>
              <Pause size={13} color={SolunaColors.creamSubtle} />
              <Text style={[fcS.quickBtnText, { color: SolunaColors.creamSubtle }]}>
                Pause
              </Text>
            </>
          ) : focus.status === "paused" ? (
            <>
              <CheckCircle size={13} color={SolunaColors.gentleLavender} />
              <Text style={[fcS.quickBtnText, { color: SolunaColors.gentleLavender }]}>
                Resolve
              </Text>
            </>
          ) : (
            <>
              <Play size={13} color={SolunaColors.success} />
              <Text style={[fcS.quickBtnText, { color: SolunaColors.success }]}>
                Reactivate
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const fcS = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", gap: 12, flex: 1 },
  emoji: { fontSize: 24, width: 32, textAlign: "center", marginTop: 2 },
  info: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    marginBottom: 6,
  },
  metaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  connectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(242,168,141,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  connectedText: {
    fontSize: 10,
    color: SolunaColors.softPeach,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  bottom: {
    flexDirection: "row",
    gap: 14,
    marginTop: 10,
  },
  bottomItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bottomText: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: SolunaColors.warmGold,
    fontFamily: Fonts.body,
  },
});

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
  headerCenter: { flex: 1, marginHorizontal: 12 },
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(232,184,109,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
    fontFamily: Fonts.body,
    marginBottom: 12,
    marginTop: 4,
  },

  // Privacy
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(232,184,109,0.05)",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.1)",
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    lineHeight: 17,
    fontStyle: "italic",
  },
});
