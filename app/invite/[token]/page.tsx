'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { joinCoupleSpace } from '@/lib/account';
import styles from './invite.module.css';

interface InvitePreview {
  code: string;
  coupleName: string;
  inviterName: string;
  expiresAt: string;
  isSelfInvite: boolean;
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const code = String(params?.token || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !code) {
      setError('This invitation is not available.');
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(`/invite/${code}`)}`);
        return;
      }
      const { data: invite, error: inviteError } = await supabase.rpc('get_couple_invite_preview', { invite_code: code });
      if (inviteError || !invite) setError('This invitation has expired, was already used, or is no longer available.');
      else setPreview(invite as InvitePreview);
      setLoading(false);
    });
  }, [code, router]);

  const accept = async () => {
    if (!preview || preview.isSelfInvite) return;
    setJoining(true);
    setError('');
    try {
      await joinCoupleSpace(code);
      router.replace('/profile?connected=true');
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : '';
      if (message.includes('already belong')) setError('This account is already connected to an Our Space.');
      else if (message.includes('own invitation')) setError('Open this invitation using your partner’s Google account.');
      else setError('The invitation could not be accepted. Ask your person for a fresh link.');
      setJoining(false);
    }
  };

  return (
    <main className={styles.page}>
      <Link className={styles.brand} href="/">Dearly Us ♡</Link>
      <section className={styles.card}>
        <div className={styles.ribbon}><span /><i /><span /></div>
        <div className={styles.eyebrow}>A private invitation for two</div>
        {loading ? <><h1>Opening your invitation…</h1><p>Checking that this space is still waiting for you.</p></> : error ? <><h1>This link needs a little help.</h1><p className={styles.error}>{error}</p><Link className="btn btn-ghost" href="/profile">Return to My Space</Link></> : preview ? <>
          <h1>{preview.inviterName} is inviting you in.</h1>
          <p>Join <strong>{preview.coupleName}</strong>, a private Dearly Us space shared by exactly two Google accounts.</p>
          <div className={styles.code}>{preview.code}</div>
          <p className={styles.expiry}>Invitation valid until {new Date(preview.expiresAt).toLocaleString()}.</p>
          {preview.isSelfInvite ? <div className={styles.error}>This is your invitation. Send it to your person so they can join with their Google account.</div> : <button className="btn btn-primary" onClick={accept} disabled={joining}>{joining ? 'Connecting your space…' : `Join ${preview.inviterName} →`}</button>}
          <p className={styles.fine}>Joining connects this Google account to one private couple space. The invitation cannot be used again.</p>
        </> : null}
      </section>
    </main>
  );
}
