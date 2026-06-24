// React Query hooks. Each hook returns mock data when USE_MOCK_DATA is on (or
// the user isn't authenticated), and live backend data — mapped to the same UI
// shapes — otherwise. Screens consume `data` and don't care which source it is.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "@/constants/flags";
import { BACKEND_CONFIGURED } from "@/config/api";
import { useAuth } from "@/state/useAuth";
import { api } from "@/lib/apiClient";
import { backendReadingToDailyReading } from "@/lib/mappers";
import {
  CONNECTIONS,
  DAILY_READINGS,
  getReadingForDate,
  JOURNAL_ENTRIES,
  RITUALS,
  SYNTHESIS_THEMES,
  type DailyReading,
  type JournalEntry,
  type Ritual,
} from "@/constants/mockData";

function useLive(): boolean {
  const { authActive, isAuthenticated } = useAuth();
  return authActive && isAuthenticated;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Today ─────────────────────────────────────────────────────────
export function useTodayReading(date?: string) {
  const live = useLive();
  const d = date ?? todayStr();
  return useQuery<DailyReading>({
    queryKey: ["today", d],
    enabled: live,
    queryFn: async () => backendReadingToDailyReading((await api.today(date)).reading),
    initialData: live ? undefined : getReadingForDate(d) ?? DAILY_READINGS[0],
  });
}

// ─── Insight ───────────────────────────────────────────────────────
export function useInsight(system: string, key: string) {
  const live = useLive();
  return useQuery({
    queryKey: ["insight", system, key],
    enabled: live && !!system && !!key,
    queryFn: () => api.insight(system, key),
  });
}

// ─── Synthesis ─────────────────────────────────────────────────────
export function useSynthesis(theme?: string) {
  const live = useLive();
  return useQuery({
    queryKey: ["synthesis", theme ?? "all"],
    enabled: live,
    queryFn: () => api.synthesis(theme),
    initialData: live
      ? undefined
      : theme
      ? SYNTHESIS_THEMES.find((t) => t.id === theme) ?? SYNTHESIS_THEMES[0]
      : { themes: SYNTHESIS_THEMES },
  });
}

// ─── Rituals ───────────────────────────────────────────────────────
export function useRituals(phase?: string) {
  const live = useLive();
  return useQuery<Ritual[]>({
    queryKey: ["rituals", phase ?? "all"],
    enabled: live,
    queryFn: async () => {
      const { rituals } = await api.rituals(phase);
      return rituals.map((r) => ({
        id: r.id,
        title: r.title,
        moonPhase: r.moon_phase,
        description: r.description ?? "",
        steps: r.steps ?? [],
        intention: r.intention ?? "",
      }));
    },
    initialData: live ? undefined : RITUALS,
  });
}

// ─── Journal ───────────────────────────────────────────────────────
export function useJournal() {
  const live = useLive();
  return useQuery<JournalEntry[]>({
    queryKey: ["journal"],
    enabled: live,
    queryFn: async () => {
      const { entries } = await api.journal();
      return entries.map((e) => ({
        id: e.id,
        date: e.entry_date,
        title: e.title ?? "Journal entry",
        content: e.body,
        mood: e.mood != null ? String(e.mood) : "",
        transitContext: typeof e.transit_context?.moon?.phase === "string"
          ? `Moon: ${e.transit_context.moon.phase}`
          : "",
      }));
    },
    initialData: live ? undefined : JOURNAL_ENTRIES,
  });
}

export function useAddJournal() {
  const qc = useQueryClient();
  const live = useLive();
  return useMutation({
    mutationFn: async (
      input: { title?: string; body: string; mood?: number; entryDate?: string; tags?: string[]; sourceRef?: string },
    ) => {
      if (!live) return null;
      return await api.addJournal(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });
}

// ─── Saved ─────────────────────────────────────────────────────────
export function useSaved(kind?: string) {
  const live = useLive();
  return useQuery({
    queryKey: ["saved", kind ?? "all"],
    enabled: live,
    queryFn: async () => (await api.saved(kind)).saved,
    initialData: live ? undefined : [],
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  const live = useLive();
  return useMutation({
    mutationFn: async (input: { kind: string; refId: string; payload?: Record<string, unknown> }) => {
      if (!live) return null;
      return await api.addSaved(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });
}

export function useRemoveSaved() {
  const qc = useQueryClient();
  const live = useLive();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!live) return null;
      return await api.removeSaved(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved"] }),
  });
}

// ─── Connections ───────────────────────────────────────────────────
export function useConnections() {
  const live = useLive();
  return useQuery({
    queryKey: ["connections"],
    enabled: live,
    queryFn: async () => (await api.connections()).connections,
    // Mock connections have a different (richer) shape; the Connections screen
    // reads from the mock list directly until it's migrated, so cast here.
    initialData: live ? undefined : (CONNECTIONS as unknown as Awaited<ReturnType<typeof api.connections>>["connections"]),
  });
}

export function useCompatibility(connectionId: string | undefined, lens: string) {
  const live = useLive();
  return useQuery({
    queryKey: ["compatibility", connectionId, lens],
    enabled: live && !!connectionId,
    queryFn: () => api.compatibility(connectionId!, lens),
  });
}

export function useAddConnection() {
  const qc = useQueryClient();
  const live = useLive();
  return useMutation({
    mutationFn: async (input: unknown) => {
      if (!live) return null;
      return await api.addConnection(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connections"] }),
  });
}

// ─── Partner / Bonds ───────────────────────────────────────────────
export function useBonds() {
  const live = useLive();
  return useQuery({
    queryKey: ["bonds"],
    enabled: live,
    queryFn: async () => (await api.bonds()).bonds,
    initialData: live ? undefined : [],
  });
}

export function useBondSpace(linkId: string | undefined) {
  const live = useLive();
  return useQuery({
    queryKey: ["bondSpace", linkId],
    enabled: live && !!linkId,
    queryFn: () => api.bondSpace(linkId!),
  });
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: (input: { lens: string; inviteeEmail?: string }) => api.createInvite(input),
  });
}

// Invite preview works even before sign-in (the backend route is public).
export function useInvitePreview(code: string | undefined) {
  return useQuery({
    queryKey: ["invitePreview", code],
    enabled: !USE_MOCK_DATA && BACKEND_CONFIGURED && !!code,
    queryFn: () => api.invitePreview(code!),
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.acceptInvite(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bonds"] }),
  });
}

export function useUpdateBondPrefs(linkId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Record<string, boolean>) => api.updateBondPrefs(linkId, prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bondSpace", linkId] }),
  });
}

export function useUnlinkBond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => api.unlinkBond(linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bonds"] }),
  });
}

// ─── Tarot ─────────────────────────────────────────────────────────
export function useDrawTarot() {
  const live = useLive();
  return useMutation({
    mutationFn: async (input: { spread: string; question?: string }) => {
      if (!live) return null;
      return (await api.drawTarot(input)).reading;
    },
  });
}

// ─── Profile / entitlements ────────────────────────────────────────
export function useMe() {
  const live = useLive();
  return useQuery({
    queryKey: ["me"],
    enabled: live,
    queryFn: () => api.me(),
  });
}

export function useEntitlements() {
  const live = useLive();
  return useQuery({
    queryKey: ["entitlements"],
    enabled: live,
    queryFn: () => api.entitlements(),
    initialData: live
      ? undefined
      : {
        entitlement: "free",
        status: "inactive",
        expiresAt: null,
        isPremium: false,
        features: { unlimitedAsk: true, fullLenses: true, extraTarotSpreads: true },
      },
  });
}
