'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import styles from './auth.module.css';

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.35l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.44H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.56l3.35-2.63Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.44l3.35 2.63C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const nextPath = useMemo(() => {
    const requested = searchParams.get('next');
    return requested?.startsWith('/') && !requested.startsWith('//')
      ? requested
      : '/our-space';
  }, [searchParams]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setError('Sign-in is not configured yet. Please try again shortly.');
      setBusy(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(nextPath);
      else setBusy(false);
    });
  }, [nextPath, router]);

  const continueWithGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError('');
    sessionStorage.setItem('dearly_auth_return_to', nextPath);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (authError) {
      setError('Google sign-in could not start. Please try once more.');
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="brand" href="/" aria-label="Dearly Us home">
          <span className="brand-emblem" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 128 128" fill="none">
              <rect width="128" height="128" rx="36" fill="#1C1924" />
              <path
                d="M64 77C51 93 29 86 29 64C29 45 48 38 64 58"
                stroke="#FF4E78"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M64 58C80 38 99 45 99 64C99 86 77 93 64 77"
                stroke="#437EEB"
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>Dearly Us</span>
        </Link>
        <Link className={styles.back} href="/">
          ← Back home
        </Link>
      </header>

      <section className={styles.stage}>
        <div className={styles.card}>
          <div className={styles.connection} aria-hidden="true">
            <i className={styles.dot} />
            <i className={styles.dot} />
          </div>
          <div className={styles.eyebrow}>Your private space for two</div>
          <h1 className={styles.title}>Keep your date nights close.</h1>
          <p className={styles.copy}>
            Save your space, invite your person, and pick up the little moments
            right where you left them.
          </p>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <button
            className={styles.googleButton}
            onClick={continueWithGoogle}
            disabled={busy}
          >
            <GoogleMark />{' '}
            {busy ? 'Checking your space…' : 'Continue with Google'}
          </button>
          <p className={styles.finePrint}>
            We only use your Google account to create and protect your Dearly Us
            profile. By continuing, you agree to our{' '}
            <Link href="/terms">Terms</Link> and acknowledge our{' '}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
