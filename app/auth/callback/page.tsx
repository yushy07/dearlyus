'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import styles from '../../login/auth.module.css';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Finishing your sign-in…');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setMessage('Sign-in is not configured yet. Please try again shortly.');
      return;
    }
    const oauthError = new URLSearchParams(window.location.search).get('error_description');
    if (oauthError) {
      setMessage('Google sign-in was cancelled. You can safely return and try again.');
      return;
    }

    // With detectSessionInUrl enabled, Supabase completes the PKCE exchange while
    // initializing the browser client. getSession waits for that initialization.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setMessage('We could not finish sign-in. Please return and try again.');
        return;
      }

      const requested = sessionStorage.getItem('dearly_auth_return_to');
      sessionStorage.removeItem('dearly_auth_return_to');
      const nextPath = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/our-space';
      router.replace(nextPath);
    });
  }, [router]);

  return (
    <main className={styles.page}>
      <section className={styles.stage}>
        <div className={styles.card}>
          <div className={styles.connection} aria-hidden="true"><i className={styles.dot} /><i className={styles.dot} /></div>
          <div className={styles.eyebrow}>Connecting your account</div>
          <h1 className={styles.title}>Almost there.</h1>
          <p className={styles.copy}>{message}</p>
          {message.includes('could not') || message.includes('cancelled') ? <a className="btn btn-primary" href="/login">Return to sign in</a> : null}
        </div>
      </section>
    </main>
  );
}
