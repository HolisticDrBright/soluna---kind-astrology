// Auth state. In mock mode (or when the backend isn't configured) auth is a
// no-op so the app runs without a backend. Otherwise it wraps Supabase Auth.
import { useCallback, useEffect, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { BACKEND_CONFIGURED } from "@/config/api";
import { USE_MOCK_DATA } from "@/constants/flags";

const AUTH_ACTIVE = !USE_MOCK_DATA && BACKEND_CONFIGURED;

const [AuthProvider, useAuthRaw] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(AUTH_ACTIVE);

  useEffect(() => {
    if (!AUTH_ACTIVE) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    authActive: AUTH_ACTIVE,
    session,
    user: (session?.user ?? null) as User | null,
    isAuthenticated: !!session,
    loading,
    signIn,
    signUp,
    signOut,
  };
});

function useAuth(): ReturnType<typeof useAuthRaw> {
  return useAuthRaw();
}

export { AuthProvider, useAuth };
