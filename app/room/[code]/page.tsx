'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar, AiConsentToggle, TogetherPulse, ConnectionRibbon } from '@/components/shared';
import { QRCodeSVG } from '@/lib/qrcode';
import { sounds } from '@/lib/sound';
import { ActiveRoomProvider, useActiveRoom } from '@/contexts/ActiveRoomContext';
import { PresenceProvider, useRoomPresence } from '@/contexts/PresenceContext';
import { ActivitySessionProvider, useActivitySession } from '@/contexts/ActivitySessionContext';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import styles from './room.module.css';

const ACTIVITIES = [
  { id: 'quiz', name: 'Couple Quiz', icon: '♡', copy: 'Lock answers privately and reveal them together.' },
  { id: 'draw', name: 'Draw Together', icon: '✎', copy: 'Share one live canvas across the distance.' },
] as const;

const MOODS = [
  { id: 'playful', label: 'Playful 🎈' },
  { id: 'romantic', label: 'Romantic 🌹' },
  { id: 'deep', label: 'Deep 🌊' },
  { id: 'cozy', label: 'Cozy ☕' },
  { id: 'spontaneous', label: 'Spontaneous ⚡' },
] as const;

const DURATIONS = [15, 30, 45, 60, 90] as const;

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

function RoomLobbyInner({ code }: { code: string }) {
  const router = useRouter();
  const { user } = useSupabaseSession();
  const { profile, partner, preferences, savePreferences } = useCoupleSpace();
  const { room, isHost, loading: roomLoading, error: roomError, setReady, leaveRoom } = useActiveRoom();
  const { connectionState, partnerOnline, partnerInteraction, myInteraction, setInteraction } = useRoomPresence();
  const { startActivity, session } = useActivitySession();

  const [selectedActivity, setSelectedActivity] = useState<string>('quiz');
  const [mood, setMood] = useState<string>('playful');
  const [duration, setDuration] = useState<number>(30);
  const [ambientAudio, setAmbientAudio] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  // Synchronized countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRollingSurprise, setIsRollingSurprise] = useState(false);
  const countdownTimerRef = useRef<number | null>(null);

  // Keep dual clocks updated
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 20000);
    return () => window.clearInterval(timer);
  }, []);

  // Sync initial preferences
  useEffect(() => {
    if (preferences) {
      if (preferences.preferredMood) setMood(preferences.preferredMood);
      if (preferences.defaultDurationMinutes) setDuration(preferences.defaultDurationMinutes);
      setAmbientAudio(preferences.ambientAudioEnabled);
    }
  }, [preferences]);

  const ownMember = useMemo(() => {
    return room?.members.find((m) => m.userId === user?.id) || null;
  }, [room, user]);

  const partnerMember = useMemo(() => {
    return room?.members.find((m) => m.userId !== user?.id) || null;
  }, [room, user]);

  const userLocalTime = useMemo(() => {
    return formatLocalTime(profile?.timezone, now);
  }, [profile?.timezone, now]);

  const partnerLocalTime = useMemo(() => {
    const partnerTz = partner?.timezone;
    return partnerTz ? formatLocalTime(partnerTz, now) : undefined;
  }, [partner?.timezone, now]);

  const readyCount = room?.members.filter((m) => m.ready).length || 0;
  const bothReady = (room?.members.length ?? 0) >= 2 && readyCount >= 2;

  const handleToggleReady = async () => {
    if (!room) return;
    setBusy('ready');
    setError('');
    const nextReady = !ownMember?.ready;
    try {
      sounds.playPop();
      await setReady(nextReady);
      await setInteraction(nextReady ? 'ready' : 'idle');
    } catch {
      setError('Could not update your ready state. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const handleSurpriseUs = () => {
    sounds.playPop();
    setIsRollingSurprise(true);
    let counter = 0;
    const interval = window.setInterval(() => {
      counter++;
      const rand = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      setSelectedActivity(rand.id);
      if (counter >= 8) {
        window.clearInterval(interval);
        setIsRollingSurprise(false);
        sounds.playCelebration();
      }
    }, 100);
  };

  const triggerStartActivity = useCallback(
    async (activityId: string) => {
      try {
        await savePreferences({
          preferredMood: mood as any,
          defaultDurationMinutes: duration as any,
          ambientAudioEnabled: ambientAudio,
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        });

        if (ambientAudio) {
          sounds.startWarm(0.25);
        }

        const result = await startActivity(activityId, {
          mood,
          durationMinutes: duration,
          ambientAudioEnabled: ambientAudio,
        });

        router.push(`/${result.activityType}?room=${encodeURIComponent(code)}&session=${result.sessionId}`);
      } catch (err: any) {
        setError(err?.message || 'Activity could not start. Please refresh and try again.');
        setBusy('');
        setCountdown(null);
      }
    },
    [savePreferences, mood, duration, ambientAudio, startActivity, router, code]
  );

  const startCountdown = () => {
    if (!bothReady) return;
    setBusy('start');
    setError('');
    sounds.playCountdownBeep(true);
    setCountdown(3);

    let current = 3;
    countdownTimerRef.current = window.setInterval(() => {
      current -= 1;
      if (current > 0) {
        sounds.playCountdownBeep(true);
        setCountdown(current);
      } else {
        if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
        sounds.playCelebration();
        setCountdown(0);
        void triggerStartActivity(selectedActivity);
      }
    }, 1000);
  };

  const handleLeave = async () => {
    setBusy('leave');
    try {
      await leaveRoom();
    } finally {
      router.replace('/our-space');
    }
  };

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${code}` : '';
  const copyRoomLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine pulse state
  const pulseState = useMemo(() => {
    if (connectionState === 'reconnecting') return 'reconnecting';
    if (!partnerOnline) return 'waiting';
    if (partnerMember?.ready && ownMember?.ready) return 'ready_to_reveal';
    if (partnerMember?.ready) return 'locked_in';
    if (partnerInteraction === 'choosing') return 'choosing';
    if (partnerInteraction === 'writing') return 'writing';
    if (partnerInteraction === 'drawing') return 'drawing';
    return 'online';
  }, [connectionState, partnerOnline, partnerMember?.ready, ownMember?.ready, partnerInteraction]);

  if (roomLoading) {
    return (
      <main className={styles.loading}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '36px' }}>♡</div>
          <h2>Opening your date night lobby…</h2>
          <p style={{ color: 'var(--ink-soft)' }}>Verifying your private couple space room.</p>
        </div>
      </main>
    );
  }

  if (roomError && !room) {
    return (
      <main className={styles.loading}>
        <div style={{ maxWidth: '440px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
          <h1>Room unavailable</h1>
          <p style={{ color: 'var(--ink-soft)', margin: '12px 0 24px' }}>
            {roomError.includes('unauthorized') || roomError.includes('belong')
              ? 'This room belongs to another couple or has expired. You can only join rooms created within your couple space.'
              : roomError}
          </p>
          <Link className="btn btn-primary" href="/our-space">
            Return to Our Space
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar
        roomCode={code}
        rightAction={
          <div className={styles.navActions}>
            <button className="btn btn-ghost" onClick={() => setShareOpen((v) => !v)} style={{ fontSize: '13px' }}>
              {shareOpen ? 'Close link' : 'Share room'}
            </button>
            <button className="btn btn-ghost" onClick={handleLeave} disabled={Boolean(busy)} style={{ fontSize: '13px' }}>
              Leave lobby
            </button>
          </div>
        }
      />

      <header className={styles.hero}>
        <div className={styles.eyebrow}>Date Night Lobby · Room {code}</div>
        <h1>Meet me in the middle.</h1>
        <p>A quiet private threshold before tonight&apos;s memories begin.</p>
      </header>

      <main className={styles.content}>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {/* Share Room Card */}
        {shareOpen && (
          <section className={styles.shareCard}>
            <div>
              <div className={styles.eyebrow}>Private Room Link</div>
              <h2>Bring your person into the lobby.</h2>
              <p>
                Only your connected partner can join this room. Stranger access is rejected automatically by the database.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="btn btn-primary" onClick={copyRoomLink}>
                  {copied ? 'Copied to clipboard ✓' : 'Copy private link'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    navigator.share
                      ? navigator.share({
                          title: 'Dearly Us Date Night',
                          text: `Meet me in room ${code}`,
                          url: roomUrl,
                        })
                      : copyRoomLink()
                  }
                >
                  Share ▷
                </button>
              </div>
            </div>
            <div className={styles.qr}>
              <QRCodeSVG text={roomUrl} size={140} fgColor="#1C1924" bgColor="#FFFFFF" />
            </div>
          </section>
        )}

        {/* Connection Ribbon linking both partner avatars */}
        <ConnectionRibbon
          connected={Boolean(partner)}
          partnerOnline={partnerOnline}
          leftAvatar={
            profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: 900 }}>{initials(profile?.displayName || 'You')}</span>
            )
          }
          rightAvatar={
            partner?.avatarUrl ? (
              <img src={partner.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: 900 }}>{initials(partner?.displayName || 'Partner')}</span>
            )
          }
          leftName={profile?.displayName || 'You'}
          rightName={partner?.displayName || 'Your person'}
          leftLocation={profile?.city || 'Your city'}
          rightLocation={partner?.city || (partnerOnline ? 'Connected' : 'Waiting…')}
          leftTime={userLocalTime}
          rightTime={partnerLocalTime}
          leftReady={Boolean(ownMember?.ready)}
          rightReady={Boolean(partnerMember?.ready)}
        />

        {/* Live Together Pulse Status */}
        <div className={styles.pulseWrap}>
          <TogetherPulse state={pulseState} partnerName={partner?.displayName || 'Your person'} />
        </div>

        {/* Resumable Session Banner */}
        {room?.currentSessionId && (
          <div className={styles.resumeCard} style={{ marginTop: '20px' }}>
            <div className={styles.resumeInfo}>
              <h4>Active session in progress</h4>
              <p>You have an ongoing date night activity that can be resumed right where you left it.</p>
            </div>
            <Link
              className="btn btn-primary"
              href={`/${room.status === 'active' ? 'quiz' : 'quiz'}?room=${encodeURIComponent(code)}&session=${room.currentSessionId}`}
              style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              Resume session ▷
            </Link>
          </div>
        )}

        {/* Date Night Preferences & Activity Selection */}
        <section className={styles.panel}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.eyebrow}>Pick Tonight&apos;s Moment</div>
              <h2>What are you two feeling?</h2>
            </div>
            <span>
              {readyCount}/2 Ready {bothReady && '✓'}
            </span>
          </div>

          <div className={styles.activityGrid}>
            {ACTIVITIES.map((act) => (
              <button
                key={act.id}
                className={`${styles.activity} ${selectedActivity === act.id ? styles.activitySelected : ''}`}
                onClick={() => {
                  sounds.playPop();
                  setSelectedActivity(act.id);
                }}
              >
                <span>{act.icon}</span>
                <strong>{act.name}</strong>
                <small>{act.copy}</small>
              </button>
            ))}

            <button
              className={`${styles.activity} ${styles.surpriseBtn} ${isRollingSurprise ? styles.surpriseBtnRolling : ''}`}
              onClick={handleSurpriseUs}
              disabled={isRollingSurprise}
              title="Click to randomly pick an activity with a fun roll!"
            >
              <span>🎲</span>
              <strong>Surprise us!</strong>
              <small>{isRollingSurprise ? 'Rolling the dice…' : 'Let Dearly Us choose your moment tonight.'}</small>
            </button>
          </div>

          <div className={styles.preferences}>
            <label>
              Mood tonight
              <select value={mood} onChange={(e) => setMood(e.target.value)}>
                {MOODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Duration together
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.checkPreference}>
              <input
                type="checkbox"
                checked={ambientAudio}
                onChange={(e) => {
                  setAmbientAudio(e.target.checked);
                  if (e.target.checked) sounds.playPop();
                }}
              />
              <span>Optional shared ambient sound during date night</span>
            </label>
          </div>

          <div className={styles.consent}>
            <strong>Cupidot AI Follow-ups Consent</strong>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '0 0 10px' }}>
              Personalized follow-ups use only shared answers. Private answers and images are never sent.
            </p>
            <AiConsentToggle />
          </div>

          <div className={styles.actions}>
            <button
              className="btn btn-ghost"
              onClick={handleToggleReady}
              disabled={Boolean(busy)}
              style={{ fontSize: '14px', minWidth: '150px' }}
            >
              {ownMember?.ready ? 'I need a moment ⏸' : 'I’m ready ♡'}
            </button>

            <button
              className="btn btn-primary"
              onClick={startCountdown}
              disabled={!bothReady || Boolean(busy) || countdown !== null}
              style={{ fontSize: '14px', padding: '10px 24px' }}
            >
              {countdown !== null
                ? 'Starting…'
                : bothReady
                ? `Start ${ACTIVITIES.find((a) => a.id === selectedActivity)?.name || 'Date'} →`
                : 'Waiting for both hearts to be ready'}
            </button>
          </div>
        </section>
      </main>

      {/* Synchronized Countdown Overlay */}
      {countdown !== null && (
        <div className={styles.countdownOverlay} role="dialog" aria-modal="true">
          <div className={styles.countdownNumber}>{countdown > 0 ? countdown : '♡'}</div>
          <div className={styles.countdownSubtitle}>
            {countdown > 0 ? 'Getting cozy…' : `Starting ${ACTIVITIES.find((a) => a.id === selectedActivity)?.name}!`}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomLobbyPage() {
  const params = useParams<{ code: string }>();
  const code = String(params?.code || '').replace(/[^a-z0-9]/gi, '').toUpperCase();

  return (
    <ActiveRoomProvider initialRoomCode={code}>
      <PresenceProvider>
        <ActivitySessionProvider>
          <RoomLobbyInner code={code} />
        </ActivitySessionProvider>
      </PresenceProvider>
    </ActiveRoomProvider>
  );
}
