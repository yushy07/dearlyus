/**
 * Global Couple Profile Store & Hook
 *
 * Allows couples from anywhere in the world to set their real names and locations,
 * persisting them seamlessly across all activities, quizzes, court cases, debates,
 * and AI prompts with zero hardcoding.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';

export interface CoupleProfile {
  partnerA: string;
  partnerB: string;
  cityA?: string;
  cityB?: string;
  timezoneA?: string;
  timezoneB?: string;
  latitudeA?: number | null;
  longitudeA?: number | null;
  latitudeB?: number | null;
  longitudeB?: number | null;
  avatarA?: string | null;
  avatarB?: string | null;
  roomCode?: string;
}

export const DEFAULT_COUPLE: CoupleProfile = {
  partnerA: 'Mia',
  partnerB: 'Alex',
  cityA: 'Calgary',
  cityB: 'Jakarta',
};

const STORAGE_KEY = 'dearly_couple_profile';

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
          roomCode: parsed.roomCode
            ?.trim()
            .toUpperCase()
            .match(/^[A-Z0-9]{8,16}$/)
            ? parsed.roomCode.trim().toUpperCase()
            : undefined,
        };
      }
    }
  } catch {}
  return DEFAULT_COUPLE;
}

export function saveStoredCoupleProfile(
  updates: Partial<CoupleProfile>,
): CoupleProfile {
  if (typeof window === 'undefined') return DEFAULT_COUPLE;
  try {
    const current = getStoredCoupleProfile();
    const merged: CoupleProfile = {
      partnerA:
        updates.partnerA !== undefined
          ? updates.partnerA.trim()
          : current.partnerA,
      partnerB:
        updates.partnerB !== undefined
          ? updates.partnerB.trim()
          : current.partnerB,
      cityA: updates.cityA !== undefined ? updates.cityA.trim() : current.cityA,
      cityB: updates.cityB !== undefined ? updates.cityB.trim() : current.cityB,
      roomCode:
        updates.roomCode !== undefined
          ? updates.roomCode.trim()
          : current.roomCode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(
      new CustomEvent('dearly_couple_profile_updated', { detail: merged }),
    );
    return merged;
  } catch {}
  return DEFAULT_COUPLE;
}

/**
 * React hook that subscribes to couple name updates across any page/modal
 */
export function useCoupleProfile() {
  const { profile, partner, space, saveProfile } = useCoupleSpace();
  const { user } = useSupabaseSession();
  const [localProfile, setLocalProfile] =
    useState<CoupleProfile>(DEFAULT_COUPLE);

  useEffect(() => {
    const stored = getStoredCoupleProfile();
    const invitedRoom = new URLSearchParams(window.location.search)
      .get('room')
      ?.replace(/[^a-z0-9]/gi, '')
      .toUpperCase();
    if (invitedRoom && invitedRoom.length >= 8) {
      setLocalProfile(saveStoredCoupleProfile({ roomCode: invitedRoom }));
    } else {
      setLocalProfile(stored);
    }

    const handleUpdate = (e: any) => {
      if (e.type === 'storage') {
        if (e.key === null || e.key === STORAGE_KEY) {
          setLocalProfile(getStoredCoupleProfile());
        }
        return;
      }
      if (e.detail) setLocalProfile(e.detail);
      else setLocalProfile(getStoredCoupleProfile());
    };

    window.addEventListener('dearly_couple_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dearly_couple_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateProfile = async (updates: Partial<CoupleProfile>) => {
    const updated = saveStoredCoupleProfile(updates);
    setLocalProfile(updated);
    if (profile && updates.partnerA?.trim()) {
      await saveProfile({
        displayName: updates.partnerA.trim(),
        city: profile.city,
        timezone: profile.timezone,
        country: profile.country,
        countryCode: profile.countryCode,
        state: profile.state,
        stateCode: profile.stateCode,
        latitude: profile.latitude,
        longitude: profile.longitude,
        pronouns: profile.pronouns,
        birthday: profile.birthday,
        personalNote: profile.personalNote,
      });
    }
  };

  return useMemo(() => {
    const hasSavedProfile = Boolean(user && profile?.onboardingCompleted);

    return {
      // Supabase is authoritative after onboarding. Mia and Alex exist only as
      // the public preview before a real profile has been completed.
      partnerA: hasSavedProfile
        ? profile!.displayName
        : DEFAULT_COUPLE.partnerA,
      partnerB: hasSavedProfile
        ? partner?.displayName || 'Your person'
        : DEFAULT_COUPLE.partnerB,
      cityA: hasSavedProfile
        ? profile!.city
        : DEFAULT_COUPLE.cityA || 'Calgary',
      cityB: hasSavedProfile
        ? partner?.city || 'Their city'
        : DEFAULT_COUPLE.cityB || 'Jakarta',
      timezoneA: hasSavedProfile ? profile!.timezone : 'America/Edmonton',
      timezoneB: hasSavedProfile ? partner?.timezone || '' : 'Asia/Jakarta',
      latitudeA: hasSavedProfile ? profile!.latitude : null,
      longitudeA: hasSavedProfile ? profile!.longitude : null,
      latitudeB: hasSavedProfile ? partner?.latitude ?? null : null,
      longitudeB: hasSavedProfile ? partner?.longitude ?? null : null,
      avatarA: hasSavedProfile ? profile!.avatarUrl : null,
      avatarB: hasSavedProfile ? partner?.avatarUrl || null : null,
      roomCode: space?.activeRoomCode || localProfile.roomCode || '',
      updateProfile,
      isPersonalized: hasSavedProfile,
      partnerConnected: Boolean(partner),
    };
  }, [user, profile, partner, space, localProfile.roomCode, updateProfile]);
}
