'use client';

import { useAiConsent } from '@/lib/ai-consent';

export function AiConsentToggle() {
  const { hasAiConsent, setAiConsent, isLoaded } = useAiConsent();

  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', color: 'var(--ink-soft)', fontSize: '12px', lineHeight: 1.45, cursor: 'pointer' }}>
      <input type="checkbox" checked={hasAiConsent} disabled={!isLoaded} onChange={(event) => setAiConsent(event.target.checked)} style={{ marginTop: '3px', accentColor: 'var(--pink)' }} />
      <span>Use AI-powered follow-ups. My answers and the names I enter may be sent to Google Gemini to create the next question. Photos and camera feeds are never sent.</span>
    </label>
  );
}
