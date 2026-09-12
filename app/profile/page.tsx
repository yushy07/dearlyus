'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar, AiConsentToggle } from '@/components/shared';
import { QRCodeSVG } from '@/lib/qrcode';
import { sounds } from '@/lib/sound';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { createDateRoom, type Keepsake } from '@/lib/account';
import {
  KeepsakeDetailModal,
  DateNightCapsuleModal,
  RelationshipConstellation,
  MemoryWeather,
  TimezoneBridge,
  SharedRituals,
  CupidotHomeArea,
} from '@/components/our-space';
import styles from './profile.module.css';

const KEEPSAKE_ICONS: Record<Keepsake['kind'], string> = {
  photostrip: '📸',
  passport: '💮',
  receipt: '🧾',
  letter: '💌',
  scrapbook: '📖',
  activity: '♡',
};

function formatLocalTime(timezone?: string, date: Date = new Date()) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '♡'
  );
}

function Avatar({ url, name }: { url?: string | null; name: string }) {
  return url ? (
    <img src={url} alt={`${name}'s Google profile`} />
  ) : (
    <>{initials(name)}</>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut: authSignOut } = useSupabaseSession();
  const {
    profile,
    space,
    partner,
    ownMember,
    keepsakes,
    milestones,
    preferences,
    loading,
    error: spaceError,
    partnerConnected,
    refresh,
    saveProfile,
    createSpace,
    joinSpace,
    regenerateInvite,
    revokeInvite,
    rotateRoom,
    savePreferences,
    removeKeepsake,
    exportSpaceData,
  } = useCoupleSpace();

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('');
  const [spaceName, setSpaceName] = useState('Our Space');
  const [inviteCode, setInviteCode] = useState(
    searchParams
      .get('invite')
      ?.replace(/[^a-z0-9]/gi, '')
      .toUpperCase() || '',
  );
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{
    kind: 'error' | 'success';
    text: string;
  } | null>(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [selectedKeepsake, setSelectedKeepsake] = useState<Keepsake | null>(
    null,
  );
  const [capsuleModalOpen, setCapsuleModalOpen] = useState(false);
  const [dismissedResumePrompt, setDismissedResumePrompt] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState<
    'all' | 'keepsakes' | 'rituals' | 'settings'
  >('all');
  const [flutterActive, setFlutterActive] = useState(false);
  const [profileAttempted, setProfileAttempted] = useState(false);

  const triggerHeartFlutter = () => {
    setFlutterActive(true);
    try {
      sounds.playSparkleReaction('💖');
    } catch {
      // Audio autoplay policy fallback
    }
    window.setTimeout(() => setFlutterActive(false), 2200);
  };

  // Preferences form state
  const [prefMood, setPrefMood] = useState<
    'playful' | 'romantic' | 'deep' | 'cozy'
  >('playful');
  const [prefDuration, setPrefDuration] = useState<15 | 30 | 45 | 60 | 90>(30);
  const [prefAmbient, setPrefAmbient] = useState(false);
  const [prefReducedMotion, setPrefReducedMotion] = useState(false);

  const memoryTimeline = useMemo(
    () =>
      [
        ...keepsakes.map((item) => ({
          id: `keepsake-${item.id}`,
          title: item.title,
          date: item.finalizedAt || item.createdAt,
          label: item.activityPath
            ? item.activityPath.replace('/', '').replaceAll('-', ' ')
            : item.kind,
          icon: KEEPSAKE_ICONS[item.kind] || '♡',
          keepsake: item,
        })),
        ...milestones.map((item) => ({
          id: `milestone-${item.id}`,
          title: item.title,
          date: item.occurredAt,
          label: item.kind.replaceAll('_', ' '),
          icon: '✦',
          keepsake: null,
        })),
      ]
        .filter((item) => !Number.isNaN(new Date(item.date).getTime()))
        .sort(
          (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        )
        .slice(0, 12),
    [keepsakes, milestones],
  );

  // Sync state from context
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setCity(profile.city);
      setTimezone(
        profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setPrefMood(preferences.preferredMood);
      setPrefDuration(preferences.defaultDurationMinutes);
      setPrefAmbient(preferences.ambientAudioEnabled);
      setPrefReducedMotion(preferences.reducedMotion);
    }
  }, [preferences]);

  // Dual clock interval
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 25000);
    return () => window.clearInterval(timer);
  }, []);

  // Check URL connected flag
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setNotice({
        kind: 'success',
        text: 'You’re connected. Welcome to your shared Our Space! ♡',
      });
    }
  }, [searchParams]);

  const userLocalTime = useMemo(
    () => formatLocalTime(timezone || profile?.timezone, now),
    [timezone, profile?.timezone, now],
  );
  const partnerLocalTime = useMemo(
    () => (partner?.timezone ? formatLocalTime(partner.timezone, now) : null),
    [partner?.timezone, now],
  );

  const handleSaveProfile = async () => {
    setProfileAttempted(true);
    if (!displayName.trim() || !city.trim()) {
      setNotice({
        kind: 'error',
        text: 'Please add your display name and city.',
      });
      return;
    }
    setBusy('profile');
    setNotice(null);
    try {
      await saveProfile({ displayName, city, timezone });
      setEditing(false);
      setNotice({ kind: 'success', text: 'Your side is up to date.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setNotice({
        kind: 'error',
        text: message.includes('signed in')
          ? 'Your session expired. Please sign in again.'
          : 'Your profile could not be saved. Check the fields and try once more.',
      });
    } finally {
      setBusy('');
    }
  };

  const handleCreateSpace = async () => {
    setBusy('create');
    setNotice(null);
    try {
      await createSpace(spaceName);
      setNotice({
        kind: 'success',
        text: 'Your space is ready. Send the private invitation to your person!',
      });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        text: err?.message || 'Could not create space.',
      });
    } finally {
      setBusy('');
    }
  };

  const handleJoinSpace = async () => {
    if (!inviteCode) return;
    setBusy('join');
    setNotice(null);
    try {
      await joinSpace(inviteCode);
      setNotice({
        kind: 'success',
        text: 'You are connected. Welcome to your shared space!',
      });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        text: err?.message || 'Invalid or expired invitation.',
      });
    } finally {
      setBusy('');
    }
  };

  const handleRegenerateInvite = async () => {
    setBusy('invite');
    setNotice(null);
    try {
      await regenerateInvite();
      setNotice({
        kind: 'success',
        text: 'A fresh private invitation is ready.',
      });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        text: err?.message || 'Could not refresh invite.',
      });
    } finally {
      setBusy('');
    }
  };

  const handleRevokeInvite = async () => {
    setBusy('revoke');
    setNotice(null);
    try {
      await revokeInvite();
      setNotice({ kind: 'success', text: 'The invitation was revoked.' });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        text: err?.message || 'Could not revoke invite.',
      });
    } finally {
      setBusy('');
    }
  };

  const copyInviteLink = async () => {
    if (!space?.invite) return;
    const url = `${window.location.origin}/invite/${space.invite.code}`;
    await navigator.clipboard.writeText(url);
    sounds.playPop();
    setNotice({
      kind: 'success',
      text: 'Private invite link copied. Send it only to your person.',
    });
  };

  const copyInviteCode = async () => {
    if (!space?.invite) return;
    await navigator.clipboard.writeText(space.invite.code);
    sounds.playPop();
    setNotice({ kind: 'success', text: 'Invitation code copied.' });
  };

  const handleSavePreferences = async () => {
    setBusy('preferences');
    setNotice(null);
    try {
      await savePreferences({
        preferredMood: prefMood,
        defaultDurationMinutes: prefDuration,
        ambientAudioEnabled: prefAmbient,
        reducedMotion: prefReducedMotion,
        aiConsent: preferences?.aiConsent ?? false,
      });
      setNotice({
        kind: 'success',
        text: 'Your shared date-night defaults are saved.',
      });
    } catch {
      setNotice({ kind: 'error', text: 'Could not save preferences.' });
    } finally {
      setBusy('');
    }
  };

  const handleStartRoom = async () => {
    setBusy('room');
    try {
      const room = await createDateRoom();
      router.push(`/room/${room.code}`);
    } catch {
      setNotice({ kind: 'error', text: 'Could not open date night room.' });
      setBusy('');
    }
  };

  const handleExportData = async () => {
    try {
      const jsonStr = await exportSpaceData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dearly-us-space-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice({
        kind: 'success',
        text: 'Data export downloaded successfully.',
      });
    } catch {
      setNotice({ kind: 'error', text: 'Could not export space data.' });
    }
  };

  const handleSignOut = async () => {
    await authSignOut();
    router.replace('/');
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent('/our-space')}`);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className={styles.loading}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>♡</div>
          <h2>Opening your space…</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8 }}>
            Taking you to sign-in…
          </p>
        </div>
      </main>
    );
  }

  // Onboarding view if user hasn't completed their arrival card
  if (!profile?.onboardingCompleted) {
    return (
      <main className={styles.page}>
        <Navbar
          rightAction={
            <Link className="btn btn-ghost" href="/">
              Back home
            </Link>
          }
        />
        <div className={styles.setupShell}>
          <div className={styles.setupCard}>
            <div className={styles.setupStamp}>
              <span>Arrival card · Step 01</span>
              <span>Dearly Us ♡</span>
            </div>
            <div className={styles.setupBody}>
              <section className={styles.setupStory}>
                <div className={styles.eyebrow}>Your side of the story</div>
                <h1>Let&apos;s make this feel like yours.</h1>
                <p>
                  Begin with the small details that help your person feel close,
                  wherever tonight finds you both.
                </p>
                <div className={styles.setupJourney} aria-label="Setup journey">
                  <div className={styles.setupJourneyActive}>
                    <b>01</b>
                    <span>
                      <strong>Your place</strong>
                      <small>Name, city and local time</small>
                    </span>
                  </div>
                  <div>
                    <b>02</b>
                    <span>
                      <strong>Your person</strong>
                      <small>A private invitation for one</small>
                    </span>
                  </div>
                  <div>
                    <b>03</b>
                    <span>
                      <strong>Your space</strong>
                      <small>Moments kept between you two</small>
                    </span>
                  </div>
                </div>
                <div className={styles.setupPromise}>
                  <span aria-hidden="true">♡</span>
                  Your profile stays private to your shared space.
                </div>
              </section>

              <section className={styles.setupFormPanel}>
                {notice && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`${styles.notice} ${notice.kind === 'error' ? styles.noticeError : styles.noticeSuccess}`}
                  >
                    {notice.text}
                  </div>
                )}
                <div className={styles.onboardingAvatar}>
                  <div className={styles.avatar}>
                    <Avatar
                      url={profile?.avatarUrl}
                      name={displayName || 'You'}
                    />
                  </div>
                  <div>
                    <strong>
                      {displayName.trim() || 'Your Dearly Us portrait'}
                    </strong>
                    <span>
                      {profile?.avatarUrl
                        ? 'Your Google photo is ready.'
                        : 'Your initials will hold this place for now.'}
                    </span>
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="profile-name">Your display name</label>
                    <input
                      id="profile-name"
                      className={styles.input}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="What should we call you?"
                      maxLength={60}
                      autoComplete="name"
                      aria-invalid={profileAttempted && !displayName.trim()}
                    />
                    {profileAttempted && !displayName.trim() && (
                      <small className={styles.fieldError}>
                        Add the name your person knows you by.
                      </small>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="profile-city">Your city</label>
                    <input
                      id="profile-city"
                      className={styles.input}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Where are you tonight?"
                      maxLength={80}
                      autoComplete="address-level2"
                      aria-invalid={profileAttempted && !city.trim()}
                    />
                    {profileAttempted && !city.trim() && (
                      <small className={styles.fieldError}>
                        Add your city so your clocks feel personal.
                      </small>
                    )}
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="profile-timezone">Your timezone</label>
                  <input
                    id="profile-timezone"
                    className={styles.input}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="e.g. America/New_York or Asia/Kolkata"
                    maxLength={80}
                    spellCheck={false}
                  />
                  <div className={styles.help}>
                    Suggested from this device. You can change it anytime.
                  </div>
                </div>
                <div className={styles.formActions}>
                  <span>Next, you&apos;ll create or join your space.</span>
                  <button
                    className={styles.setupSubmit}
                    onClick={handleSaveProfile}
                    disabled={busy === 'profile'}
                  >
                    {busy === 'profile'
                      ? 'Saving your place…'
                      : 'Save my place'}
                    <i aria-hidden="true">→</i>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const inviteUrl =
    space?.invite && typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${space.invite.code}`
      : '';

  return (
    <div className={styles.page}>
      <Navbar roomCode={space?.activeRoomCode || undefined} />

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>Your private corner for two</div>
          <h1 className={styles.heroTitle}>
            Welcome to <span>{space?.name || 'Our Space'}</span>
          </h1>
          <p className={styles.heroCopy}>
            Your account, your person, and every little date-night keepsake—held
            together in one warm, private place.
          </p>

          {/* Quick Metrics Ribbon */}
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statIcon}>⏳</span>
              <div>
                <div className={styles.statValue}>
                  {space?.createdAt
                    ? `${Math.max(1, Math.floor((Date.now() - new Date(space.createdAt).getTime()) / 86400000))}d`
                    : '1d'}
                </div>
                <div className={styles.statLabel}>Days in sanctuary</div>
              </div>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statIcon}>💌</span>
              <div>
                <div className={styles.statValue}>{keepsakes.length}</div>
                <div className={styles.statLabel}>Keepsakes in vault</div>
              </div>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statIcon}>✨</span>
              <div>
                <div className={styles.statValue}>{milestones.length}/7</div>
                <div className={styles.statLabel}>Constellation stars</div>
              </div>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statIcon}>🌹</span>
              <div>
                <div className={styles.statValue}>
                  {preferences?.preferredMood
                    ? preferences.preferredMood.charAt(0).toUpperCase() +
                      preferences.preferredMood.slice(1)
                    : 'Romantic'}
                </div>
                <div className={styles.statLabel}>Date night rhythm</div>
              </div>
            </div>
          </div>

          {/* Glassmorphic Sanctuary Action Controls */}
          <div className={styles.actionControls}>
            <Link
              href="/photobooth"
              className="glass-btn glass-btn-light"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--ink)',
                border: '1px solid rgba(244, 114, 182, 0.35)',
                boxShadow: '0 4px 14px rgba(244, 114, 182, 0.12)',
              }}
            >
              <span>📸</span> Open Photobooth
            </Link>
            <button
              type="button"
              onClick={handleStartRoom}
              className="glass-btn glass-btn-light"
              style={{
                background:
                  'linear-gradient(135deg, rgba(244, 114, 182, 0.15), rgba(96, 165, 250, 0.15))',
                color: 'var(--ink)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                boxShadow: '0 4px 14px rgba(96, 165, 250, 0.12)',
              }}
            >
              <span>▷</span>{' '}
              {space?.activeRoomCode
                ? `Enter Room (${space.activeRoomCode})`
                : 'Enter Date Room'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rituals')}
              className="glass-btn glass-btn-light"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <span>✨</span> Daily Ritual
            </button>
            <Link
              href="/activity"
              className="glass-btn glass-btn-light"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              <span>🎲</span> Explore Activities
            </Link>
          </div>
        </div>
      </header>

      {/* Category Filter Navigation Bar */}
      <nav className={styles.filterBar} aria-label="Sanctuary sections">
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          ✨ All Sanctuary
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'keepsakes' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('keepsakes')}
        >
          💌 Keepsakes &amp; Sky ({keepsakes.length})
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'rituals' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('rituals')}
        >
          🕰️ Rhythms &amp; Bridge
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'settings' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings &amp; Privacy
        </button>
      </nav>

      <main className={styles.content}>
        {notice && (
          <div
            className={`${styles.notice} ${notice.kind === 'error' ? styles.noticeError : styles.noticeSuccess}`}
            role="status"
          >
            {notice.text}
          </div>
        )}

        {/* Cupidot Shared Pet & Living Home Area */}
        {activeTab === 'all' && (
          <CupidotHomeArea
            partnerA={ownMember?.displayName || profile.displayName}
            partnerB={partner?.displayName || 'Your person'}
            partnerTime={partnerLocalTime}
            timezoneA={
              profile?.timezone ||
              timezone ||
              Intl.DateTimeFormat().resolvedOptions().timeZone
            }
            timezoneB={partner?.timezone}
            activeRoomCode={space?.activeRoomCode}
            keepsakes={keepsakes}
            onStartRoom={handleStartRoom}
            onInspectKeepsake={(k) => setSelectedKeepsake(k)}
            onOpenCapsuleModal={() => setCapsuleModalOpen(true)}
          />
        )}

        {/* Continue Previous Date Night Prompt */}
        {space?.activeRoomCode && !dismissedResumePrompt && (
          <section
            style={{
              background:
                'linear-gradient(135deg, rgba(225, 91, 124, 0.1), rgba(67, 126, 235, 0.12))',
              border: '1px solid rgba(225, 91, 124, 0.28)',
              borderRadius: '20px',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>✨</span>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                  Continue previous date night?
                </strong>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: '13px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  Room <strong>{space.activeRoomCode}</strong> is still waiting.
                  Pick up right where you two left off!
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                className="btn btn-primary"
                href={`/room/${space.activeRoomCode}`}
              >
                Resume Date Night ▷
              </Link>
              <button
                className="btn btn-ghost"
                onClick={() => setDismissedResumePrompt(true)}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {/* User Account Bar */}
        <section className={`${styles.card} ${styles.accountCard}`}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              <Avatar url={profile.avatarUrl} name={profile.displayName} />
            </div>
          </div>
          <div className={styles.accountMain}>
            <h2>{profile.displayName}</h2>
            <div className={styles.email}>{user.email}</div>
            <div className={styles.verified}>✦ Signed in with Google</div>
          </div>
          <div className={styles.actions}>
            <button
              className="btn btn-ghost"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Close editor' : 'Edit profile'}
            </button>
            <button className="btn btn-ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </section>

        {/* Edit Profile Panel */}
        {editing && (
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Edit your side</h2>
                <p>This follows your Google account across all devices.</p>
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Display name</label>
                <input
                  className={styles.input}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className={styles.field}>
                <label>City</label>
                <input
                  className={styles.input}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className={styles.field} style={{ gridColumn: '1/-1' }}>
                <label>Timezone</label>
                <input
                  className={styles.input}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={busy === 'profile'}
              >
                {busy === 'profile' ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>
        )}

        {/* Two Halves: Your Side & Partner/Our Space */}
        <div className={styles.gridTwo}>
          {/* Your Side Card with Live Local Clock */}
          <section className={`${styles.card} ${styles.sideCard}`}>
            <div className={styles.miniLabel}>Your side 🌸</div>
            <div className={styles.identityName}>{profile.displayName}</div>
            <div className={styles.location}>
              {profile.city || 'Add city'} · {profile.timezone || 'Local'}
            </div>
            <div className={styles.time}>{userLocalTime}</div>
            <div className={styles.help}>Your local time right now</div>
          </section>

          {/* Our Space Card / Couple Connection Card */}
          <section className={`${styles.card} ${styles.spaceCard}`}>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.miniLabel}>Our Space ♡</div>
              </div>
            </div>

            {!space ? (
              // Unpaired: Create or Join Space
              <div className={styles.spaceEmpty}>
                <h3>Make it ours.</h3>
                <p>
                  Create a private space, or enter the single-use invite code
                  your person sent you. Exactly two Google accounts share one
                  space.
                </p>
                <div className={styles.field} style={{ marginTop: 16 }}>
                  <label>Space name</label>
                  <input
                    className={styles.input}
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className={styles.choiceRow}>
                  <button
                    className="btn btn-primary"
                    disabled={Boolean(busy)}
                    onClick={handleCreateSpace}
                  >
                    {busy === 'create' ? 'Creating…' : 'Create our space'}
                  </button>
                </div>
                <div className={styles.inlineForm}>
                  <input
                    className={styles.input}
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(
                        e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase(),
                      )
                    }
                    placeholder="Paste invite code"
                    maxLength={10}
                  />
                  <button
                    className="btn btn-ghost"
                    disabled={!inviteCode || Boolean(busy)}
                    onClick={handleJoinSpace}
                  >
                    {busy === 'join' ? 'Joining…' : 'Join with invite'}
                  </button>
                </div>
              </div>
            ) : (
              // Paired / Invite Waiting
              <div className={styles.connected}>
                <h3>{space.name}</h3>
                <p>
                  {partner
                    ? 'Both sides are connected. Your private sanctuary is ready whenever date night calls.'
                    : 'Your side is ready. One private single-use invitation is waiting for your person.'}
                </p>

                {/* Partner Line showing both profiles & clocks */}
                <div className={styles.partnerLine}>
                  <div className={styles.person}>
                    <div className={styles.personAvatar}>
                      <Avatar
                        url={ownMember?.avatarUrl || profile.avatarUrl}
                        name={ownMember?.displayName || profile.displayName}
                      />
                    </div>
                    <strong>
                      {ownMember?.displayName || profile.displayName}
                    </strong>
                    <small>{ownMember?.city || profile.city}</small>
                  </div>
                  <div
                    className={styles.connection}
                    title="Tap to send a heart flutter 💖"
                    onClick={triggerHeartFlutter}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {flutterActive && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '24px',
                          pointerEvents: 'none',
                          filter:
                            'drop-shadow(0 4px 10px rgba(255, 78, 120, 0.4))',
                        }}
                      >
                        💖
                      </span>
                    )}
                  </div>
                  <div className={styles.person}>
                    <div className={styles.personAvatar}>
                      {partner ? (
                        <Avatar
                          url={partner.avatarUrl}
                          name={partner.displayName}
                        />
                      ) : (
                        '?'
                      )}
                    </div>
                    <strong>{partner?.displayName || 'Your person'}</strong>
                    <small>
                      {partner
                        ? `${partner.city} ${partnerLocalTime ? `· ${partnerLocalTime}` : ''}`
                        : 'Invite pending'}
                    </small>
                  </div>
                </div>

                {/* Waiting for partner: Invitation Card */}
                {!partner && (
                  <div className={styles.waiting}>
                    <div className={styles.invitePanel}>
                      <div>
                        <div className={styles.miniLabel}>
                          Private Invitation · Single Use
                        </div>
                        <div
                          className={styles.code}
                          style={{ margin: '10px 0' }}
                        >
                          {space.invite?.code || 'NO ACTIVE INVITE'}
                        </div>
                        {space.invite && (
                          <div className={styles.help}>
                            Valid until{' '}
                            {new Date(space.invite.expiresAt).toLocaleString()}.
                          </div>
                        )}
                      </div>
                      {inviteUrl && (
                        <div className={styles.inviteQr}>
                          <QRCodeSVG
                            text={inviteUrl}
                            size={128}
                            fgColor="#1C1924"
                            bgColor="#FFFFFF"
                          />
                        </div>
                      )}
                    </div>
                    <div className={styles.choiceRow}>
                      <button
                        className="btn btn-primary"
                        onClick={copyInviteLink}
                        disabled={!space.invite}
                      >
                        Copy invite link
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={copyInviteCode}
                        disabled={!space.invite}
                      >
                        Copy code
                      </button>
                      <button
                        className="btn btn-ghost"
                        disabled={Boolean(busy)}
                        onClick={handleRegenerateInvite}
                      >
                        {busy === 'invite'
                          ? 'Refreshing…'
                          : 'Make fresh invite'}
                      </button>
                      {space.invite && (
                        <button
                          className="btn btn-ghost"
                          disabled={Boolean(busy)}
                          onClick={handleRevokeInvite}
                        >
                          {busy === 'revoke' ? 'Revoking…' : 'Revoke invite'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Connected: Start Date Night */}
                {partner && (
                  <div className={styles.choiceRow}>
                    <button
                      className="btn btn-primary"
                      onClick={handleStartRoom}
                      disabled={Boolean(busy)}
                    >
                      {busy === 'room'
                        ? 'Opening lobby…'
                        : 'Start or continue date night ▷'}
                    </button>
                    <Link className="btn btn-ghost" href="/activity">
                      Browse activities
                    </Link>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Shared Room Status & Continue Date Night Action */}
        <section className={`${styles.card} ${styles.roomCard}`}>
          <div>
            <div className={styles.miniLabel}>
              Shared room · tonight&apos;s session
            </div>
            <div className={styles.roomCode}>
              <i className={styles.liveDot} />
              <span className={styles.code}>
                {space?.activeRoomCode || 'Create a space first'}
              </span>
              {space?.activeRoomCode && (
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    navigator.clipboard.writeText(space.activeRoomCode || '')
                  }
                >
                  Copy code
                </button>
              )}
            </div>
            <p className={styles.help}>
              Rooms power live activities. Your couple space and memories stay
              permanent even when refreshing this room.
            </p>
          </div>
          <div className={styles.actions}>
            {space?.activeRoomCode ? (
              <Link
                className="btn btn-primary"
                href={`/room/${space.activeRoomCode}`}
              >
                Enter room lobby ▷
              </Link>
            ) : space ? (
              <button
                className="btn btn-primary"
                onClick={handleStartRoom}
                disabled={Boolean(busy)}
              >
                Start date night ▷
              </button>
            ) : null}
            {space && (
              <button
                className="btn btn-ghost"
                disabled={Boolean(busy)}
                onClick={() => rotateRoom()}
              >
                {busy === 'room' ? 'Rotating…' : 'Fresh room'}
              </button>
            )}
          </div>
        </section>

        {/* Timezone Bridge */}
        {(activeTab === 'all' || activeTab === 'rituals') && (
          <TimezoneBridge
            coupleId={space?.id}
            partnerA={ownMember?.displayName || profile.displayName}
            partnerB={partner?.displayName || 'Your person'}
            timezoneA={profile.timezone || undefined}
            timezoneB={partner?.timezone || undefined}
            cityA={ownMember?.city || profile.city}
            cityB={partner?.city}
            onDateScheduled={refresh}
          />
        )}

        {/* Memory Shelf & Relationship Constellation */}
        {(activeTab === 'all' || activeTab === 'keepsakes') && (
          <>
            <section className={styles.card}>
              <div className={styles.sectionHead}>
                <div>
                  <h2>Memory shelf</h2>
                  <p>Keepsakes deliberately saved by you two.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setCapsuleModalOpen(true)}
                  >
                    Seal Capsule 📦
                  </button>
                  <Link className="btn btn-ghost" href="/photobooth">
                    Take a strip 📸
                  </Link>
                </div>
              </div>

              {memoryTimeline.length > 0 && (
                <div className={styles.memoryTimeline}>
                  <div className={styles.timelineIntro}>
                    <span>OUR STORY, AS IT HAPPENED</span>
                    <h3>Your shared timeline</h3>
                    <p>
                      Finished dates, saved creations, and relationship
                      milestones live together here.
                    </p>
                  </div>
                  <div className={styles.timelineTrack}>
                    {memoryTimeline.map((memory) => {
                      const content = (
                        <>
                          <span className={styles.timelineIcon}>
                            {memory.icon}
                          </span>
                          <span className={styles.timelineCopy}>
                            <small>
                              {new Date(memory.date).toLocaleDateString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                },
                              )}
                            </small>
                            <strong>{memory.title}</strong>
                            <em>{memory.label}</em>
                          </span>
                        </>
                      );
                      return memory.keepsake ? (
                        <button
                          key={memory.id}
                          className={styles.timelineItem}
                          onClick={() => setSelectedKeepsake(memory.keepsake)}
                        >
                          {content}
                        </button>
                      ) : (
                        <div key={memory.id} className={styles.timelineItem}>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.shelfGrid}>
                {keepsakes.length > 0 ? (
                  keepsakes.map((item) => (
                    <article
                      key={item.id}
                      className={styles.keepsake}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedKeepsake(item)}
                    >
                      <div
                        className={styles.keepsakePreview}
                        style={
                          item.previewUrl
                            ? { backgroundImage: `url(${item.previewUrl})` }
                            : undefined
                        }
                      >
                        {item.previewUrl
                          ? null
                          : KEEPSAKE_ICONS[item.kind] || '♡'}
                      </div>
                      <div className={styles.keepsakeBody}>
                        <strong>{item.title}</strong>
                        <small>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </small>
                        {item.caption && <p>{item.caption}</p>}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0 12px 12px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--pink)',
                            fontWeight: 700,
                          }}
                        >
                          Inspect keepsake ↗
                        </span>
                        <button
                          className={styles.keepsakeDelete}
                          style={{ margin: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeKeepsake(item.id);
                          }}
                          disabled={busy === `keepsake-${item.id}`}
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className={styles.emptyShelf}>
                    <div className={styles.emptyIcon}>💌</div>
                    <h3>Your first keepsake is waiting for you.</h3>
                    <p>
                      Take a photostrip, collect a passport stamp, or finish a
                      date-night activity to begin your shared shelf.
                    </p>
                    <div
                      className={styles.choiceRow}
                      style={{ justifyContent: 'center' }}
                    >
                      <button
                        className="btn btn-primary"
                        onClick={() => setCapsuleModalOpen(true)}
                      >
                        Create Date Night Capsule 📦
                      </button>
                      <Link className="btn btn-ghost" href="/photobooth">
                        Open photobooth
                      </Link>
                      <Link className="btn btn-ghost" href="/passport">
                        Open passport
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Memory Weather based only on explicitly selected moods */}
              <div style={{ marginTop: '28px' }}>
                <MemoryWeather
                  keepsakes={keepsakes}
                  preferredMood={preferences?.preferredMood || 'romantic'}
                  partnerA={ownMember?.displayName || profile.displayName}
                  partnerB={partner?.displayName || 'Your person'}
                />
              </div>
            </section>

            {/* Relationship Constellation */}
            <RelationshipConstellation
              milestones={milestones}
              partnerA={ownMember?.displayName || profile.displayName}
              partnerB={partner?.displayName || 'Your person'}
            />
          </>
        )}

        {/* Shared Rituals with Zero-Streak Guilt */}
        {(activeTab === 'all' || activeTab === 'rituals') && <SharedRituals />}

        {/* Privacy, Shared Preferences & Settings */}
        {(activeTab === 'all' || activeTab === 'settings') && (
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Privacy, settings &amp; controls</h2>
                <p>Quiet controls for your private space.</p>
              </div>
            </div>

            {/* AI Consent */}
            <div className={styles.settingsRow}>
              <div className={styles.settingsCopy}>
                <strong>AI-powered follow-ups (Cupidot)</strong>
                <p>
                  Choose whether your entered names and answers can be used for
                  personalized follow-up questions. Camera feeds, photos, and
                  hidden answers are never shared.
                </p>
              </div>
              <div style={{ maxWidth: 360 }}>
                <AiConsentToggle />
              </div>
            </div>

            {/* Shared Preferences */}
            {space && (
              <div className={styles.settingsRow}>
                <div className={styles.settingsCopy}>
                  <strong>Shared date-night defaults</strong>
                  <p>
                    These choices follow your couple space to the lobby on every
                    device.
                  </p>
                </div>
                <div className={styles.preferenceControls}>
                  <select
                    value={prefMood}
                    onChange={(e) => setPrefMood(e.target.value as any)}
                  >
                    <option value="playful">Playful 🎈</option>
                    <option value="romantic">Romantic 🌹</option>
                    <option value="deep">Deep 🌊</option>
                    <option value="cozy">Cozy ☕</option>
                  </select>
                  <select
                    value={prefDuration}
                    onChange={(e) =>
                      setPrefDuration(Number(e.target.value) as any)
                    }
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                  <label
                    style={{
                      gridColumn: '1/-1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={prefAmbient}
                      onChange={(e) => setPrefAmbient(e.target.checked)}
                    />
                    <span>Ambient audio on date nights</span>
                  </label>
                  <label
                    style={{
                      gridColumn: '1/-1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={prefReducedMotion}
                      onChange={(e) => setPrefReducedMotion(e.target.checked)}
                    />
                    <span>Reduced motion animations</span>
                  </label>
                  <button
                    className="btn btn-ghost"
                    onClick={handleSavePreferences}
                    disabled={busy === 'preferences'}
                    style={{ gridColumn: '1/-1', marginTop: '6px' }}
                  >
                    {busy === 'preferences' ? 'Saving…' : 'Save defaults'}
                  </button>
                </div>
              </div>
            )}

            {/* Data Export */}
            <div className={styles.settingsRow}>
              <div className={styles.settingsCopy}>
                <strong>Export your space data</strong>
                <p>
                  Download a complete, readable JSON archive of your space,
                  profile, preferences, milestones, and keepsake metadata.
                </p>
              </div>
              <button className="btn btn-ghost" onClick={handleExportData}>
                Download JSON export ⤓
              </button>
            </div>

            {/* Separation / Disconnect Entry Point */}
            {space && (
              <div className={styles.settingsRow}>
                <div className={styles.settingsCopy}>
                  <strong>Couple space separation</strong>
                  <p style={{ color: '#9d1738' }}>
                    Separation is a protected account action. Request it and we
                    will confirm the effect on your shared history before
                    anything changes.
                  </p>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => setDisconnectModalOpen(true)}
                  style={{ color: '#9d1738', borderColor: '#fca5a5' }}
                >
                  Request separation
                </button>
              </div>
            )}

            {/* Privacy & Account Deletion */}
            <div className={styles.settingsRow}>
              <div className={styles.settingsCopy}>
                <strong>Privacy &amp; Account lifecycle</strong>
                <p>
                  Read what is stored locally vs in Supabase, or request
                  permanent deletion of your account.
                </p>
              </div>
              <div className={styles.actions}>
                <Link className="btn btn-ghost" href="/privacy">
                  Privacy policy
                </Link>
                <Link className="btn btn-ghost" href="/privacy">
                  Account lifecycle
                </Link>
                <button className="btn btn-ghost" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Disconnect Space Confirmation Modal */}
      {disconnectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 25, 36, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: 'var(--paper-raised)',
              borderRadius: '24px',
              padding: '30px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--line)',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                color: '#9d1738',
                margin: '0 0 10px',
              }}
            >
              Disconnect couple space?
            </h3>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                lineHeight: 1.55,
              }}
            >
              Separation from <strong>{space?.name}</strong> is not performed in
              the browser. This request flow will be available once the final
              protected process and shared-history decisions are in place.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '24px',
              }}
            >
              <button
                className="btn btn-ghost"
                onClick={() => setDisconnectModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setDisconnectModalOpen(false)}
                style={{ background: '#9d1738', borderColor: '#9d1738' }}
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keepsake Detail Modal */}
      {selectedKeepsake && (
        <KeepsakeDetailModal
          keepsake={selectedKeepsake}
          onClose={() => setSelectedKeepsake(null)}
          onDeleted={() => {
            setSelectedKeepsake(null);
            refresh();
          }}
        />
      )}

      {/* Date Night Capsule Modal */}
      {capsuleModalOpen && (
        <DateNightCapsuleModal
          isOpen={capsuleModalOpen}
          onClose={() => {
            setCapsuleModalOpen(false);
            refresh();
          }}
          partnerA={ownMember?.displayName || profile.displayName}
          partnerB={partner?.displayName || 'Your person'}
          defaultMood={preferences?.preferredMood || 'romantic'}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
