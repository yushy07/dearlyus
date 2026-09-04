'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export function AuthButton() {
  const [account, setAccount] = useState<{ name: string; avatar: string | null } | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const showUser = (user?: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) return setAccount(null);
      const metadata = user.user_metadata ?? {};
      setAccount({
        name: String(metadata.full_name || metadata.name || user.email || 'My Space'),
        avatar: (metadata.avatar_url || metadata.picture || null) as string | null,
      });
    };
    supabase.auth.getUser().then(({ data }) => showUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => showUser(session?.user));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (account) {
    const initials = account.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    return (
      <Link className="btn btn-ghost" href="/profile" style={{ fontSize: '13px', padding: '5px 11px 5px 6px', gap: '7px' }} aria-label="Open My Space">
        <span style={{ width: 25, height: 25, borderRadius: '50%', display: 'grid', placeItems: 'center', overflow: 'hidden', color: '#fff', fontSize: 9, fontWeight: 900, background: 'linear-gradient(135deg, var(--pink), var(--blue))' }}>
          {account.avatar ? <img src={account.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </span>
        My Space
      </Link>
    );
  }

  return <Link className="btn btn-ghost" href="/login" style={{ fontSize: '13px', padding: '6px 12px' }}>Sign in with Google</Link>;
}
