'use client';

import { useEffect, useState } from 'react';
import { useCoupleSpace } from '@/contexts/CoupleSpaceContext';

const AI_CONSENT_KEY = 'dearly_ai_followups_consent';

export function useAiConsent() {
  const [hasAiConsent, setHasAiConsent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { preferences, space, savePreferences } = useCoupleSpace();

  useEffect(() => {
    const persisted = preferences?.aiConsent;
    setHasAiConsent(
      persisted ?? (!space && localStorage.getItem(AI_CONSENT_KEY) === 'true'),
    );
    setIsLoaded(true);
    const syncConsent = () => {
      if (!space)
        setHasAiConsent(localStorage.getItem(AI_CONSENT_KEY) === 'true');
    };
    window.addEventListener('dearly_ai_consent_changed', syncConsent);
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener('dearly_ai_consent_changed', syncConsent);
      window.removeEventListener('storage', syncConsent);
    };
  }, [preferences?.aiConsent, space]);

  const setAiConsent = async (enabled: boolean) => {
    const previous = hasAiConsent;
    setError(null);
    setHasAiConsent(enabled);
    if (!space) {
      localStorage.setItem(AI_CONSENT_KEY, String(enabled));
      window.dispatchEvent(new Event('dearly_ai_consent_changed'));
    }

    // A local preference can drive offline fallbacks, but live AI permission is
    // couple-owned and must be persisted before the Edge Function may use it.
    if (space) {
      if (!preferences) {
        setHasAiConsent(previous);
        throw new Error(
          'Your shared preferences are still loading. Please try again.',
        );
      }
      try {
        const { updatedAt: _updatedAt, ...current } = preferences;
        await savePreferences({ ...current, aiConsent: enabled });
      } catch (err: any) {
        setHasAiConsent(previous);
        setError(
          err?.message ||
            'Could not update AI consent on server. Setting restored.',
        );
        throw err;
      }
    }
  };

  return {
    hasAiConsent,
    setAiConsent,
    isLoaded,
    error,
    clearError: () => setError(null),
  };
}
