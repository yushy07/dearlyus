'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  CupidotState,
  CupidotMood,
  CupidotHomeState,
  GuidanceMode,
  RomanceLevel,
  SafeReaction,
  CoupleRitual,
  MemorySeed,
  HomeRewardItem,
} from '@/types/cupidot';
import {
  loadStoredCupidotHome,
  saveStoredCupidotHome,
  awardGrowthSparks,
  getChapterProgress,
  deriveCupidotState,
  sanitizeSafePresence,
  HOME_COLLECTION_CATALOG,
  getReturnExperience,
  placeHomeDecor,
  approveMemorySeed as stateApproveMemorySeed,
  declineMemorySeed as stateDeclineMemorySeed,
} from '@/lib/cupidot-state';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { useRoomPresence } from '@/contexts/PresenceContext';
import { sounds } from '@/lib/sound';

export function useCupidotPet() {
  const { space, partner, milestones, keepsakes, preferences } =
    useCoupleSpace();
  const coupleId = space?.id;

  const { partnerOnline, partnerInteraction, connectionState } =
    useRoomPresence();

  const [homeState, setHomeState] = useState<CupidotHomeState>(() =>
    loadStoredCupidotHome(coupleId),
  );
  const seenActionKeysRef = useRef<Set<string>>(new Set());
  const decorUndoStackRef = useRef<string[][]>([]);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReactionTimer = useCallback(() => {
    if (reactionTimerRef.current !== null) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearReactionTimer();
    };
  }, [clearReactionTimer]);

  // Reload state if couple space changes
  useEffect(() => {
    seenActionKeysRef.current.clear();
    decorUndoStackRef.current = [];
    setHomeState(loadStoredCupidotHome(coupleId));
  }, [coupleId]);

  // Persist state whenever it changes
  useEffect(() => {
    saveStoredCupidotHome(homeState, coupleId);
  }, [homeState, coupleId]);

  // Derive chapter progress
  const chapterProgress = useMemo(() => {
    return getChapterProgress(homeState.growthSparks);
  }, [homeState.growthSparks]);

  // Unlocked items based on current chapter
  const unlockedRewards = useMemo(() => {
    return HOME_COLLECTION_CATALOG.filter(
      (item) => item.unlockedAtChapter <= homeState.chapter,
    ).map((item) => ({
      ...item,
      placedInRoom: homeState.placedDecorIds.includes(item.id),
    }));
  }, [homeState.chapter, homeState.placedDecorIds]);

  // Safe partner presence derived from actual realtime room connection
  const partnerSafePresence = useMemo(() => {
    const isOnline = Boolean(partnerOnline);
    const isReconnecting = connectionState === 'reconnecting';
    return sanitizeSafePresence(
      isOnline,
      partnerInteraction || null,
      isReconnecting,
    );
  }, [partnerOnline, partnerInteraction, connectionState]);

  // Sync partner presence into homeState
  useEffect(() => {
    setHomeState((prev) => {
      if (prev.partnerPresence === partnerSafePresence) return prev;
      return { ...prev, partnerPresence: partnerSafePresence };
    });
  }, [partnerSafePresence]);

  // Send safe reaction
  const sendReaction = useCallback(
    (reaction: SafeReaction) => {
      clearReactionTimer();

      switch (reaction) {
        case 'heart':
        case 'sparkle':
          sounds.playSparkleReaction('💖');
          break;
        case 'cheer':
        case 'ready_pulse':
          sounds.playCelebration();
          break;
        case 'comfort':
        case 'wave':
        default:
          sounds.playPop();
          break;
      }

      setHomeState((prev) => {
        const nextMood: CupidotMood =
          reaction === 'comfort'
            ? 'cozy'
            : reaction === 'cheer'
              ? 'excited'
              : 'playful';
        return {
          ...prev,
          state: 'celebrating',
          mood: nextMood,
        };
      });

      // Reset back to calm after celebration without overriding goodnight
      reactionTimerRef.current = setTimeout(() => {
        setHomeState((prev) => {
          if (prev.state === 'settling_for_night') return prev;
          return {
            ...prev,
            state: partnerOnline ? 'reunion' : 'welcoming',
          };
        });
        reactionTimerRef.current = null;
      }, 2200);
    },
    [partnerOnline, clearReactionTimer],
  );

  // Goodnight tap
  const goodnightTap = useCallback(() => {
    clearReactionTimer();
    sounds.playChime();
    setHomeState((prev) => ({
      ...prev,
      state: 'settling_for_night',
      mood: 'cozy',
      lastGoodnightTapAt: new Date().toISOString(),
    }));
  }, [clearReactionTimer]);

  // Update mood safely
  const changeMood = useCallback((mood: CupidotMood) => {
    sounds.playTick();
    setHomeState((prev) => ({ ...prev, mood }));
  }, []);

  // Update guidance mode
  const setGuidanceMode = useCallback((guidanceMode: GuidanceMode) => {
    sounds.playTick();
    setHomeState((prev) => ({ ...prev, guidanceMode }));
  }, []);

  // Update romance level
  const setRomanceLevel = useCallback((romanceLevel: RomanceLevel) => {
    sounds.playTick();
    setHomeState((prev) => ({ ...prev, romanceLevel }));
  }, []);

  // Private soften intensity action
  const softenRomanceLevel = useCallback(() => {
    sounds.playPop();
    setHomeState((prev) => ({ ...prev, romanceLevel: 'warm' }));
    return 'Keeping things lighter.';
  }, []);

  // Award growth sparks idempotently
  const triggerGrowthSpark = useCallback(
    (
      actionType:
        | 'shared_activity_completed'
        | 'ritual_completed'
        | 'keepsake_saved'
        | 'date_planned'
        | 'milestone_recorded'
        | 'new_category_tried'
        | 'reunion_return',
      actionKey: string,
    ) => {
      const result = awardGrowthSparks(
        homeState.growthSparks,
        homeState.sparksThisSession,
        actionType,
        seenActionKeysRef.current,
        actionKey,
      );

      if (!result.awarded) return result;

      sounds.playCelebration();

      setHomeState((prev) => ({
        ...prev,
        growthSparks: result.totalSparks,
        sparksThisSession: result.sessionSparks,
        chapter: result.newChapter || prev.chapter,
        state: 'celebrating',
        mood: 'proud',
      }));

      clearReactionTimer();
      reactionTimerRef.current = setTimeout(() => {
        setHomeState((prev) => {
          if (prev.state === 'settling_for_night') return prev;
          return {
            ...prev,
            state: partner ? 'reunion' : 'welcoming',
          };
        });
        reactionTimerRef.current = null;
      }, 2500);

      return result;
    },
    [homeState.growthSparks, homeState.sparksThisSession, partner, clearReactionTimer],
  );

  // Decor placement with undo support
  const placeDecor = useCallback((decorId: string) => {
    sounds.playPop();
    setHomeState((prev) => {
      const nextPlaced = placeHomeDecor(
        prev.placedDecorIds,
        decorId,
        prev.chapter,
      );
      if (nextPlaced.length === prev.placedDecorIds.length) return prev;
      decorUndoStackRef.current.push([...prev.placedDecorIds]);
      return {
        ...prev,
        placedDecorIds: nextPlaced,
      };
    });
  }, []);

  const removeDecor = useCallback((decorId: string) => {
    sounds.playPop();
    setHomeState((prev) => {
      decorUndoStackRef.current.push([...prev.placedDecorIds]);
      return {
        ...prev,
        placedDecorIds: prev.placedDecorIds.filter((id) => id !== decorId),
      };
    });
  }, []);

  const undoDecorPlacement = useCallback(() => {
    const previous = decorUndoStackRef.current.pop();
    if (!previous) return;
    sounds.playTick();
    setHomeState((prev) => ({
      ...prev,
      placedDecorIds: previous,
    }));
  }, []);

  // Memory Seed & Mutual Keepsake Approval
  const proposeMemorySeed = useCallback(
    (
      seedData: Omit<MemorySeed, 'seedId' | 'approvalStatus' | 'occurredAt'>,
    ) => {
      sounds.playChime();
      const seed: MemorySeed = {
        ...seedData,
        seedId: `seed-${Date.now()}`,
        version: 1,
        approvedBy: [seedData.partnerAId || seedData.proposedBy || 'You'],
        approvedByPartnerA: true,
        approvedByPartnerB: false,
        approvalStatus: 'proposed',
        status: 'proposed',
        occurredAt: new Date().toISOString(),
      };
      setHomeState((prev) => ({
        ...prev,
        activeMemorySeed: seed,
        state: 'curating_memory',
        mood: 'dreamy',
      }));
      return seed;
    },
    [],
  );

  const approveMemorySeed = useCallback(
    (
      seedId: string,
      partnerId: string = 'partner',
      updatedCaption?: string,
      updatedMood?: CupidotMood,
      aiReuseConsent?: boolean,
    ) => {
      setHomeState((prev) => {
        if (prev.activeMemorySeed?.seedId !== seedId) return prev;
        const approved = stateApproveMemorySeed(
          prev.activeMemorySeed,
          partnerId,
          updatedCaption,
          updatedMood,
          aiReuseConsent,
        );

        if (approved.approvalStatus === 'both_approved') {
          sounds.playCelebration();
        } else {
          sounds.playChime();
        }

        return {
          ...prev,
          activeMemorySeed: approved,
          state:
            approved.approvalStatus === 'both_approved'
              ? 'celebrating'
              : 'curating_memory',
          mood:
            approved.approvalStatus === 'both_approved' ? 'proud' : 'dreamy',
        };
      });
    },
    [],
  );

  const declineMemorySeed = useCallback(
    (seedId: string, partnerId?: string) => {
      sounds.playPop();
      setHomeState((prev) => {
        if (prev.activeMemorySeed?.seedId !== seedId) return prev;
        return {
          ...prev,
          activeMemorySeed: null,
          state: partner ? 'reunion' : 'welcoming',
        };
      });
    },
    [partner],
  );

  // Couple Rituals
  const createOrUpdateRitual = useCallback(
    (
      ritualData: Partial<CoupleRitual> &
        Omit<CoupleRitual, 'id' | 'createdAt'>,
    ) => {
      sounds.playSparkleReaction('💖');
      setHomeState((prev) => {
        const existing = prev.upcomingRitual;
        const targetId =
          (ritualData as any).id ||
          (existing ? existing.id : `ritual-${Date.now()}`);
        const createdAt =
          (ritualData as any).createdAt ||
          (existing?.id === targetId
            ? existing.createdAt
            : new Date().toISOString());
        const ritual: CoupleRitual = {
          ...ritualData,
          id: targetId,
          createdAt,
        };
        return {
          ...prev,
          upcomingRitual: ritual,
        };
      });
    },
    [],
  );

  const snoozeRitual = useCallback(
    (ritualId: string, durationHours: number) => {
      sounds.playPop();
      const snoozedUntil = new Date(
        Date.now() + durationHours * 3600 * 1000,
      ).toISOString();
      setHomeState((prev) => {
        if (prev.upcomingRitual?.id !== ritualId) return prev;
        return {
          ...prev,
          upcomingRitual: {
            ...prev.upcomingRitual,
            snoozedUntil,
          },
        };
      });
    },
    [],
  );

  const rescheduleRitual = useCallback(
    (
      ritualId: string,
      newTimeOfDay?: string,
      newCadence?: CoupleRitual['cadence'],
    ) => {
      sounds.playPop();
      setHomeState((prev) => {
        if (prev.upcomingRitual?.id !== ritualId) return prev;
        return {
          ...prev,
          upcomingRitual: {
            ...prev.upcomingRitual,
            timeOfDay: newTimeOfDay ?? prev.upcomingRitual.timeOfDay,
            cadence: newCadence ?? prev.upcomingRitual.cadence,
            snoozedUntil: null,
          },
        };
      });
    },
    [],
  );

  const completeRitual = useCallback(
    (ritualId: string) => {
      triggerGrowthSpark(
        'ritual_completed',
        `ritual-complete-${ritualId}-${Date.now()}`,
      );
      setHomeState((prev) => {
        if (prev.upcomingRitual?.id !== ritualId) return prev;
        return {
          ...prev,
          upcomingRitual: {
            ...prev.upcomingRitual,
            lastCompletedAt: new Date().toISOString(),
            snoozedUntil: null,
          },
        };
      });
    },
    [triggerGrowthSpark],
  );

  return {
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
  };
}
