'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export interface SupabaseSessionContextValue {
  supabase: SupabaseClient | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SupabaseSessionContext = createContext<SupabaseSessionContextValue | null>(null);

export function SupabaseSessionProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabase();
    setSupabase(client);

    if (!client) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = client.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshSession = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
  };

  const value = useMemo<SupabaseSessionContextValue>(
    () => ({
      supabase,
      user,
      session,
      loading,
      error,
      signOut,
      refreshSession,
    }),
    [supabase, user, session, loading, error]
  );

  return <SupabaseSessionContext.Provider value={value}>{children}</SupabaseSessionContext.Provider>;
}

export function useSupabaseSession() {
  const context = useContext(SupabaseSessionContext);
  if (!context) {
    throw new Error('useSupabaseSession must be used within a SupabaseSessionProvider');
  }
  return context;
}
