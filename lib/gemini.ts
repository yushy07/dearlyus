/** Gemini is invoked through Supabase Edge Functions; no model key is sent to the browser. */
import { getSupabase } from './supabase';
import { generateCupidotDilemma } from './cupidot';

export interface QuestionRequest {
  partnerA: { name: string; answer: string };
  partnerB: { name: string; answer: string };
  mode: 'quiz' | 'cards' | 'host';
  mood?: 'romantic' | 'playful' | 'deep' | 'spicy';
  history?: Array<{ question: string; answerA: string; answerB: string }>;
  currentTopic?: string;
  aiConsent?: boolean;
}

export interface GeneratedQuestion { question: string; options: string[]; commentary?: string; source: 'gemini' | 'fallback'; }

export async function generateAdaptiveQuestion(req: QuestionRequest): Promise<GeneratedQuestion> {
  if (!req.aiConsent) return generateCupidotDilemma(req);
  const supabase = getSupabase();
  if (!supabase) return generateCupidotDilemma(req);
  try {
    const { data, error } = await supabase.functions.invoke('gemini', { body: req });
    if (error || !data?.question || !Array.isArray(data.options)) return generateCupidotDilemma(req);
    return { question: data.question, options: data.options.slice(0, 4), commentary: data.commentary, source: 'gemini' };
  } catch { return generateCupidotDilemma(req); }
}
