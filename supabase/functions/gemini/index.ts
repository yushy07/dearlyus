import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set(['http://localhost:3000']);
const MAX_HISTORY_ITEMS = 8;
const MAX_TEXT_LENGTH = 280;

type Player = { name: string; answer?: string };
type Round = { question?: string; answerA?: string; answerB?: string };
type HostRequest = { aiConsent?: boolean; partnerA?: Player; partnerB?: Player; history?: Round[]; mode?: string; mood?: string };
type HostResponse = { question: string; options: string[]; commentary: string };

const headersFor = (origin: string | null) => ({
  'Access-Control-Allow-Origin': allowedOrigins.has(origin ?? '') ? origin! : 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  Vary: 'Origin',
});
const reply = (body: object, status: number, headers: Record<string, string>) => new Response(JSON.stringify(body), { status, headers });
const cleanText = (value: unknown, maxLength = MAX_TEXT_LENGTH) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
const cleanName = (value: unknown) => cleanText(value, 48);

const formatRound = (round: Round, index: number, partnerA: string, partnerB: string) => {
  const question = cleanText(round.question);
  const answerA = cleanText(round.answerA);
  const answerB = cleanText(round.answerB);
  return question && (answerA || answerB) ? `Round ${index + 1}: Question: ${question}\n${partnerA}: ${answerA || 'No answer'}\n${partnerB}: ${answerB || 'No answer'}` : '';
};

const parseModelJson = (text: unknown): HostResponse | null => {
  if (typeof text !== 'string') return null;
  const candidate = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  try {
    const value = JSON.parse(candidate) as Partial<HostResponse>;
    const question = cleanText(value.question, 220);
    const commentary = cleanText(value.commentary, 220);
    const options = Array.isArray(value.options) ? [...new Set(value.options.map((option) => cleanText(option, 90)).filter(Boolean))].slice(0, 4) : [];
    return question && options.length >= 2 ? { question, options, commentary: commentary || 'Cupidot is connecting the dots.' } : null;
  } catch { return null; }
};

Deno.serve(async (request) => {
  const headers = headersFor(request.headers.get('Origin'));
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405, headers);

  const authorization = request.headers.get('Authorization');
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization ?? '' } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return reply({ error: 'Sign in is required' }, 401, headers);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return reply({ error: 'AI is not configured' }, 503, headers);

  try {
    const body = await request.json() as HostRequest;
    const partnerA = cleanName(body?.partnerA?.name);
    const partnerB = cleanName(body?.partnerB?.name);
    if (!body?.aiConsent || !partnerA || !partnerB) return reply({ error: 'Consent and couple context are required' }, 400, headers);

    const currentAnswerA = cleanText(body.partnerA?.answer);
    const currentAnswerB = cleanText(body.partnerB?.answer);
    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_ITEMS).map((round, index) => formatRound(round, index, partnerA, partnerB)).filter(Boolean).join('\n\n') : '';
    const mode = cleanText(body.mode, 40) || 'couple quiz';
    const mood = cleanText(body.mood, 40) || 'playful';
    const prompt = `You are Cupidot, an emotionally intelligent, witty, consent-respecting host for ${partnerA} and ${partnerB}.

Your goal: turn their real answers into a warm next question that helps them learn something genuine, playful, or affectionate about each other. Build on a specific detail from the latest answers or history. Do not repeat a question. Do not diagnose, shame, pressure, sexualize, or make assumptions about their relationship. Keep it easy to answer together.

Session mode: ${mode}
Mood: ${mood}
Previous rounds:
${history || 'This is the first round.'}

Latest answers:
${partnerA}: "${currentAnswerA || 'No answer yet'}"
${partnerB}: "${currentAnswerB || 'No answer yet'}"

Return only valid JSON with exactly this shape:
{"question":"one concise, specific question","options":["short option","short option","short option","short option"],"commentary":"one short, warm observation"}

Rules: question under 220 characters; 2 to 4 distinct options; options under 90 characters; commentary under 220 characters.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.82, maxOutputTokens: 360 } }),
    });
    if (!response.ok) return reply({ error: 'Unable to generate a follow-up' }, 502, headers);
    const gemini = await response.json();
    const result = parseModelJson(gemini?.candidates?.[0]?.content?.parts?.[0]?.text);
    return result ? reply(result, 200, headers) : reply({ error: 'Unable to generate a follow-up' }, 502, headers);
  } catch { return reply({ error: 'Unable to generate a follow-up' }, 502, headers); }
});
