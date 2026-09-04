'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Finishing your sign-in…');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setMessage('Sign-in is not configured yet. Please try again shortly.');
      return;
    }
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) setMessage('We could not finish sign-in. Please return and try again.');
        else router.replace('/profile');
      });
  }, [router]);

  return <main className="wrap" style={{ paddingTop: '120px', textAlign: 'center' }}><p>{message}</p></main>;
}
