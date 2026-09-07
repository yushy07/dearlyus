/**
 * Cupidot AI Integration with Supabase Edge Functions & Client-Side Privacy Firewall
 *
 * Enforces strict consent checks and data sanitization:
 * - Strips invite codes, room codes, session tokens, passwords, images, and precise locations.
 * - Only sends revealed, non-sensitive activity answers with active couple consent.
 * - Guarantees zero blocking: automatically falls back to deterministic on-device Cupidot
 *   engine whenever consent is absent, network is offline, or AI returns an invalid response.
 */
import { getSupabase } from './supabase';
import { generateCupidotDilemma } from './cupidot';

export interface QuestionRequest {
  /** A live UUID activity session. The Edge Function derives all private context from it. */
  sessionId?: string;
  partnerA: { name: string; answer: string };
  partnerB: { name: string; answer: string };
  mode: 'quiz' | 'cards' | 'host';
  mood?: 'romantic' | 'playful' | 'deep' | 'spicy';
  history?: Array<{ question: string; answerA: string; answerB: string }>;
  currentTopic?: string;
  aiConsent?: boolean;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  commentary?: string;
  source: 'gemini' | 'fallback';
}

/**
 * Explains Cupidot's privacy policy and data boundaries clearly for couple consent.
 */
export const CUPIDOT_CONSENT_EXPLANATION = {
  title: 'Cupidot AI Consent & Privacy Boundaries',
  summary:
    'Cupidot uses revealed date-night answers to suggest thoughtful, playful next questions that weave your shared inside jokes together.',
  allowed: [
    'Your entered display names',
    'Revealed answers from completed rounds',
    'Selected mood (e.g. playful, romantic, deep)',
  ],
  strictlyForbidden: [
    'Camera feeds, photos, and photostrips',
    'Invite codes and room codes',
    'Session tokens and credentials',
    'Precise location and GPS data',
    'Unrevealed or secret hidden answers',
    'Unrelated account history',
  ],
  ethicalRules: [
    'Never diagnoses or psychoanalyzes',
    'Never shames, pressures, or judges',
    'Never presents an inference as fact',
    'Always provides instant local fallbacks',
  ],
};

/**
 * Sanitizes the outbound payload so that no secret, sensitive, or oversized
 * data can ever reach the external AI model or edge function.
 */
export function sanitizeCupidotPayload(req: QuestionRequest): QuestionRequest {
  const sanitizeText = (text: unknown, maxLen = 280): string => {
    if (typeof text !== 'string') return '';
    // Strip URLs with query tokens, data URLs / base64 images, and excessive whitespace
    return text
      .replace(/data:image\/[^;]+;base64,[^\s]+/gi, '[image removed]')
      .replace(/https?:\/\/[^\s]+/gi, '[link]')
      .replace(/[A-Za-z0-9_-]{24,}/g, '') // strip potential high-entropy API tokens / codes
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLen);
  };

  const sanitizeName = (name: unknown): string => {
    return sanitizeText(name, 40) || 'Partner';
  };

  const sanitizedA = {
    name: sanitizeName(req.partnerA?.name),
    answer: sanitizeText(req.partnerA?.answer),
  };

  const sanitizedB = {
    name: sanitizeName(req.partnerB?.name),
    answer: sanitizeText(req.partnerB?.answer),
  };

  const sanitizedHistory = Array.isArray(req.history)
    ? req.history.slice(-6).map((h) => ({
        question: sanitizeText(h.question, 180),
        answerA: sanitizeText(h.answerA, 140),
        answerB: sanitizeText(h.answerB, 140),
      }))
    : [];

  return {
    sessionId: typeof req.sessionId === 'string' ? req.sessionId : undefined,
    partnerA: sanitizedA,
    partnerB: sanitizedB,
    mode: req.mode || 'quiz',
    mood: req.mood || 'playful',
    history: sanitizedHistory,
    currentTopic: sanitizeText(req.currentTopic, 60),
    aiConsent: Boolean(req.aiConsent),
  };
}

/**
 * Generates an adaptive date-night question.
 * If consent is disabled, Supabase is unconfigured, or the model fails/times out,
 * it seamlessly returns a rich, curated procedural question from the on-device Cupidot engine.
 */
export async function generateAdaptiveQuestion(req: QuestionRequest): Promise<GeneratedQuestion> {
  // 1. Check explicit consent
  if (!req.aiConsent) {
    return generateCupidotDilemma(req);
  }

  // 2. Sanitize outbound context
  const cleanReq = sanitizeCupidotPayload(req);

  const supabase = getSupabase();
  // Never transmit answer history, names, or consent from the browser. A live
  // session lets the Edge Function derive only server-authorized revealed data.
  if (!supabase || !cleanReq.sessionId) {
    return generateCupidotDilemma(cleanReq);
  }

  try {
    // Invoke Supabase Edge Function with sanitized context
    const { data, error } = await supabase.functions.invoke('gemini', {
      body: {
        sessionId: cleanReq.sessionId,
        mode: cleanReq.mode,
        mood: cleanReq.mood,
      },
    });

    if (error || !data?.question || !Array.isArray(data.options) || data.options.length < 2) {
      return generateCupidotDilemma(cleanReq);
    }

    // Clean response before returning to view
    const cleanQuestion = String(data.question).trim().slice(0, 240);
    const cleanOptions = data.options
      .map((opt: unknown) => String(opt || '').trim().slice(0, 90))
      .filter(Boolean)
      .slice(0, 4);
    const cleanCommentary = data.commentary ? String(data.commentary).trim().slice(0, 200) : undefined;

    return {
      question: cleanQuestion,
      options: cleanOptions,
      commentary: cleanCommentary,
      source: 'gemini',
    };
  } catch {
    // Guarantees zero blocking: fail gracefully to deterministic on-device engine
    return generateCupidotDilemma(cleanReq);
  }
}
