'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { AiConsentToggle, Navbar } from '@/components/shared';
import { useCoupleProfile } from '@/lib/couple';
import { QRCodeSVG } from '@/lib/qrcode';
import { getSupabase } from '@/lib/supabase';
import { type DateRoom, joinDateRoom, leaveDateRoom, loadSharedPreferences, saveSharedPreferences, setDateRoomReady, startDateActivity } from '@/lib/account';
import { useRoomSync } from '@/lib/room';
import styles from './room.module.css';

const ACTIVITIES = [
  { id: 'quiz', name: 'Couple Quiz', icon: '♡', copy: 'Lock answers privately and reveal them together.' },
  { id: 'draw', name: 'Draw Together', icon: '✎', copy: 'Share one canvas across the distance.' },
] as const;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '♡';
}

export default function RoomLobbyPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = String(params?.code || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const { partnerA, updateProfile } = useCoupleProfile();
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<DateRoom | null>(null);
  const [selected, setSelected] = useState<(typeof ACTIVITIES)[number]['id']>('quiz');
  const [mood, setMood] = useState('playful');
  const [duration, setDuration] = useState(30);
  const [ambientAudio, setAmbientAudio] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const ownMember = room?.members.find((member) => member.userId === user?.id);
  const partner = room?.members.find((member) => member.userId !== user?.id);
  const { partnerOnline, connectionState } = useRoomSync({
    roomCode: code,
    senderName: ownMember?.displayName || partnerA,
    interaction: ownMember?.ready ? 'ready' : 'idle',
  });

  const refresh = useCallback(async () => {
    const nextRoom = await joinDateRoom(code);
    setRoom(nextRoom);
    updateProfile({ roomCode: nextRoom.code });
    return nextRoom;
  }, [code, updateProfile]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !code) {
      setError('This room is not available.');
      setLoading(false);
      return;
    }
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(`/room/${code}`)}`);
        return;
      }
      setUser(data.user);
      try {
        const [nextRoom, savedPreferences] = await Promise.all([refresh(), loadSharedPreferences()]);
        if (savedPreferences) {
          setMood(savedPreferences.preferredMood);
          setDuration(savedPreferences.defaultDurationMinutes);
          setAmbientAudio(savedPreferences.ambientAudioEnabled);
        }
        channel = supabase.channel(`lobby:${nextRoom.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${nextRoom.id}` }, () => { void refresh(); })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${nextRoom.id}` }, () => { void refresh(); })
          .subscribe();
      } catch {
        setError('This room expired, belongs to another couple, or is no longer available.');
      } finally {
        setLoading(false);
      }
    });
    return () => { if (channel) void supabase.removeChannel(channel); };
  }, [code, refresh, router]);

  const readyCount = room?.members.filter((member) => member.ready).length || 0;
  const bothReady = room?.members.length === 2 && readyCount === 2;
  const presenceCopy = useMemo(() => {
    if (connectionState === 'reconnecting') return 'Reconnecting your side…';
    if (connectionState === 'unavailable') return 'Room connection unavailable';
    if (partnerOnline) return 'Both hearts are here';
    return 'Waiting for your person';
  }, [connectionState, partnerOnline]);

  const toggleReady = async () => {
    if (!room) return;
    setBusy('ready'); setError('');
    try { setRoom(await setDateRoomReady(code, !ownMember?.ready)); }
    catch { setError('Your ready state could not be saved. Try again.'); }
    finally { setBusy(''); }
  };

  const start = async () => {
    if (!bothReady) return;
    setBusy('start'); setError('');
    try {
      await saveSharedPreferences({ preferredMood: mood as 'playful' | 'romantic' | 'deep' | 'cozy', defaultDurationMinutes: duration as 15 | 30 | 45 | 60 | 90, ambientAudioEnabled: ambientAudio, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
      const result = await startDateActivity(code, selected, { mood, durationMinutes: duration, ambientAudioEnabled: ambientAudio });
      router.push(`/${result.activityType}?room=${encodeURIComponent(code)}&session=${result.sessionId}`);
    } catch { setError('The activity could not start. Refresh the lobby and try again.'); setBusy(''); }
  };

  const leave = async () => {
    setBusy('leave');
    try { await leaveDateRoom(code); } finally { router.replace('/profile'); }
  };

  if (loading) return <div className={styles.loading}>Opening your date-night lobby…</div>;
  if (error && !room) return <main className={styles.loading}><div><h1>Room unavailable</h1><p>{error}</p><Link className="btn btn-primary" href="/profile">Return to Our Space</Link></div></main>;
  if (!room || !user) return null;

  const roomUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/room/${room.code}`;
  const copyRoomLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={styles.page}>
      <Navbar roomCode={room.code} rightAction={<div className={styles.navActions}><button className="btn btn-ghost" onClick={() => setShareOpen((value) => !value)}>Share room</button><button className="btn btn-ghost" onClick={leave} disabled={Boolean(busy)}>Leave lobby</button></div>} />
      <header className={styles.hero}>
        <div className={styles.eyebrow}>Date Night Lobby · Room {room.code}</div>
        <h1>Meet me in the middle.</h1>
        <p>{presenceCopy}</p>
      </header>
      <main className={styles.content}>
        {error && <div className={styles.error} role="alert">{error}</div>}
        {shareOpen && <section className={styles.shareCard}><div><div className={styles.eyebrow}>Private room link</div><h2>Bring your person into the lobby.</h2><p>Only the partner already connected to this couple space can enter—even if somebody else learns the code.</p><div className={styles.actions}><button className="btn btn-primary" onClick={copyRoomLink}>{copied ? 'Copied ✓' : 'Copy private link'}</button><button className="btn btn-ghost" onClick={() => navigator.share ? navigator.share({ title: 'Dearly Us date night', text: `Meet me in room ${room.code}`, url: roomUrl }) : copyRoomLink()}>Share</button></div></div><div className={styles.qr}><QRCodeSVG text={roomUrl} size={150} fgColor="#1C1924" bgColor="#FFFFFF" /></div></section>}
        <section className={styles.connectionCard}>
          <div className={styles.person}><div className={styles.avatar}>{ownMember?.avatarUrl ? <img src={ownMember.avatarUrl} alt="" /> : initials(ownMember?.displayName || partnerA)}</div><strong>{ownMember?.displayName || 'You'}</strong><span>{ownMember?.ready ? 'Ready ♡' : 'Getting cozy'}</span></div>
          <div className={`${styles.pulse} ${partnerOnline ? styles.pulseLive : ''}`}><i /><span>{partnerOnline ? 'Together' : 'Connecting'}</span><i /></div>
          <div className={styles.person}><div className={`${styles.avatar} ${!partnerOnline ? styles.avatarWaiting : ''}`}>{partner?.avatarUrl ? <img src={partner.avatarUrl} alt="" /> : partner ? initials(partner.displayName) : '?'}</div><strong>{partner?.displayName || 'Your person'}</strong><span>{partner?.ready ? 'Ready ♡' : partnerOnline ? 'In the lobby' : 'Waiting to arrive'}</span></div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHead}><div><div className={styles.eyebrow}>Pick tonight’s moment</div><h2>What are you two feeling?</h2></div><span>{readyCount}/2 ready</span></div>
          <div className={styles.activityGrid}>{ACTIVITIES.map((activity) => <button key={activity.id} className={`${styles.activity} ${selected === activity.id ? styles.activitySelected : ''}`} onClick={() => setSelected(activity.id)}><span>{activity.icon}</span><strong>{activity.name}</strong><small>{activity.copy}</small></button>)}</div>
          <div className={styles.preferences}>
            <label>Mood<select value={mood} onChange={(event) => setMood(event.target.value)}><option value="playful">Playful</option><option value="romantic">Romantic</option><option value="deep">Deep</option><option value="cozy">Cozy</option></select></label>
            <label>Time together<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option></select></label>
            <label className={styles.checkPreference}><input type="checkbox" checked={ambientAudio} onChange={(event) => setAmbientAudio(event.target.checked)} /> Add ambient audio</label>
          </div>
          <div className={styles.consent}><strong>Cupidot consent for this device</strong><AiConsentToggle /></div>
          <div className={styles.actions}><button className="btn btn-ghost" onClick={toggleReady} disabled={Boolean(busy)}>{ownMember?.ready ? 'I need a moment' : 'I’m ready ♡'}</button><button className="btn btn-primary" onClick={start} disabled={!bothReady || Boolean(busy)}>{busy === 'start' ? 'Starting together…' : bothReady ? `Start ${ACTIVITIES.find((item) => item.id === selected)?.name} →` : 'Waiting for both hearts'}</button></div>
        </section>
      </main>
    </div>
  );
}
