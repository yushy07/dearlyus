'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/shared';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { createDateRoom } from '@/lib/account';
import { LocationSelector, type ProfileLocation } from '@/components/profile/LocationSelector';
import styles from './our-space.module.css';

const activityPicks = [
  { href: '/photobooth', icon: '📸', title: 'Take four photos', note: 'One strip, two places' },
  { href: '/cards', icon: '💌', title: 'Open an honest card', note: 'A softer conversation' },
  { href: '/dare', icon: '🍾', title: 'Spin the bottle', note: 'Truth or dare together' },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '♡';
}

function localTime(timezone?: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone || undefined }).format(new Date());
  } catch { return 'Local time'; }
}

export default function OurSpacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useSupabaseSession();
  const { status, profile, space, partner, ownMember, keepsakes, loading, error, refresh, saveProfile, createSpace, joinSpace, regenerateInvite } = useCoupleSpace();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [timezone, setTimezone] = useState('');
  const [spaceName, setSpaceName] = useState('Our Space');
  const [inviteCode, setInviteCode] = useState('');
  const [connectionMode, setConnectionMode] = useState<'create' | 'join'>('create');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent('/our-space')}`);
  }, [authLoading, router, user]);
  useEffect(() => {
    if (!profile) return;
    setName(profile.displayName); setCity(profile.city); setCountry(profile.country || ''); setCountryCode(profile.countryCode || '');
    setStateRegion(profile.state || ''); setStateCode(profile.stateCode || ''); setLatitude(profile.latitude); setLongitude(profile.longitude);
    setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [profile]);
  useEffect(() => {
    const incoming = searchParams.get('invite');
    if (!incoming) return;
    setInviteCode(incoming.replace(/[^a-z0-9]/gi, '').toUpperCase()); setConnectionMode('join');
  }, [searchParams]);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedLocation: ProfileLocation = { country, countryCode, state: stateRegion, stateCode, city, latitude, longitude };
  const updateLocation = (next: ProfileLocation) => { setCountry(next.country); setCountryCode(next.countryCode); setStateRegion(next.state); setStateCode(next.stateCode); setCity(next.city); setLatitude(next.latitude); setLongitude(next.longitude); };

  const inviteUrl = useMemo(() => !space?.invite || typeof window === 'undefined' ? '' : `${window.location.origin}/invite/${space.invite.code}`, [space?.invite]);
  const run = async (key: string, task: () => Promise<unknown>, success: string) => {
    setBusy(key); setNotice('');
    try { await task(); setNotice(success); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message.replace(/^\[[^\]]+\]\s*/, '') : 'Something interrupted the connection. Please try again.'); }
    finally { setBusy(''); }
  };
  const copyInvite = async () => { if (inviteUrl) { await navigator.clipboard.writeText(inviteUrl); setNotice('Invitation copied. Send it to your person.'); } };
  const startDate = () => run('room', async () => { const room = await createDateRoom(); router.push(`/room/${room.code}`); }, 'Opening your date…');

  if (authLoading || loading || !user) return <main className={styles.loading}><span>♡</span><h1>Opening your place…</h1><p>Finding the last page you shared.</p></main>;
  if (status === 'recoverable_error' && !profile) return <main className={styles.loading}><span>♡</span><h1>Your space is still safe.</h1><p>{error || 'We could not reach it just now.'}</p><button onClick={() => void refresh()}>Try again</button></main>;

  if (!profile?.onboardingCompleted) return <main className={styles.page}><Navbar /><section className={styles.arrival}>
    <div className={styles.arrivalStory}><span className={styles.kicker}>01 · Your place in the story</span><h1>Before it becomes <em>ours</em>, make it yours.</h1><p>Three small details help your person recognize you and keep both of your clocks honest.</p><ol><li className={styles.activeStep}>Your place</li><li>Your person</li><li>Our space</li></ol></div>
    <div className={styles.paperForm}><div className={styles.portrait}>{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Your Google profile" /> : initials(name)}</div><label>Your name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label><LocationSelector value={selectedLocation} onChange={updateLocation} idPrefix="our-space-profile" /><label>Your timezone<input value={timezone} onChange={(e) => setTimezone(e.target.value)} maxLength={80} /></label>{notice && <p className={styles.notice}>{notice}</p>}<button className={styles.primary} onClick={() => void run('profile', () => saveProfile({ displayName: name, city, timezone, country, countryCode, state: stateRegion, stateCode, latitude, longitude }), 'Your place is saved.')} disabled={busy !== '' || !name.trim() || !countryCode || !city.trim() || !timezone.trim()}>{busy === 'profile' ? 'Saving your place…' : 'Save and continue'} <span>→</span></button></div>
  </section></main>;

  if (!space) return <main className={styles.page}><Navbar /><section className={styles.connectShell}>
    <header><span className={styles.kicker}>02 · Bring your person closer</span><h1>How are you meeting here?</h1><p>Create the space and invite them, or enter the invitation they sent you.</p></header>
    <div className={styles.modeTabs} role="tablist"><button className={connectionMode === 'create' ? styles.selected : ''} onClick={() => setConnectionMode('create')}>I’m creating our space</button><button className={connectionMode === 'join' ? styles.selected : ''} onClick={() => setConnectionMode('join')}>I have an invitation</button></div>
    <section className={styles.connectionPaper}>{connectionMode === 'create' ? <><div className={styles.connectionMark}>♡</div><h2>Name your little corner.</h2><p>You can change this later. Only the two of you will see it.</p><label>Space name<input value={spaceName} onChange={(e) => setSpaceName(e.target.value)} maxLength={80} /></label><button className={styles.primary} onClick={() => void run('create', () => createSpace(spaceName), 'Your private space is ready.')} disabled={busy !== '' || !spaceName.trim()}>{busy === 'create' ? 'Making it yours…' : 'Create our space'} <span>→</span></button></> : <><div className={styles.connectionMark}>✉</div><h2>Open their invitation.</h2><p>Paste the private code from your person. Spaces are shared by exactly two accounts.</p><label>Invitation code<input className={styles.codeInput} value={inviteCode} onChange={(e) => setInviteCode(e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())} maxLength={10} placeholder="XXXXXXXXXX" /></label><button className={styles.primary} onClick={() => void run('join', () => joinSpace(inviteCode), 'You are connected. Welcome in.')} disabled={busy !== '' || inviteCode.length < 6}>{busy === 'join' ? 'Connecting you two…' : 'Join our space'} <span>→</span></button></>}{notice && <p className={styles.notice}>{notice}</p>}</section>
  </section></main>;

  if (!partner) return <main className={styles.page}><Navbar /><section className={styles.waitingRoom}>
    <header><span className={styles.kicker}>Your invitation lounge</span><h1>Your side is ready.<br /><em>Save their seat.</em></h1><p>Send one private invitation. This page will welcome them automatically when they arrive.</p></header>
    <div className={styles.twoSeats}><article className={styles.personCard}><div className={styles.avatar}>{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(profile.displayName)}</div><span>You’re here</span><h2>{profile.displayName}</h2><p>{profile.city} · {now ? localTime(profile.timezone) : 'Loading local time…'}</p></article><div className={styles.heartLine}><span>♡</span></div><article className={`${styles.personCard} ${styles.emptySeat}`}><div className={styles.avatar}>?</div><span>Seat saved</span><h2>Your person</h2><p>Waiting for their arrival</p></article></div>
    <section className={styles.inviteTicket}><div><span>Private invitation · one person</span><strong>{space.invite?.code || 'No active code'}</strong><small>{space.invite ? `Available until ${new Date(space.invite.expiresAt).toLocaleString()}` : 'Create a fresh invitation to continue.'}</small></div><div className={styles.ticketActions}><button className={styles.primary} onClick={copyInvite} disabled={!inviteUrl}>Copy invitation</button><button onClick={() => void run('invite', regenerateInvite, 'A fresh invitation is ready.')} disabled={busy !== ''}>{busy === 'invite' ? 'Preparing…' : 'Make a fresh code'}</button></div></section>{notice && <p className={styles.notice}>{notice}</p>}
  </section></main>;

  return <main className={styles.page}><Navbar /><section className={styles.dashboard}>
    <header className={styles.dashboardHero}><div><span className={styles.kicker}>Your private corner for two</span><h1>Welcome back to<br /><em>{space.name}</em></h1><p>Pick up tonight exactly where the two of you left it.</p><button className={styles.primary} onClick={startDate} disabled={busy !== ''}>{busy === 'room' ? 'Opening your room…' : 'Start or continue tonight'} <span>→</span></button></div><div className={styles.connectedPortraits}>{[ownMember || profile, partner].map((person, index) => <article key={person.id}><div className={styles.avatar}>{person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : initials(person.displayName)}</div><span>{index === 0 ? 'You' : 'Your person'}</span><h2>{person.displayName}</h2><p>{person.city} · {now ? localTime(person.timezone) : 'Loading local time…'}</p></article>)}<i>♡</i></div></header>
    <section className={styles.resumeBand}><div><span>Tonight’s room</span><h2>Both of you are here. What feels right?</h2></div><Link href="/activity">See every activity →</Link></section>
    <section className={styles.activityRow}>{activityPicks.map((item, index) => <Link href={item.href} key={item.href}><span>{String(index + 1).padStart(2, '0')}</span><i>{item.icon}</i><h3>{item.title}</h3><p>{item.note}</p><b>Open →</b></Link>)}</section>
    <section className={styles.memories}><div className={styles.sectionHeading}><div><span className={styles.kicker}>Kept between you</span><h2>Your recent little proofs.</h2></div><Link href="/profile">Settings and profile →</Link></div>{keepsakes.length ? <div className={styles.memoryGrid}>{keepsakes.slice(0, 6).map((item) => <article key={item.id}>{item.previewUrl ? <img src={item.previewUrl} alt={item.title} /> : <div>♡</div>}<span>{item.kind}</span><h3>{item.title}</h3></article>)}</div> : <div className={styles.emptyMemories}><span>♡</span><h3>Your shelf is waiting for its first memory.</h3><p>A photostrip, a letter, or a finished activity will appear here safely.</p><Link href="/photobooth">Make your first keepsake →</Link></div>}</section>
  </section></main>;
}
