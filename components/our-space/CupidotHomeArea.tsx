'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CupidotPetStage } from '@/components/bot/CupidotPetStage';
import { useCupidotPet } from '@/hooks/useCupidotPet';
import { TogethernessModal } from './TogethernessModal';
import { KeepsakeApprovalModal } from './KeepsakeApprovalModal';
import { CustomRitualModal } from './CustomRitualModal';
import { YourRoomYourRulesModal } from './YourRoomYourRulesModal';
import { Keepsake } from '@/types';
import { sounds } from '@/lib/sound';

export interface CupidotHomeAreaProps {
  partnerA?: string;
  partnerB?: string;
  partnerTime?: string | null;
  activeRoomCode?: string | null;
  keepsakes?: Keepsake[];
  onStartRoom?: () => Promise<void>;
  onInspectKeepsake?: (keepsake: Keepsake) => void;
  onOpenCapsuleModal?: () => void;
}

const PRESENCE_LABELS: Record<string, { label: string; dotColor: string }> = {
  here: { label: 'Here in Sanctuary', dotColor: '#10B981' },
  ready: { label: 'Ready for Date Night', dotColor: '#F59E0B' },
  choosing: { label: 'Choosing a Moment', dotColor: '#3B82F6' },
  writing: { label: 'Writing Tender Words', dotColor: '#8B5CF6' },
  drawing: { label: 'Drawing on Canvas', dotColor: '#EC4899' },
  reconnecting: { label: 'Reconnecting…', dotColor: '#F59E0B' },
  away: { label: 'Away for now', dotColor: '#9CA3AF' },
};

export function CupidotHomeArea({
  partnerA = 'You',
  partnerB = 'Your person',
  partnerTime,
  activeRoomCode,
  keepsakes = [],
  onStartRoom,
  onInspectKeepsake,
  onOpenCapsuleModal,
}: CupidotHomeAreaProps) {
  const {
    homeState,
    chapterProgress,
    unlockedRewards,
    partnerSafePresence,
    sendReaction,
    goodnightTap,
    changeMood,
    setGuidanceMode,
    setRomanceLevel,
    softenRomanceLevel,
    triggerGrowthSpark,
    placeDecor,
    removeDecor,
    undoDecorPlacement,
    proposeMemorySeed,
    approveMemorySeed,
    declineMemorySeed,
    createOrUpdateRitual,
    snoozeRitual,
    rescheduleRitual,
    completeRitual,
  } = useCupidotPet();

  // Modals state
  const [togethernessModalOpen, setTogethernessModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ambientAudio, setAmbientAudio] = useState(false);
  const [dismissedSeedId, setDismissedSeedId] = useState<string | null>(null);

  const presenceInfo =
    PRESENCE_LABELS[partnerSafePresence] || PRESENCE_LABELS.away;

  return (
    <section
      aria-label="Cupidot shared home area"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        margin: '0 0 28px',
      }}
    >
      {/* 1. Progression & Chapter Header Ribbon */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 240, 245, 0.95), rgba(240, 245, 255, 0.9))',
          border: '1px solid rgba(255, 143, 178, 0.3)',
          borderRadius: '24px',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px -4px rgba(255, 78, 120, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxWidth: '420px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'var(--pink)',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              Chapter {homeState.chapter}
            </span>
            <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
              {chapterProgress.currentChapter === 1
                ? 'A New Little Home'
                : chapterProgress.currentChapter === 2
                  ? 'Learning Your Rhythm'
                  : chapterProgress.currentChapter === 3
                    ? 'Making Traditions'
                    : chapterProgress.currentChapter === 4
                      ? 'A Home Full of Stories'
                      : 'Always Finding Each Other'}
            </strong>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--ink-soft)',
              margin: '2px 0 0',
            }}
          >
            {chapterProgress.readablePrompt}
          </p>

          {/* Chapter Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 143, 178, 0.2)',
              borderRadius: '3px',
              marginTop: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${chapterProgress.progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--pink), var(--blue))',
                borderRadius: '3px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Sparks Counter & Privacy Shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(255, 143, 178, 0.35)',
              borderRadius: '16px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <span style={{ fontSize: '18px' }}>✨</span>
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                }}
              >
                {homeState.growthSparks} sparks
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                }}
              >
                Zero streak loss
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              sounds.playPop();
              setRulesModalOpen(true);
            }}
            style={{ fontSize: '12px', padding: '8px 14px' }}
            title="Open Your Room, Your Rules privacy settings"
          >
            🛡️ Privacy &amp; Rules
          </button>
        </div>
      </div>

      {/* 2. Main Centerpiece Grid: Cupidot Pet Stage + Tonight Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* Cupidot Interactive Pet Stage */}
        <CupidotPetStage
          state={homeState.state}
          mood={homeState.mood}
          onSendReaction={sendReaction}
          onGoodnightTap={goodnightTap}
        />

        {/* Tonight Card: One Clear Next Action & Safe Presence */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid var(--line)',
            borderRadius: '28px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Top Presence Indicator */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: presenceInfo.dotColor,
                    boxShadow: `0 0 8px ${presenceInfo.dotColor}`,
                  }}
                />
                <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
                  {partnerB}: {presenceInfo.label}
                </strong>
              </div>
              {partnerTime && (
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                  {partnerTime} local
                </span>
              )}
            </div>

            {/* Tonight Card Headline */}
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--pink)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Tonight for {partnerA} &amp; {partnerB}
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                margin: '6px 0 8px',
                color: 'var(--ink)',
              }}
            >
              {activeRoomCode
                ? `Resume Date Night in Room ${activeRoomCode}`
                : partnerSafePresence === 'here'
                  ? 'Both of you are here in sanctuary.'
                  : 'A quiet evening in Our Space.'}
            </h3>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                lineHeight: 1.5,
                margin: '0 0 20px',
              }}
            >
              {activeRoomCode
                ? 'Your date night room is waiting right where you left off. Jump straight back into tonight’s moments.'
                : partnerSafePresence === 'here'
                  ? 'Start a shared date night room, sit together in quiet presence, or exchange a 2-minute quick spark.'
                  : 'Even while your person is away, Cupidot keeps your sanctuary cozy. You can leave a quick spark, browse memories, or relax.'}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {activeRoomCode ? (
              <Link
                className="btn btn-primary"
                href={`/room/${activeRoomCode}`}
                style={{ justifyContent: 'center' }}
              >
                Resume Date Night ▷
              </Link>
            ) : onStartRoom ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onStartRoom}
                style={{ justifyContent: 'center' }}
              >
                Start Date Night ▷
              </button>
            ) : null}

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                sounds.playPop();
                setTogethernessModalOpen(true);
              }}
              style={{ justifyContent: 'center', fontSize: '13px' }}
            >
              Browse Togetherness Modes (Quick Spark, Quiet Together…) ⚡
            </button>
          </div>
        </div>
      </div>

      {/* 3. Ritual Corner & Home Decor Shelf Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Ritual Corner */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--pink)',
                }}
              >
                RITUAL CORNER
              </span>
              <h4
                style={{
                  margin: '2px 0 0',
                  fontSize: '16px',
                  color: 'var(--ink)',
                }}
              >
                {homeState.upcomingRitual?.title ||
                  'No Scheduled Ritual Yet'}
              </h4>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setRitualModalOpen(true)}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              {homeState.upcomingRitual ? 'Edit / Reschedule' : '+ Schedule'}
            </button>
          </div>

          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--ink-soft)',
              margin: '0 0 14px',
              lineHeight: 1.45,
            }}
          >
            {homeState.upcomingRitual?.purpose ||
              'Set a gentle recurring pause—like Sunday reviews or quiet morning coffee—to stay connected across the distance. Zero streaks, no pressure if missed.'}
          </p>

          {homeState.upcomingRitual ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  sounds.playCelebration();
                  completeRitual(homeState.upcomingRitual!.id);
                }}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Mark Completed (+10 sparks) ✓
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  snoozeRitual(homeState.upcomingRitual!.id, 24)
                }
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Snooze (+1 day) 💤
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRitualModalOpen(true)}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Reschedule
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRitualModalOpen(true)}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Create a Shared Ritual ✨
            </button>
          )}
        </div>

        {/* Home Decor & Souvenirs Collection Shelf */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--blue)',
                }}
              >
                HOME COLLECTION
              </span>
              <h4
                style={{
                  margin: '2px 0 0',
                  fontSize: '16px',
                  color: 'var(--ink)',
                }}
              >
                Decor &amp; Souvenirs ({unlockedRewards.length} Unlocked)
              </h4>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={undoDecorPlacement}
              style={{ fontSize: '11px', padding: '4px 10px' }}
              title="Undo last decor change"
            >
              ↩ Undo
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
              gap: '8px',
              maxHeight: '130px',
              overflowY: 'auto',
            }}
          >
            {unlockedRewards.map((reward) => (
              <button
                key={reward.id}
                type="button"
                onClick={() => {
                  if (reward.placedInRoom) removeDecor(reward.id);
                  else placeDecor(reward.id);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 4px',
                  borderRadius: '12px',
                  border: reward.placedInRoom
                    ? '1.5px solid var(--pink)'
                    : '1px solid var(--line)',
                  background: reward.placedInRoom
                    ? 'rgba(255, 78, 120, 0.08)'
                    : 'var(--paper)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                title={`${reward.name} · ${reward.placedInRoom ? 'Placed in room (tap to remove)' : 'Tap to place in room'}`}
              >
                <span style={{ fontSize: '20px' }}>{reward.icon}</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    marginTop: '2px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '58px',
                  }}
                >
                  {reward.name}
                </span>
                {reward.placedInRoom && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--pink)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--ink-soft)',
              marginTop: '8px',
              display: 'block',
            }}
          >
            Tap an item to place or remove it from your shared room. Undo
            anytime.
          </span>
        </div>
      </div>

      {/* Modals */}
      <TogethernessModal
        isOpen={togethernessModalOpen}
        onClose={() => setTogethernessModalOpen(false)}
        activeRoomCode={activeRoomCode}
        onStartRoom={onStartRoom}
        partnerName={partnerB}
        onSparkAwarded={() =>
          triggerGrowthSpark(
            'shared_activity_completed',
            `togetherness-${Date.now()}`,
          )
        }
      />

      <YourRoomYourRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        guidanceMode={homeState.guidanceMode}
        onGuidanceChange={setGuidanceMode}
        romanceLevel={homeState.romanceLevel || 'romantic'}
        onRomanceLevelChange={setRomanceLevel}
        onSoftenRomance={softenRomanceLevel}
        reducedMotion={reducedMotion}
        onReducedMotionChange={setReducedMotion}
        ambientAudio={ambientAudio}
        onAmbientAudioChange={setAmbientAudio}
      />

      <CustomRitualModal
        isOpen={ritualModalOpen}
        onClose={() => setRitualModalOpen(false)}
        partnerAName={partnerA}
        partnerBName={partnerB}
        initialRitual={homeState.upcomingRitual}
        onSaveRitual={createOrUpdateRitual}
      />

      {homeState.activeMemorySeed && (
        <KeepsakeApprovalModal
          isOpen={
            Boolean(homeState.activeMemorySeed) &&
            dismissedSeedId !== homeState.activeMemorySeed.seedId
          }
          onClose={() =>
            setDismissedSeedId(homeState.activeMemorySeed?.seedId || null)
          }
          seed={homeState.activeMemorySeed}
          currentUserName={partnerA}
          partnerName={partnerB}
          onApprove={(seedId, updatedCaption, updatedMood) => {
            approveMemorySeed(seedId, updatedCaption, updatedMood);
            triggerGrowthSpark('keepsake_saved', `keepsake-seed-${seedId}`);
          }}
          onDecline={(seedId) => {
            declineMemorySeed(seedId);
            setDismissedSeedId(null);
          }}
        />
      )}
    </section>
  );
}
