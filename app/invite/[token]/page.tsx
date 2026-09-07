'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { joinCoupleSpace, type CoupleInvitePreview } from '@/lib/account';
import styles from './invite.module.css';

type ResolvedInviteState = NonNullable<CoupleInvitePreview['state']>;

const STATE_COPY: Record<
  Exclude<ResolvedInviteState, 'pending'>,
  { title: string; body: string }
> = {
  accepted: {
    title: 'You’re already connected.',
    body: 'This invitation brought you into your shared space.',
  },
  expired: {
    title: 'This invitation has expired.',
    body: 'Ask your person to make a fresh private invitation.',
  },
  revoked: {
    title: 'This invitation was replaced.',
    body: 'Ask your person for their newest private link.',
  },
  already_used: {
    title: 'This invitation was already used.',
    body: 'Single-use invitations can connect only one partner.',
  },
  couple_full: {
    title: 'This space is complete.',
    body: 'Both people are already connected to this private space.',
  },
  self_invite: {
    title: 'This invitation is yours.',
    body: 'Send it to your person so they can join with their own Google account.',
  },
  already_connected: {
    title: 'You already have an Our Space.',
    body: 'One Google account can belong to one active couple space.',
  },
};

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const code = String(params?.token || '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase();
  const [preview, setPreview] = useState<CoupleInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const inviteState: ResolvedInviteState =
    preview?.state ?? (preview?.isSelfInvite ? 'self_invite' : 'pending');

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
      const { data: invite, error: inviteError } = await supabase.rpc(
        'get_couple_invite_preview',
        { invite_code: code },
      );
      if (inviteError || !invite)
        setError(
          'This invitation is not available. Check the link or ask your person for a fresh one.',
        );
      else setPreview(invite as CoupleInvitePreview);
      setLoading(false);
    });
  }, [code, router]);

  const accept = async () => {
    if (!preview || inviteState !== 'pending') return;
    setJoining(true);
    setError('');
    try {
      await joinCoupleSpace(code);
      router.replace('/our-space?connected=true');
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : '';
      if (
        message.includes('ALREADY_CONNECTED') ||
        message.includes('already belong')
      )
        setError('This account is already connected to an Our Space.');
      else if (
        message.includes('SELF_INVITE') ||
        message.includes('own invitation')
      )
        setError('Open this invitation using your partner’s Google account.');
      else if (
        message.includes('SPACE_FULL') ||
        message.includes('already has two')
      )
        setError('Both people are already connected to this space.');
      else if (message.includes('INVITE_EXPIRED'))
        setError('This invitation expired. Ask your person for a fresh one.');
      else if (message.includes('INVITE_REVOKED'))
        setError(
          'This invitation was replaced. Ask your person for the newest link.',
        );
      else if (message.includes('INVITE_USED'))
        setError('This single-use invitation was already accepted.');
      else
        setError(
          'The invitation could not be accepted. Ask your person for a fresh link.',
        );
      setJoining(false);
    }
  };

  return (
    <main className={styles.page}>
      <Link className={styles.brand} href="/">
        Dearly Us ♡
      </Link>
      <section className={styles.card}>
        <div className={styles.ribbon}>
          <span />
          <i />
          <span />
        </div>
        <div className={styles.eyebrow}>A private invitation for two</div>
        {loading ? (
          <>
            <h1>Opening your invitation…</h1>
            <p>Checking that this space is still waiting for you.</p>
          </>
        ) : error ? (
          <>
            <h1>This link needs a little help.</h1>
            <p className={styles.error}>{error}</p>
            <Link className="btn btn-ghost" href="/our-space">
              Return to My Space
            </Link>
          </>
        ) : preview && inviteState === 'pending' ? (
          <>
            <h1>{preview.inviterName} is inviting you in.</h1>
            <p>
              Join <strong>{preview.spaceName}</strong>, a private Dearly Us
              space shared by exactly two Google accounts.
            </p>
            <div className={styles.code}>{preview.code}</div>
            <p className={styles.expiry}>
              Invitation valid until{' '}
              {new Date(preview.expiresAt).toLocaleString()}.
            </p>
            <button
              className="btn btn-primary"
              onClick={accept}
              disabled={joining}
            >
              {joining
                ? 'Connecting your space…'
                : `Join ${preview.inviterName} →`}
            </button>
            <p className={styles.fine}>
              Joining connects this Google account to one private couple space.
              The invitation cannot be used again.
            </p>
          </>
        ) : preview ? (
          <>
            <h1>
              {
                STATE_COPY[
                  inviteState as Exclude<ResolvedInviteState, 'pending'>
                ].title
              }
            </h1>
            <p>
              {
                STATE_COPY[
                  inviteState as Exclude<ResolvedInviteState, 'pending'>
                ].body
              }
            </p>
            <div className={styles.code}>{preview.code}</div>
            <Link className="btn btn-primary" href="/our-space">
              Open Our Space →
            </Link>
          </>
        ) : null}
      </section>
    </main>
  );
}
