'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Navbar, AiConsentToggle } from '@/components/shared';
import { getSupabase } from '@/lib/supabase';
import { useCoupleProfile } from '@/lib/couple';
import {
  type AccountProfile, type CoupleSpace, type Keepsake,
  createCoupleSpace, createDateRoom, joinCoupleSpace, loadAccount, profileFromUser,
  regenerateInvite, rotateRoom, saveAccountProfile,
} from '@/lib/account';
import styles from './profile.module.css';

const KEEPSAKE_ICONS: Record<Keepsake['kind'], string> = {
  photostrip: '📸', passport: '💮', receipt: '🧾', letter: '💌', scrapbook: '📖', activity: '♡',
};

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('already belong')) return 'This Google account is already connected to a couple space.';
  if (message.includes('invalid or expired')) return 'That invite has expired or is not valid. Ask your partner for a fresh one.';
  if (message.includes('already has two')) return 'That space already has both partners connected.';
  return 'Something did not save. Please try again in a moment.';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '♡';
}

function Avatar({ url, name }: { url?: string | null; name: string }) {
  return url ? <img src={url} alt={`${name}'s Google profile`} /> : <>{initials(name)}</>;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateProfile } = useCoupleProfile();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [space, setSpace] = useState<CoupleSpace | null>(null);
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('');
  const [spaceName, setSpaceName] = useState('Our Space');
  const [inviteCode, setInviteCode] = useState(searchParams.get('invite')?.replace(/[^a-z0-9]/gi, '').toUpperCase() || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [now, setNow] = useState(() => new Date());

  const syncLocalCouple = useCallback((nextProfile: AccountProfile, nextSpace: CoupleSpace | null) => {
    const partner = nextSpace?.members.find((member) => member.id !== nextProfile.id);
    updateProfile({
      partnerA: nextProfile.displayName || 'You', cityA: nextProfile.city || '',
      partnerB: partner?.displayName || 'Your person', cityB: partner?.city || '',
      roomCode: nextSpace?.activeRoomCode || '',
    });
  }, [updateProfile]);

  const refresh = useCallback(async (activeUser: User) => {
    const account = await loadAccount(activeUser);
    setProfile(account.profile);
    setDisplayName(account.profile.displayName);
    setCity(account.profile.city);
    setTimezone(account.profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    setSpace(account.space);
    setKeepsakes(account.keepsakes);
    syncLocalCouple(account.profile, account.space);
  }, [syncLocalCouple]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setNotice({ kind: 'error', text: 'Supabase is not configured for this build.' });
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) {
        router.replace(`/login?next=${encodeURIComponent(`/profile${window.location.search}`)}`);
        return;
      }
      setUser(data.user);
      try {
        await refresh(data.user);
      } catch (loadError) {
        const fallback = profileFromUser(data.user);
        setProfile(fallback);
        setDisplayName(fallback.displayName);
        setTimezone(fallback.timezone);
        setNotice({ kind: 'error', text: friendlyError(loadError) });
      } finally {
        setLoading(false);
      }
    });
  }, [refresh, router]);

  const run = async (label: string, action: () => Promise<void>, success?: string) => {
    setBusy(label);
    setNotice(null);
    try {
      await action();
      if (success) setNotice({ kind: 'success', text: success });
    } catch (error) {
      setNotice({ kind: 'error', text: friendlyError(error) });
    } finally {
      setBusy('');
    }
  };

  const saveProfile = async () => {
    if (!user || !profile || !displayName.trim() || !city.trim()) {
      setNotice({ kind: 'error', text: 'Add your name and city before continuing.' });
      return;
    }
    const firstSave = !profile.onboardingCompleted;
    await run('profile', async () => {
      await saveAccountProfile(user, { displayName, city, timezone });
      await refresh(user);
      setEditing(false);
    }, firstSave ? 'Welcome to your Dearly Us space.' : 'Your side is up to date.');
  };

  const updateSpace = async (label: string, action: () => Promise<CoupleSpace>, success: string) => {
    if (!user || !profile) return;
    await run(label, async () => {
      const nextSpace = await action();
      setSpace(nextSpace);
      syncLocalCouple(profile, nextSpace);
    }, success);
  };

  const copyInvite = async () => {
    if (!space?.invite) return;
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${space.invite.code}`);
    setNotice({ kind: 'success', text: 'Private invite link copied. Send it only to your person.' });
  };

  const openDateNight = async () => {
    await run('room', async () => {
      const room = await createDateRoom();
      updateProfile({ roomCode: room.code });
      router.push(`/room/${room.code}`);
    });
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace('/');
  };

  const currentTime = useMemo(() => {
    try { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone || undefined }).format(now); }
    catch { return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  }, [now, timezone]);

  if (loading) return <div className={styles.loading}>Opening your space…</div>;
  if (!user || !profile) return <div className={styles.loading}>Taking you to Google sign-in…</div>;

  if (!profile.onboardingCompleted) {
    return (
      <main className={styles.page}>
        <Navbar rightAction={<Link className="btn btn-ghost" href="/">Back home</Link>} />
        <div className={styles.setupShell}>
          <div className={styles.setupCard}>
            <div className={styles.setupStamp}><span>Arrival card · Step 01</span><span>Dearly Us ♡</span></div>
            <div className={styles.setupBody}>
              <div className={styles.eyebrow}>Your side of the story</div>
              <h1>Let&apos;s make this feel like yours.</h1>
              <p>Start with you. Your person can join through a private invitation after your profile is ready.</p>
              {notice && <div className={`${styles.notice} ${notice.kind === 'error' ? styles.noticeError : styles.noticeSuccess}`}>{notice.text}</div>}
              <div className={styles.formGrid} style={{ marginTop: 20 }}>
                <div className={styles.field}><label>Your display name</label><input className={styles.input} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="What should we call you?" maxLength={60} /></div>
                <div className={styles.field}><label>Your city</label><input className={styles.input} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Where are you tonight?" maxLength={80} /></div>
              </div>
              <div className={styles.field} style={{ marginTop: 16 }}><label>Your timezone</label><input className={styles.input} value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Kolkata" /><div className={styles.help}>Suggested automatically from this device. You can change it anytime.</div></div>
              <div className={styles.formActions}><button className="btn btn-primary" onClick={saveProfile} disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving your place…' : 'Save and enter my space →'}</button></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const partner = space?.members.find((member) => member.id !== user.id);
  const ownMember = space?.members.find((member) => member.id === user.id);

  return (
    <div className={styles.page}>
      <Navbar roomCode={space?.activeRoomCode || undefined} />
      <header className={styles.hero}><div className={styles.heroInner}><div className={styles.eyebrow}>Your private corner for two</div><h1 className={styles.heroTitle}>Welcome to <span>{space?.name || 'My Space'}</span></h1><p className={styles.heroCopy}>Your account, your person, and every little date-night keepsake—held together in one warm, private place.</p></div></header>

      <main className={styles.content}>
        {notice && <div className={`${styles.notice} ${notice.kind === 'error' ? styles.noticeError : styles.noticeSuccess}`} role="status">{notice.text}</div>}

        <section className={`${styles.card} ${styles.accountCard}`}>
          <div className={styles.avatarWrap}><div className={styles.avatar}><Avatar url={profile.avatarUrl} name={profile.displayName} /></div></div>
          <div className={styles.accountMain}><h2>{profile.displayName}</h2><div className={styles.email}>{user.email}</div><div className={styles.verified}>✦ Signed in with Google</div></div>
          <div className={styles.actions}><button className="btn btn-ghost" onClick={() => setEditing((value) => !value)}>{editing ? 'Close editor' : 'Edit profile'}</button><button className="btn btn-ghost" onClick={signOut}>Sign out</button></div>
        </section>

        {editing && <section className={styles.card}>
          <div className={styles.sectionHead}><div><h2>Edit your side</h2><p>This follows your Google account across devices.</p></div></div>
          <div className={styles.formGrid}>
            <div className={styles.field}><label>Display name</label><input className={styles.input} value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} /></div>
            <div className={styles.field}><label>City</label><input className={styles.input} value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} /></div>
            <div className={styles.field}><label>Timezone</label><input className={styles.input} value={timezone} onChange={(event) => setTimezone(event.target.value)} /></div>
          </div>
          <div className={styles.formActions}><button className="btn btn-primary" onClick={saveProfile} disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving…' : 'Save changes'}</button></div>
        </section>}

        <div className={styles.gridTwo}>
          <section className={`${styles.card} ${styles.sideCard}`}><div className={styles.miniLabel}>Your side 🌸</div><div className={styles.identityName}>{profile.displayName}</div><div className={styles.location}>{profile.city || 'Add your city'} · {profile.timezone || 'Local timezone'}</div><div className={styles.time}>{currentTime}</div><div className={styles.help}>Your local time right now</div></section>

          <section className={`${styles.card} ${styles.spaceCard}`}>
            <div className={styles.sectionHead}><div><div className={styles.miniLabel}>Our Space ♡</div></div></div>
            {!space ? <div className={styles.spaceEmpty}>
              <h3>Make it ours.</h3><p>Create a private space, or enter the invitation your person sent you. Each space holds exactly two Google accounts.</p>
              <div className={styles.field} style={{ marginTop: 16 }}><label>Space name</label><input className={styles.input} value={spaceName} onChange={(event) => setSpaceName(event.target.value)} maxLength={80} /></div>
              <div className={styles.choiceRow}><button className="btn btn-primary" disabled={Boolean(busy)} onClick={() => updateSpace('create', () => createCoupleSpace(spaceName), 'Your space is ready. Now invite your person.')}>{busy === 'create' ? 'Creating…' : 'Create our space'}</button></div>
              <div className={styles.inlineForm}><input className={styles.input} value={inviteCode} onChange={(event) => setInviteCode(event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())} placeholder="Paste invite code" maxLength={10} /><button className="btn btn-ghost" disabled={!inviteCode || Boolean(busy)} onClick={() => updateSpace('join', () => joinCoupleSpace(inviteCode), 'You are connected. Welcome to your shared space.')}>{busy === 'join' ? 'Joining…' : 'Join with invite'}</button></div>
            </div> : <div className={styles.connected}>
              <h3>{space.name}</h3><p>{partner ? 'Both sides are connected. Your private space is ready whenever date night calls.' : 'Your side is ready. One private invitation is waiting for your person.'}</p>
              <div className={styles.partnerLine}>
                <div className={styles.person}><div className={styles.personAvatar}><Avatar url={ownMember?.avatarUrl || profile.avatarUrl} name={ownMember?.displayName || profile.displayName} /></div><strong>{ownMember?.displayName || profile.displayName}</strong><small>{ownMember?.city || profile.city}</small></div>
                <div className={styles.connection} />
                <div className={styles.person}><div className={styles.personAvatar}>{partner ? <Avatar url={partner.avatarUrl} name={partner.displayName} /> : '?'}</div><strong>{partner?.displayName || 'Your person'}</strong><small>{partner?.city || 'Invite pending'}</small></div>
              </div>
              {!partner && <div className={styles.waiting}><div className={styles.miniLabel}>Private invitation · valid for 7 days</div><div className={styles.code} style={{ margin: '11px 0' }}>{space.invite?.code || 'GENERATE'}</div><div className={styles.choiceRow}><button className="btn btn-primary" onClick={copyInvite} disabled={!space.invite}>Copy invite link</button><button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => updateSpace('invite', regenerateInvite, 'A fresh private invitation is ready.')}>{busy === 'invite' ? 'Refreshing…' : 'Make a fresh invite'}</button></div></div>}
              {partner && <div className={styles.choiceRow}><button className="btn btn-primary" onClick={openDateNight} disabled={Boolean(busy)}>{busy === 'room' ? 'Opening your lobby…' : 'Start or continue date night ▷'}</button><Link className="btn btn-ghost" href="/activity">Browse activities</Link></div>}
            </div>}
          </section>
        </div>

        <section className={`${styles.card} ${styles.roomCard}`}>
          <div><div className={styles.miniLabel}>Shared room · tonight&apos;s session</div><div className={styles.roomCode}><i className={styles.liveDot} /><span className={styles.code}>{space?.activeRoomCode || 'Create a space first'}</span>{space?.activeRoomCode && <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(space.activeRoomCode || '')}>Copy code</button>}</div><p className={styles.help}>Rooms power live activities. Your Google account and couple space stay permanent even when you refresh this code.</p></div>
          <div className={styles.actions}>{space && <button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => updateSpace('room', rotateRoom, 'A fresh room is ready for tonight.')}>{busy === 'room' ? 'Making room…' : 'Fresh room'}</button>}<Link className="btn btn-primary" href="/activity">Open activities</Link></div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHead}><div><h2>Memory shelf</h2><p>Real keepsakes saved by you and your person will live here.</p></div><Link className="btn btn-ghost" href="/photobooth">Take a strip 📸</Link></div>
          <div className={styles.shelfGrid}>{keepsakes.length ? keepsakes.map((item) => <Link key={item.id} className={styles.keepsake} href={item.activityPath || '#'}><div className={styles.keepsakePreview} style={item.previewUrl ? { backgroundImage: `url(${item.previewUrl})` } : undefined}>{item.previewUrl ? null : KEEPSAKE_ICONS[item.kind]}</div><div className={styles.keepsakeBody}><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleDateString()}</small></div></Link>) : <div className={styles.emptyShelf}><div className={styles.emptyIcon}>💌</div><h3>Your first keepsake is waiting for you.</h3><p>Take a photostrip, collect a passport stamp, or finish a date-night activity to begin your shared shelf.</p><div className={styles.choiceRow} style={{ justifyContent: 'center' }}><Link className="btn btn-primary" href="/photobooth">Open photobooth</Link><Link className="btn btn-ghost" href="/passport">Open passport</Link><Link className="btn btn-ghost" href="/activity">Browse dates</Link></div></div>}</div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHead}><div><h2>Privacy & settings</h2><p>Quiet controls for your private space.</p></div></div>
          <div className={styles.settingsRow}><div className={styles.settingsCopy}><strong>AI-powered follow-ups</strong><p>Choose whether your entered names and answers can be sent to Google Gemini for personalised questions. Camera feeds and photos are never included.</p></div><div style={{ maxWidth: 360 }}><AiConsentToggle /></div></div>
          <div className={styles.settingsRow}><div className={styles.settingsCopy}><strong>Your data</strong><p>Read what is stored locally, what is saved in Supabase, and how shared-room events work.</p></div><Link className="btn btn-ghost" href="/privacy">Privacy policy</Link></div>
          <div className={styles.settingsRow}><div className={styles.settingsCopy}><strong>Account controls</strong><p>Sign out on this device or request permanent deletion of your account and shared data.</p></div><div className={styles.actions}><a className="btn btn-ghost" href="mailto:hello@dearlyus.love?subject=Delete%20my%20Dearly%20Us%20account">Request deletion</a><button className="btn btn-ghost" onClick={signOut}>Sign out</button></div></div>
        </section>
      </main>
    </div>
  );
}
