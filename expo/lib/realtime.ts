// Realtime sync. Subscribes (when authenticated) to the user's daily_readings
// INSERTs ("today's reading is ready") and subscriptions UPDATEs (entitlement
// changes) and invalidates the matching React Query caches so the UI refreshes.
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/useAuth";

export function useRealtimeSync(): void {
  const { authActive, isAuthenticated, user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authActive || !isAuthenticated || !user) return;
    const channel = supabase
      .channel(`soluna-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "daily_readings", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["today"] }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["entitlements"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authActive, isAuthenticated, user, qc]);
}
