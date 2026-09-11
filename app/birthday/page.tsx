'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCoupleProfile } from '@/lib/couple';
import { CoupleNameBar, ActivityShell, Confetti } from '@/components/shared';
import { QRCodeSVG } from '@/lib/qrcode';
import { sounds } from '@/lib/sound';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { loadBirthdayGift, saveBirthdayGift, uploadBirthdayAsset } from '@/lib/activity-records';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';

interface ThemeConfig {
  id: string;
  name: string;
  icon: string;
  bg: string;
  primary: string;
  badge: string;
}

const BIRTHDAY_THEMES: ThemeConfig[] = [
  {
    id: 'carnival',
    name: 'Carnival Joy',
    icon: '🎈',
    bg: '#FFF8F0',
    primary: '#E11D48',
    badge: 'FESTIVE CELEBRATION',
  },
  {
    id: 'starlit',
    name: 'Starlit Romance',
    icon: '🌌',
    bg: '#0F172A',
    primary: '#38BDF8',
    badge: 'MIDNIGHT WHISPER',
  },
  {
    id: 'cozy',
    name: 'Cozy Memories',
    icon: '☕',
    bg: '#FAF5EE',
    primary: '#B45309',
    badge: 'WARM PARCHMENT',
  },
  {
    id: 'pastel',
    name: 'Pastel Garden',
    icon: '🌸',
    bg: '#FFF5F8',
    primary: '#FF4D80',
    badge: 'SPRING PETALS',
  },
];

export default function BirthdayPage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const { saveKeepsake, saving: keepsakeSaving } = useKeepsakeWriter();
  const { space } = useCoupleSpace();
  const { user } = useSupabaseSession();

  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(BIRTHDAY_THEMES[0]);
  const [recipient, setRecipient] = useState<'A' | 'B'>('B');
  const [customMsg, setCustomMsg] = useState(
    'Happy Birthday my love! Even with miles between us today, you are the warmest thing in my life. Every day loving you is my greatest gift.',
  );
  const [giftVoucher, setGiftVoucher] = useState('Good for 1 uninterrupted evening together & breakfast in bed 🥞');
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [keepsakeSaved, setKeepsakeSaved] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [revealAt, setRevealAt] = useState('');
  const [revoked, setRevoked] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<'idle' | 'uploading' | 'ready' | 'failed'>('idle');
  const [giftLoaded, setGiftLoaded] = useState(false);
  const [giftAuthorId, setGiftAuthorId] = useState<string | null>(null);
  const [giftTouched, setGiftTouched] = useState(false);

  const birthdayPersonName = recipient === 'B' ? partnerB : partnerA;
  const authorName = recipient === 'B' ? partnerA : partnerB;

  useEffect(() => {
    if (!space?.id) return;
    setGiftLoaded(false);
    void loadBirthdayGift(space.id).then((draft) => {
      if (!draft) { setGiftLoaded(true); return; }
      const payload = draft.payload;
      setGiftAuthorId(draft.created_by);
      setSelectedTheme(BIRTHDAY_THEMES.find((theme) => theme.id === payload.theme) || BIRTHDAY_THEMES[0]);
      if (payload.recipient) setRecipient(payload.recipient);
      if (payload.message) setCustomMsg(payload.message);
      if (payload.voucher) setGiftVoucher(payload.voucher);
      setPhotoPath(payload.photoPath || null);
      setAudioPath(payload.audioPath || null);
      setPhotoUrl(draft.photoUrl);
      setAudioUrl(draft.audioUrl);
      setRevealAt(draft.target_at ? new Date(draft.target_at).toISOString().slice(0, 16) : '');
      setRevoked(draft.status === 'revoked');
      setRevealed(draft.status === 'revealed' || (draft.status === 'ready' && (!draft.target_at || new Date(draft.target_at).getTime() <= Date.now())));
      setGiftLoaded(true);
    }).catch((error) => { setGiftLoaded(true); console.error('Failed to restore birthday gift:', error); });
  }, [space?.id]);

  useEffect(() => {
    if (!space?.id || !giftLoaded || (!giftTouched && giftAuthorId !== user?.id) || (giftAuthorId && giftAuthorId !== user?.id)) return;
    const timer = setTimeout(() => void saveBirthdayGift({
      coupleId: space.id,
      title: `Birthday surprise for ${birthdayPersonName}`,
      payload: { theme: selectedTheme.id, recipient, message: customMsg, voucher: giftVoucher, photoPath, audioPath },
      status: revoked ? 'revoked' : revealed ? 'revealed' : revealAt ? 'ready' : 'draft',
      targetAt: revealAt ? new Date(revealAt).toISOString() : null,
    }).catch((error) => console.error('Failed to autosave birthday gift:', error)), 700);
    return () => clearTimeout(timer);
  }, [space?.id, selectedTheme.id, recipient, customMsg, giftVoucher, photoPath, audioPath, revealAt, revoked, revealed, birthdayPersonName, giftLoaded, giftAuthorId, giftTouched, user?.id]);

  const uploadGiftMedia = async (event: React.ChangeEvent<HTMLInputElement>, mediaKind: 'image' | 'audio') => {
    const file = event.target.files?.[0];
    if (!file || !space?.id) return;
    setMediaStatus('uploading');
    setGiftTouched(true);
    try {
      const asset = await uploadBirthdayAsset({ coupleId: space.id, file, mediaKind });
      if (mediaKind === 'image') { setPhotoPath(asset.path); setPhotoUrl(asset.signedUrl); }
      else { setAudioPath(asset.path); setAudioUrl(asset.signedUrl); }
      setMediaStatus('ready');
    } catch (error) {
      setMediaStatus('failed');
      console.error('Failed to upload birthday media:', error);
    } finally {
      event.target.value = '';
    }
  };

  const copyLink = async () => {
    try {
      const url =
        typeof window !== 'undefined'
          ? window.location.href
          : 'http://localhost:3000/birthday';
      await navigator.clipboard.writeText(url);
      setCopied(true);
      sounds.playPop();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Gift link ready! You can share this page URL.');
    }
  };

  const blowCandles = () => {
    if (candlesBlown) return;
    setCandlesBlown(true);
    sounds.playCelebration();
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3500);
  };

  const handleSaveToKeepsakes = async () => {
    if (keepsakeSaved || keepsakeSaving) return;
    sounds.playCelebration();
    try {
      await saveKeepsake({
        kind: 'activity',
        title: `Birthday Surprise · ${birthdayPersonName}'s Day`,
        activityPath: '/birthday',
        caption: `Custom celebration landing page created with ${selectedTheme.name} theme.`,
        metadata: {
          activityType: 'birthday',
          recipient: birthdayPersonName,
          author: authorName,
          theme: selectedTheme.id,
          date: new Date().toISOString(),
        },
      });
      setKeepsakeSaved(true);
    } catch (err) {
      console.error('Failed to save birthday keepsake:', err);
    }
  };

  return (
    <ActivityShell
      activityTitle="Birthday Surprise Workshop"
      activitySubtitle="Personalized Landing Page · Interactive Candles, Gift Clues & Heart QR Code"
      currentStage={revealed ? 'remember' : 'play'}
      keepsakeSummary={{
        kind: 'activity',
        title: `Birthday Gift · For ${birthdayPersonName}`,
        subtitle: `${selectedTheme.name} Celebration Page`,
        badge: '🎂 GIFT READY',
      }}
      guidancePhase={revealed ? 'revealed' : 'ready'}
      guidancePrivacyNote="Surprise pages can be designed privately, then presented or scheduled for timezone-safe delivery."
    >
      <Confetti active={confettiActive} />

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <CoupleNameBar />
          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 800,
              margin: '8px 0',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            A personalized celebration, <span className="grad">made for them</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '52ch', margin: '0 auto' }}>
            Generate a romantic birthday landing page complete with blowable interactive candles, custom voucher, and scannable QR code.
          </p>
        </div>

        {/* Theme Picker */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          {BIRTHDAY_THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => {
                setSelectedTheme(th);
                setGiftTouched(true);
                sounds.playTick();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: selectedTheme.id === th.id ? `2px solid ${th.primary}` : '1px solid var(--line)',
                background: selectedTheme.id === th.id ? '#FFF' : 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {th.icon} {th.name}
            </button>
          ))}
        </div>

        {/* WORKSHOP FORM OR RENDERED PAGE */}
        {!revealed ? (
          <div
            style={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
              display: 'grid',
              gap: '20px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: 'var(--ink-soft)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Celebrating Who?
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setRecipient('B'); setGiftTouched(true); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: recipient === 'B' ? '2px solid var(--pink)' : '1px solid var(--line)',
                      background: recipient === 'B' ? '#FFF5F8' : '#FFF',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                    }}
                  >
                    💙 {partnerB}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRecipient('A'); setGiftTouched(true); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: recipient === 'A' ? '2px solid var(--pink)' : '1px solid var(--line)',
                      background: recipient === 'A' ? '#FFF5F8' : '#FFF',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                    }}
                  >
                    🌸 {partnerA}
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: 'var(--ink-soft)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Gift Coupon / Secret Clue:
                </label>
                <input
                  type="text"
                  value={giftVoucher}
                  onChange={(e) => { setGiftVoucher(e.target.value); setGiftTouched(true); }}
                  placeholder="e.g. Good for 1 dinner date & 100 kisses..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '13.5px',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Heartfelt Birthday Message:
              </label>
              <textarea
                rows={4}
                value={customMsg}
                onChange={(e) => { setCustomMsg(e.target.value); setGiftTouched(true); }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  fontSize: '14.5px',
                  lineHeight: 1.5,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              <label className="btn btn-outline" style={{ justifyContent: 'center', cursor: 'pointer' }}>
                📷 Add private photo
                <input type="file" accept="image/*" hidden onChange={(event) => void uploadGiftMedia(event, 'image')} />
              </label>
              <label className="btn btn-outline" style={{ justifyContent: 'center', cursor: 'pointer' }}>
                🎙️ Add private audio
                <input type="file" accept="audio/*" hidden onChange={(event) => void uploadGiftMedia(event, 'audio')} />
              </label>
              <input
                type="datetime-local"
                value={revealAt}
                onChange={(event) => { setRevealAt(event.target.value); setGiftTouched(true); }}
                aria-label="Scheduled reveal time"
                style={{ border: '1px solid var(--line)', borderRadius: '10px', padding: '10px' }}
              />
            </div>
            {mediaStatus === 'uploading' && <p style={{ margin: 0, fontSize: '12px' }}>Uploading privately…</p>}
            {mediaStatus === 'failed' && <p style={{ margin: 0, color: '#B45309', fontSize: '12px' }}>Media upload failed. Choose the file again to retry.</p>}
            <button type="button" className="btn btn-ghost" onClick={() => { setRevoked((value) => !value); setGiftTouched(true); }}>
              {revoked ? 'Restore this surprise' : 'Revoke this surprise'}
            </button>

            <button
              className="btn btn-grad"
              onClick={() => {
                if (revoked || (revealAt && new Date(revealAt).getTime() > Date.now())) return;
                sounds.playCelebration();
                setRevealed(true);
                setCandlesBlown(false);
              }}
              style={{ padding: '14px', fontSize: '15px', justifyContent: 'center' }}
            >
              {revoked
                ? 'Gift Revoked'
                : revealAt && new Date(revealAt).getTime() > Date.now()
                  ? `Scheduled for ${new Date(revealAt).toLocaleString()}`
                  : 'Generate Birthday Page & Interactive Candles 🎂'}
            </button>
          </div>
        ) : (
          <div
            style={{
              background: selectedTheme.id === 'starlit' ? '#0F172A' : selectedTheme.bg,
              color: selectedTheme.id === 'starlit' ? '#F8FAFC' : '#1E293B',
              border: '1px solid var(--line)',
              borderRadius: '24px',
              padding: '44px 32px',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              animation: 'gl-rise 0.3s ease',
            }}
          >
            <span
              className="badge"
              style={{
                background: selectedTheme.primary,
                color: '#FFF',
                fontWeight: 800,
                fontSize: '11px',
                marginBottom: '16px',
              }}
            >
              {selectedTheme.badge}
            </span>

            {/* Interactive Candle Micro-interaction */}
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Birthday memory" style={{ width: '100%', maxWidth: '420px', borderRadius: '18px', margin: '16px auto', display: 'block' }} />
            )}
            {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '420px', margin: '0 auto 16px' }} />}
            <div
              onClick={blowCandles}
              style={{
                cursor: !candlesBlown ? 'pointer' : 'default',
                display: 'inline-block',
                margin: '16px auto',
                padding: '16px 28px',
                borderRadius: '20px',
                background: selectedTheme.id === 'starlit' ? 'rgba(255,255,255,0.08)' : '#FFF',
                border: '1px dashed var(--line)',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{ fontSize: '56px', lineHeight: 1 }}>
                {candlesBlown ? '🎂💨✨' : '🎂🕯️🔥'}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  marginTop: '10px',
                  color: candlesBlown ? '#16A34A' : selectedTheme.primary,
                }}
              >
                {candlesBlown ? '✨ Wishes Made & Confetti Released!' : '👆 Tap to Blow Out the Candles!'}
              </div>
            </div>

            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                margin: '14px 0 10px',
                fontFamily: 'var(--font-serif, Georgia, serif)',
              }}
            >
              Happy Birthday, {birthdayPersonName}!
            </h2>

            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.6,
                maxWidth: '48ch',
                margin: '0 auto 24px',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{customMsg}&rdquo;
            </p>

            {/* Gift Coupon Voucher */}
            {giftVoucher && (
              <div
                style={{
                  background: selectedTheme.id === 'starlit' ? 'rgba(255,255,255,0.06)' : '#FFF',
                  border: '1.5px dashed #FF9E7D',
                  borderRadius: '14px',
                  padding: '14px 20px',
                  maxWidth: '480px',
                  margin: '0 auto 28px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#E04A18' }}>
                  🎟️ COUPLE BIRTHDAY VOUCHER:
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, marginTop: '4px' }}>
                  {giftVoucher}
                </div>
              </div>
            )}

            {/* Scannable Heart QR Code */}
            <div
              style={{
                width: '180px',
                margin: '0 auto 24px',
                padding: '14px',
                background: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <QRCodeSVG
                text={
                  typeof window !== 'undefined'
                    ? window.location.href
                    : 'http://localhost:3000/birthday'
                }
                size={140}
                fgColor="#E11D48"
                bgColor="#FFFFFF"
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: '#E11D48',
                  fontWeight: 800,
                  marginTop: '8px',
                }}
              >
                SCAN WITH PHONE
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={copyLink} style={{ padding: '10px 20px' }}>
                {copied ? '✓ Link Copied!' : 'Copy Gift Link 🔗'}
              </button>

              <button
                className="btn btn-grad"
                onClick={handleSaveToKeepsakes}
                disabled={keepsakeSaved || keepsakeSaving}
                style={{ padding: '10px 20px' }}
              >
                {keepsakeSaved ? '✓ Saved to Keepsakes!' : keepsakeSaving ? 'Archiving...' : 'Save to Our Space 🏡'}
              </button>

              <button className="btn btn-ghost" onClick={() => setRevealed(false)} style={{ padding: '10px 16px' }}>
                Edit Page ✏️
              </button>
            </div>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}
