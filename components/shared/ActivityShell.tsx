'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Users,
  ShieldCheck,
  RotateCw,
  Play,
  Heart,
  Sparkles,
  Lock,
} from 'lucide-react';
import { RoomInviteModal } from './RoomInviteModal';
import {
  CupidotActivityGuidance,
  ActivityLifecyclePhase,
} from './CupidotActivityGuidance';
import styles from './ActivityShell.module.css';

export type ActivityStage = 'invite' | 'ready' | 'play' | 'remember';

export interface ActivityShellProps {
  activityKey?: string;
  activitySlug?: string;
  title?: string;
  subtitle?: string;
  activityTitle?: string;
  activitySubtitle?: string;
  badge?: string;
  stage?: ActivityStage;
  currentStage?: string;
  roomCode?: string;
  isSoloDemo?: boolean;
  partnerName?: string;
  partnerPresence?:
    | 'offline'
    | 'online'
    | 'ready'
    | 'choosing'
    | 'writing'
    | 'drawing'
    | 'locked';
  recoveryState?:
    | 'idle'
    | 'reconnecting'
    | 'loading_snapshot'
    | 'replaying_missed_events'
    | 'recovered'
    | 'unrecoverable_error';
  onRetryRecovery?: () => void;
  isPaused?: boolean;
  onResume?: () => void;
  onPause?: () => void;
  staleWarning?: string | null;
  cupidotPhase?: ActivityLifecyclePhase;
  cupidotNote?: string;
  guidancePhase?: string;
  guidancePrivacyNote?: string;
  keepsakeRail?: React.ReactNode;
  keepsakeSummary?: {
    kind?: string;
    title: string;
    subtitle?: string;
    badge?: string;
  };
  isHost?: boolean;
  stageIndicator?: string;
  children: React.ReactNode;
  className?: string;
}

const STAGES: { id: ActivityStage; label: string; number: number }[] = [
  { id: 'invite', label: 'Invite', number: 1 },
  { id: 'ready', label: 'Ready', number: 2 },
  { id: 'play', label: 'Play', number: 3 },
  { id: 'remember', label: 'Remember', number: 4 },
];

export function ActivityShell({
  activityKey,
  activitySlug,
  title: titleProp,
  subtitle: subtitleProp,
  activityTitle,
  activitySubtitle,
  badge,
  stage: stageProp,
  currentStage,
  roomCode,
  isSoloDemo = false,
  partnerName = 'Partner',
  partnerPresence = 'offline',
  recoveryState = 'idle',
  onRetryRecovery,
  isPaused = false,
  onResume,
  onPause,
  staleWarning,
  cupidotPhase,
  cupidotNote,
  guidancePhase,
  guidancePrivacyNote,
  keepsakeRail: keepsakeRailProp,
  keepsakeSummary,
  children,
  className = '',
}: ActivityShellProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [showCupidot, setShowCupidot] = useState(false);

  const title = titleProp || activityTitle || 'Dearly Us Activity';
  const subtitle = subtitleProp || activitySubtitle;
  const key = activityKey || activitySlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const slug = activitySlug || key;
  const candidateStage = stageProp || currentStage;
  const stage: ActivityStage =
    candidateStage === 'invite' || candidateStage === 'ready' || candidateStage === 'remember'
      ? candidateStage
      : 'play';
  const cupidotPhaseValue = (cupidotPhase || guidancePhase || 'private') as ActivityLifecyclePhase;
  const cupidotNoteValue = cupidotNote || guidancePrivacyNote;
  const keepsakeRail = keepsakeRailProp || (keepsakeSummary ? (
    <div className={styles.keepsakeSummaryCard}>
      {keepsakeSummary.badge && <span>{keepsakeSummary.badge}</span>}
      <small>{keepsakeSummary.kind || 'Keepsake'}</small>
      <h3>{keepsakeSummary.title}</h3>
      {keepsakeSummary.subtitle && <p>{keepsakeSummary.subtitle}</p>}
    </div>
  ) : null);
  const isReconnecting =
    recoveryState === 'reconnecting' ||
    recoveryState === 'replaying_missed_events';
  const isRecoveryError = recoveryState === 'unrecoverable_error';

  const getPresenceColor = () => {
    switch (partnerPresence) {
      case 'online':
      case 'ready':
        return '#7d917b';
      case 'writing':
      case 'drawing':
      case 'choosing':
        return '#c7a36a';
      case 'locked':
        return '#b97883';
      case 'offline':
      default:
        return '#a88d95';
    }
  };

  const getPresenceLabel = () => {
    switch (partnerPresence) {
      case 'ready':
        return `${partnerName} is ready`;
      case 'writing':
        return `${partnerName} is writing...`;
      case 'drawing':
        return `${partnerName} is drawing...`;
      case 'choosing':
        return `${partnerName} is picking...`;
      case 'locked':
        return `${partnerName} locked in`;
      case 'online':
        return `${partnerName} is here`;
      case 'offline':
      default:
        return isSoloDemo ? 'Solo demo' : `${partnerName} waiting`;
    }
  };

  return (
    <div className={`${styles.shell} ${className}`} id={`activity-shell-${key}`}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <Link href="/activity" className={styles.backLink} title="Return to activities catalogue">
          <ArrowLeft size={16} />
          <span>All Activities</span>
        </Link>

        <div className={styles.titleArea}>
          <h1 className={styles.activityTitle}>
            {title}
            {badge && (
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: 'rgba(185, 120, 131, 0.15)',
                  color: '#794c58',
                  fontFamily: 'sans-serif',
                }}
              >
                {badge}
              </span>
            )}
          </h1>
          {subtitle && <p className={styles.activitySubtitle}>{subtitle}</p>}
        </div>

        <div className={styles.controlsArea}>
          {isSoloDemo ? (
            <span className={styles.demoPill} title="Playing in local test mode. Invite your partner to synchronize!">
              Solo Sandbox
            </span>
          ) : (
            <div className={styles.partnerBadge}>
              <span
                className={`${styles.statusDot} ${partnerPresence !== 'offline' ? styles.statusDotPulse : ''}`}
                style={{ background: getPresenceColor() }}
              />
              <span>{getPresenceLabel()}</span>
            </div>
          )}

          {roomCode && (
            <button
              type="button"
              className={styles.inviteBtn}
              onClick={() => setInviteModalOpen(true)}
              title="Share invite link or room code with your partner"
            >
              <Share2 size={14} />
              <span>Room {roomCode}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCupidot(!showCupidot)}
            style={{
              padding: '0.4rem',
              borderRadius: '50%',
              border: '1px solid rgba(185, 120, 131, 0.25)',
              background: showCupidot ? '#fff1f5' : 'transparent',
              color: '#b97883',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Toggle Cupidot activity guidance"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </header>

      {/* Stage Progression Bar */}
      <div className={styles.stageBar}>
        {STAGES.map((s) => {
          const isActive = s.id === stage;
          return (
            <div
              key={s.id}
              className={`${styles.stageStep} ${isActive ? styles.stageStepActive : ''}`}
            >
              <span
                className={`${styles.stageNumber} ${isActive ? styles.stageNumberActive : ''}`}
              >
                {s.number}
              </span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Reconnect & Recovery Banners */}
      {isReconnecting && (
        <div className={styles.alertBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCw size={14} className={styles.statusDotPulse} />
            <span>
              Restoring live connection with your partner... Catching up on missed events.
            </span>
          </div>
          {onRetryRecovery && (
            <button
              type="button"
              className={styles.alertAction}
              onClick={onRetryRecovery}
            >
              Force Sync
            </button>
          )}
        </div>
      )}

      {isRecoveryError && (
        <div className={`${styles.alertBanner} ${styles.alertWarning}`}>
          <span>
            Connection interrupted. Authoritative snapshot restored, but some live events may need a refresh.
          </span>
          {onRetryRecovery && (
            <button
              type="button"
              className={styles.alertAction}
              onClick={onRetryRecovery}
            >
              Reconnect
            </button>
          )}
        </div>
      )}

      {staleWarning && (
        <div className={`${styles.alertBanner} ${styles.alertWarning}`}>
          <span>{staleWarning}</span>
        </div>
      )}

      {/* Expandable Cupidot Guidance */}
      {showCupidot && (
        <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 248, 250, 0.9)' }}>
          <CupidotActivityGuidance
            activityName={title}
            phase={cupidotPhaseValue}
            partnerName={partnerName}
            privacyNote={cupidotNoteValue || 'Your inputs remain completely private until both partner answers are locked in.'}
            isDemoMode={isSoloDemo}
          />
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className={styles.mainContainer}>
        <main className={styles.stageCanvas}>
          {children}

          {/* Pause Backdrop Overlay */}
          {isPaused && (
            <div className={styles.pauseBackdrop}>
              <div className={styles.pauseCard}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕</div>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#4a2835', margin: '0 0 0.5rem' }}>
                  Date Paused Gently
                </h2>
                <p style={{ color: '#8c6a75', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  Take a breath, grab some tea, or talk things through. Your progress is safely sealed on both screens.
                </p>
                {onResume && (
                  <button type="button" className={styles.resumeBtn} onClick={onResume}>
                    <Play size={15} style={{ display: 'inline', marginRight: '6px' }} />
                    Resume Date
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Persistent Keepsake / Result Rail on wide screens */}
        {keepsakeRail && (
          <aside className={`${styles.keepsakeRail} ${styles.keepsakeRailVisible}`}>
            {keepsakeRail}
          </aside>
        )}
      </div>

      {/* Room Invite Modal */}
      {roomCode && (
        <RoomInviteModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          roomCode={roomCode}
          activityName={title}
          partnerAName="You"
          activitySlug={slug}
        />
      )}
    </div>
  );
}
