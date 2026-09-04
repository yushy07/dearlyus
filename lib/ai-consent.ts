'use client';

import { useEffect, useState } from 'react';

const AI_CONSENT_KEY = 'dearly_ai_followups_consent';

export function useAiConsent() {
  const [hasAiConsent, setHasAiConsent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasAiConsent(localStorage.getItem(AI_CONSENT_KEY) === 'true');
    setIsLoaded(true);
    const syncConsent = () => setHasAiConsent(localStorage.getItem(AI_CONSENT_KEY) === 'true');
    window.addEventListener('dearly_ai_consent_changed', syncConsent);
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener('dearly_ai_consent_changed', syncConsent);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  const setAiConsent = (enabled: boolean) => {
    setHasAiConsent(enabled);
    localStorage.setItem(AI_CONSENT_KEY, String(enabled));
    window.dispatchEvent(new Event('dearly_ai_consent_changed'));
  };

  return { hasAiConsent, setAiConsent, isLoaded };
}
