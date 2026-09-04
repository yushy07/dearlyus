'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (email) {
    return <Link className="btn btn-ghost" href="/profile" style={{ fontSize: '13px', padding: '6px 12px' }}>Profile</Link>;
  }

  return <Link className="btn btn-ghost" href="/profile" style={{ fontSize: '13px', padding: '6px 12px' }}>Sign in</Link>;
}
