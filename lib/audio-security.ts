/**
 * Audio URL Sanitization Utilities
 * Mitigates:
 * - DOM-based XSS (CWE-79, CWE-116, CodeQL js/xss-through-dom)
 * - Client-side URL Redirection / Resource Injection (CWE-601, CodeQL js/client-side-unvalidated-url-redirection)
 * - Incomplete URL Scheme Check (CWE-20, CWE-184, CodeQL js/incomplete-url-scheme-check)
 */

/**
 * Sanitizes voice note and audio URLs before passing to <audio> src or media sinks.
 * Strictly enforces an allowlist of trusted audio schemes:
 * - blob: URLs with verified http/https origins (client-side recorded voice notes via URL.createObjectURL)
 * - data:audio/* (safe base64 audio data streams with strict audio MIME verification)
 * - Safe relative paths (e.g., /audio/whisper.mp3)
 * - Valid http: / https: URLs with verified protocols
 *
 * All other schemes, malformed URLs, and inputs with HTML meta-characters are rejected.
 * Encodes output via encodeURI to prevent DOM text reinterpretation as HTML.
 * Returns undefined for any invalid or unsafe input.
 */
export function sanitizeSafeAudioUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Reject unencoded HTML meta-characters that could break attribute contexts
  if (/[<>"']/.test(trimmed)) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();

  // Allowlist 1: blob: URLs (for client-side recorded voice notes created via URL.createObjectURL)
  if (lower.startsWith('blob:')) {
    try {
      const withoutBlob = trimmed.slice(5);
      const innerUrl = new URL(withoutBlob);
      if (innerUrl.protocol === 'http:' || innerUrl.protocol === 'https:') {
        return encodeURI(trimmed);
      }
    } catch {
      if (/^blob:https?:\/\/[a-zA-Z0-9._:-]+\/[a-zA-Z0-9-]+$/i.test(trimmed)) {
        return encodeURI(trimmed);
      }
    }
    return undefined;
  }

  // Allowlist 2: Safe audio media data URIs (e.g. data:audio/webm;base64,...)
  // Strictly permits only base64 audio MIME types; rejects executable/script data URIs
  if (lower.startsWith('data:')) {
    if (
      /^data:audio\/(?:mpeg|mp3|wav|ogg|webm|aac|mp4|x-m4a|flac)(?:;[a-zA-Z0-9=+._-]+)*;base64,[a-zA-Z0-9+/=]+$/i.test(
        trimmed,
      )
    ) {
      return encodeURI(trimmed);
    }
    return undefined;
  }

  // Allowlist 3: Safe relative paths (e.g. /audio/whisper.mp3)
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\')
  ) {
    if (/^\/[a-zA-Z0-9_./-]+$/i.test(trimmed) && !trimmed.includes('..')) {
      return encodeURI(trimmed);
    }
    return undefined;
  }

  // Allowlist 4: Valid http / https URLs with verified protocols
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return encodeURI(parsed.href);
      }
    } catch {
      return undefined;
    }
  }

  // Reject all other schemes (e.g. javascript:, vbscript:, etc.) and invalid inputs
  return undefined;
}
