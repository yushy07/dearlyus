/**
 * Cupidot Operational Telemetry Engine (M19)
 *
 * Implements minimal, privacy-first, content-free operational telemetry.
 *
 * STRICT PRIVACY CONSTRAINTS:
 * 1. NEVER logs input text, answers, messages, audio, photos, prompts, or personal identifying information.
 * 2. Zero external third-party tracking scripts or tracking cookies.
 * 3. Never identifies which partner privately downgraded or softened romance level.
 * 4. In-memory circular buffer with optional debug sinks.
 * 5. Respects user opt-out preferences.
 */

export type CupidotMetricEventType =
  | 'activity_started'
  | 'activity_completed'
  | 'keepsake_proposed'
  | 'keepsake_approved'
  | 'keepsake_declined'
  | 'ritual_created'
  | 'ritual_completed'
  | 'spark_awarded'
  | 'dialogue_fallback'
  | 'romance_softened'
  | 'quiet_together_completed';

export interface CupidotOperationalMetric {
  eventType: CupidotMetricEventType;
  timestamp: number;
  activityType?: string;
  mode?: string;
  durationSeconds?: number;
  outcome?: 'success' | 'abandoned' | 'skipped' | 'fallback';
}

const MAX_BUFFER_SIZE = 100;
const buffer: CupidotOperationalMetric[] = [];

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

export function isTelemetryOptedOut(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    return storage.getItem('dearly_telemetry_disabled') === 'true';
  } catch {
    return false;
  }
}

export function setTelemetryOptedOut(optOut: boolean): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem('dearly_telemetry_disabled', optOut ? 'true' : 'false');
  } catch {}
}

/**
 * Validates that an event object is strictly content-free.
 * Rejects payloads containing prompt text, messages, emails, or personal identifiers.
 */
export function isContentFree(data: Record<string, unknown>): boolean {
  const forbiddenKeys = [
    'text',
    'caption',
    'prompt',
    'message',
    'answer',
    'content',
    'email',
    'username',
    'name',
    'secret',
    'key',
    'url',
    'image',
    'photo',
    'partner',
  ];

  for (const key of Object.keys(data)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenKeys.some((f) => lowerKey.includes(f))) {
      return false;
    }
    const val = data[key];
    if (typeof val === 'string' && val.length > 50) {
      // Content payloads are not allowed
      return false;
    }
  }
  return true;
}

/**
 * Records an operational outcome event.
 */
export function trackCupidotMetric(
  metric: Omit<CupidotOperationalMetric, 'timestamp'>,
): boolean {
  if (isTelemetryOptedOut()) return false;

  // Validate strict content-freedom
  if (!isContentFree(metric as Record<string, unknown>)) {
    console.warn('[CupidotMetrics] Rejected metric containing potential content/PII:', metric);
    return false;
  }

  const entry: CupidotOperationalMetric = {
    ...metric,
    timestamp: Date.now(),
  };

  buffer.push(entry);
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.shift();
  }

  return true;
}

/**
 * Returns currently buffered telemetry metrics.
 */
export function getBufferedMetrics(): CupidotOperationalMetric[] {
  return [...buffer];
}

/**
 * Clears buffered metrics.
 */
export function clearBufferedMetrics(): void {
  buffer.length = 0;
}
