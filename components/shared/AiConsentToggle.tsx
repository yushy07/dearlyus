'use client';

import { useAiConsent } from '@/lib/ai-consent';

export function AiConsentToggle() {
  const { hasAiConsent, setAiConsent, isLoaded, error } = useAiConsent();

  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '9px',
          color: 'var(--ink-soft)',
          fontSize: '12px',
          lineHeight: 1.45,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={hasAiConsent}
          disabled={!isLoaded}
          onChange={(event) => {
            void setAiConsent(event.target.checked).catch(() => {});
          }}
          style={{ marginTop: '3px', accentColor: 'var(--pink)' }}
        />
        <span>
          Use AI-powered follow-ups. My answers and the names I enter may be sent
          to Google Gemini to create the next question. Photos and camera feeds
          are never sent.
        </span>
      </label>
      {error && (
        <div
          role="alert"
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: '#B91C1C',
            background: '#FEE2E2',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
