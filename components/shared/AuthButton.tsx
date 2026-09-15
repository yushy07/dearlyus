'use client';

import React from 'react';
import Link from 'next/link';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';

export function AuthButton() {
  const { user, loading: authLoading } = useSupabaseSession();
  const { profile, space, partnerConnected } = useCoupleSpace();

  if (authLoading) {
    return (
      <span
        style={{
          fontSize: '12px',
          color: 'var(--ink-soft)',
          padding: '6px 12px',
        }}
      >
        Checking…
      </span>
    );
  }

  // 1. Signed Out
  if (!user) {
    return (
      <Link
        className="btn btn-ghost"
        href="/login"
        style={{ fontSize: '13px', padding: '6px 14px' }}
      >
        Sign in with Google
      </Link>
    );
  }

  const displayName =
    profile?.displayName ||
    user.user_metadata?.full_name ||
    user.email ||
    'You';
  const avatar = profile?.avatarUrl || user.user_metadata?.avatar_url || null;
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join('')
      .toUpperCase() || '♡';

  // 2. Signed In but Unpaired
  if (!space || !partnerConnected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link
          className="btn btn-ghost"
          href="/profile?view=profile#my-profile"
          style={{ fontSize: '13px', padding: '5px 11px 5px 6px', gap: '7px' }}
          aria-label="Open My Profile"
        >
          <span
            style={{
              width: 25,
              height: 25,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              color: '#fff',
              fontSize: 9,
              fontWeight: 900,
              background: 'linear-gradient(135deg, var(--pink), var(--blue))',
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </span>
          My Profile
        </Link>
        <Link
          href="/our-space"
          className="btn"
          style={{
            fontSize: '12px',
            padding: '5px 10px',
            borderRadius: '999px',
            background: 'var(--pink-tint)',
            color: 'var(--pink)',
            border: '1px dashed var(--pink)',
            fontWeight: 700,
          }}
          title="Invite your person to connect"
        >
          + Connect your person
        </Link>
      </div>
    );
  }

  // 3. Paired State
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Link
        className="btn btn-ghost"
        href="/profile?view=profile#my-profile"
        style={{ fontSize: '13px', padding: '5px 11px 5px 6px', gap: '7px' }}
        aria-label="Open My Profile"
      >
        <span
          style={{
            width: 25,
            height: 25,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
            color: '#fff',
            fontSize: 9,
            fontWeight: 900,
            background: 'linear-gradient(135deg, var(--pink), var(--blue))',
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
        </span>
        <span>My Profile</span>
      </Link>
    </div>
  );
}
