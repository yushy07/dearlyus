'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PASSPORT_STAMPS,
  getUnlockedStamps,
  unlockPassportStamp,
  getStampNotes,
  saveStampNote,
  getCoupleTicketProfile,
  saveCoupleTicketProfile,
  DEFAULT_PASSPORT_PROFILE,
} from '@/lib/passport';
import type { PassportStamp, CoupleTicketProfile } from '@/types/passport';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { loadActivityRecords, upsertActivityRecord } from '@/lib/activity-records';
import { useCoupleProfile } from '@/lib/couple';

export function usePassport() {
  const { space } = useCoupleSpace();
  const couple = useCoupleProfile();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [stampNotes, setStampNotesState] = useState<Record<string, string>>({});
  const [profile, setProfileState] = useState<CoupleTicketProfile>(
    DEFAULT_PASSPORT_PROFILE,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (space?.id) {
        void loadActivityRecords<{ unlockedIds?: string[]; stampNotes?: Record<string, string>; ticket?: CoupleTicketProfile }>(space.id, 'passport').then((records) => {
          if (!active) return;
          const saved = records.find((record) => record.key === 'main');
          const nextUnlocked = saved?.payload.unlockedIds || getUnlockedStamps();
          const nextNotes = saved?.payload.stampNotes || getStampNotes();
          const nextProfile = { ...(saved?.payload.ticket || DEFAULT_PASSPORT_PROFILE), partner1: couple.partnerA, partner2: couple.partnerB, originCity: couple.cityA || saved?.payload.ticket?.originCity || '', destinationCity: couple.cityB || saved?.payload.ticket?.destinationCity || '' };
          setUnlockedIds(nextUnlocked); setStampNotesState(nextNotes); setProfileState(nextProfile); setIsLoaded(true);
          if (!saved) void upsertActivityRecord({ coupleId: space.id, kind: 'passport', key: 'main', title: 'Our Passport', payload: { unlockedIds: nextUnlocked, stampNotes: nextNotes, ticket: nextProfile } }).then(() => {
            localStorage.removeItem('dearly_unlocked_stamps'); localStorage.removeItem('dearly_stamp_notes'); localStorage.removeItem('dearly_couple_ticket_profile');
          });
        }).catch(() => setIsLoaded(true));
        return;
      }
    setUnlockedIds(getUnlockedStamps());
    setStampNotesState(getStampNotes());
    setProfileState(getCoupleTicketProfile());
    setIsLoaded(true);

    };
    load();
    const handleProfileSync = () => {
      setProfileState(getCoupleTicketProfile());
    };
    window.addEventListener('dearly_couple_profile_updated', handleProfileSync);
    window.addEventListener('storage', handleProfileSync);
    window.addEventListener('dearly_shared_records_changed', load);
    return () => {
      active = false;
      window.removeEventListener(
        'dearly_couple_profile_updated',
        handleProfileSync,
      );
      window.removeEventListener('storage', handleProfileSync);
      window.removeEventListener('dearly_shared_records_changed', load);
    };
  }, [space?.id, couple.partnerA, couple.partnerB, couple.cityA, couple.cityB]);

  const persistShared = useCallback((nextUnlocked: string[], nextNotes: Record<string, string>, nextProfile: CoupleTicketProfile) => {
    if (space?.id) void upsertActivityRecord({ coupleId: space.id, kind: 'passport', key: 'main', title: 'Our Passport', payload: { unlockedIds: nextUnlocked, stampNotes: nextNotes, ticket: nextProfile } });
  }, [space?.id]);

  const unlockStamp = useCallback((stampId: string) => {
    if (space?.id) {
      if (unlockedIds.includes(stampId)) return false;
      const next = [...unlockedIds, stampId]; setUnlockedIds(next); persistShared(next, stampNotes, profile); return true;
    }
    const isNew = unlockPassportStamp(stampId);
    if (isNew) {
      setUnlockedIds(getUnlockedStamps());
    }
    return isNew;
  }, [space?.id, unlockedIds, stampNotes, profile, persistShared]);

  const updateNote = useCallback((stampId: string, note: string) => {
    if (space?.id) { const next = { ...stampNotes, [stampId]: note }; setStampNotesState(next); persistShared(unlockedIds, next, profile); return; }
    saveStampNote(stampId, note);
    setStampNotesState((prev) => ({ ...prev, [stampId]: note }));
  }, [space?.id, stampNotes, unlockedIds, profile, persistShared]);

  const updateProfile = useCallback(
    (newProfile: Partial<CoupleTicketProfile>) => {
      if (space?.id) { const next = { ...profile, ...newProfile, partner1: couple.partnerA, partner2: couple.partnerB }; setProfileState(next); persistShared(unlockedIds, stampNotes, next); return; }
      saveCoupleTicketProfile(newProfile);
      setProfileState(getCoupleTicketProfile());
    },
    [space?.id, profile, couple.partnerA, couple.partnerB, unlockedIds, stampNotes, persistShared],
  );

  const unlockedCount = unlockedIds.length;
  const totalCount = PASSPORT_STAMPS.length;
  const progressPercent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const getRankTier = () => {
    if (unlockedCount >= 12) return '👑 Eternal Soulmates (Grandmaster)';
    if (unlockedCount >= 9) return '💎 First Class Lovebirds';
    if (unlockedCount >= 6) return '💖 World Travelers Duo';
    if (unlockedCount >= 3) return '🌸 Honeymoon Explorers';
    return '💌 Love Cadets';
  };

  return {
    stamps: PASSPORT_STAMPS,
    unlockedIds,
    stampNotes,
    profile,
    isLoaded,
    unlockedCount,
    totalCount,
    progressPercent,
    rankTier: getRankTier(),
    unlockStamp,
    updateNote,
    updateProfile,
  };
}
