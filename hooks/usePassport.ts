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
} from '@/lib/passport';
import type { PassportStamp, CoupleTicketProfile } from '@/types/passport';

export function usePassport() {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [stampNotes, setStampNotesState] = useState<Record<string, string>>({});
  const [profile, setProfileState] = useState<CoupleTicketProfile>({
    partner1: 'Mia',
    partner2: 'Alex',
    originCity: 'Seoul 🇰🇷 (GMT+9)',
    destinationCity: 'San Francisco 🇺🇸 (GMT-7)',
    anniversaryDate: '2024.11.14',
    seatNumber: '1A (Beside You)',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setUnlockedIds(getUnlockedStamps());
    setStampNotesState(getStampNotes());
    setProfileState(getCoupleTicketProfile());
    setIsLoaded(true);
  }, []);

  const unlockStamp = useCallback((stampId: string) => {
    const isNew = unlockPassportStamp(stampId);
    if (isNew) {
      setUnlockedIds(getUnlockedStamps());
    }
    return isNew;
  }, []);

  const updateNote = useCallback((stampId: string, note: string) => {
    saveStampNote(stampId, note);
    setStampNotesState((prev) => ({ ...prev, [stampId]: note }));
  }, []);

  const updateProfile = useCallback((newProfile: Partial<CoupleTicketProfile>) => {
    saveCoupleTicketProfile(newProfile);
    setProfileState(getCoupleTicketProfile());
  }, []);

  const unlockedCount = unlockedIds.length;
  const totalCount = PASSPORT_STAMPS.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

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
