/**
 * Global Couple Profile Store & Hook
 * 
 * Allows couples from anywhere in the world to set their real names and locations,
 * persisting them seamlessly across all activities, quizzes, court cases, debates,
 * and AI prompts with zero hardcoding.
 */

'use client';

import { useState, useEffect } from 'react';

export interface CoupleProfile {
  partnerA: string;
  partnerB: string;
  cityA?: string;
  cityB?: string;
  roomCode?: string;
}

export const DEFAULT_COUPLE: CoupleProfile = {
  partnerA: 'Mia',
  partnerB: 'Alex',
  cityA: 'Calgary',
  cityB: 'Jakarta',
  roomCode: 'KX7RM',
};

const STORAGE_KEY = 'angie_couple_profile';

export function getStoredCoupleProfile(): CoupleProfile {
  if (typeof window === 'undefined') return DEFAULT_COUPLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.partnerA || parsed.partnerB)) {
        return {
          partnerA: parsed.partnerA?.trim() || DEFAULT_COUPLE.partnerA,
          partnerB: parsed.partnerB?.trim() || DEFAULT_COUPLE.partnerB,
          cityA: parsed.cityA?.trim() || DEFAULT_COUPLE.cityA,
          cityB: parsed.cityB?.trim() || DEFAULT_COUPLE.cityB,
        };
      }
    }
  } catch {}
  return DEFAULT_COUPLE;
}

export function saveStoredCoupleProfile(updates: Partial<CoupleProfile>): CoupleProfile {
  if (typeof window === 'undefined') return DEFAULT_COUPLE;
  try {
    const current = getStoredCoupleProfile();
    const merged: CoupleProfile = {
      partnerA: updates.partnerA !== undefined ? updates.partnerA.trim() : current.partnerA,
      partnerB: updates.partnerB !== undefined ? updates.partnerB.trim() : current.partnerB,
      cityA: updates.cityA !== undefined ? updates.cityA.trim() : current.cityA,
      cityB: updates.cityB !== undefined ? updates.cityB.trim() : current.cityB,
      roomCode: updates.roomCode !== undefined ? updates.roomCode.trim() : current.roomCode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('angie_couple_profile_updated', { detail: merged }));
    return merged;
  } catch {}
  return DEFAULT_COUPLE;
}

/**
 * React hook that subscribes to couple name updates across any page/modal
 */
export function useCoupleProfile() {
  const [profile, setProfile] = useState<CoupleProfile>(DEFAULT_COUPLE);

  useEffect(() => {
    setProfile(getStoredCoupleProfile());

    const handleUpdate = (e: any) => {
      if (e.detail) setProfile(e.detail);
      else setProfile(getStoredCoupleProfile());
    };

    window.addEventListener('angie_couple_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('angie_couple_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateProfile = (updates: Partial<CoupleProfile>) => {
    const updated = saveStoredCoupleProfile(updates);
    setProfile(updated);
  };

  return {
    partnerA: profile.partnerA || 'Partner 1',
    partnerB: profile.partnerB || 'Partner 2',
    cityA: profile.cityA || 'City 1',
    cityB: profile.cityB || 'City 2',
    roomCode: profile.roomCode || 'KX7RM',
    updateProfile,
  };
}
