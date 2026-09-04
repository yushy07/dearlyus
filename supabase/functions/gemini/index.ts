import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set(['http://localhost:3000']);
const headersFor = (origin: string | null) => ({ 'Access-Control-Allow-Origin': allowedOrigins.has(origin ?? '') ? origin! : 'http://localhost:3000', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json', Vary: 'Origin' });
const fail = (headers: Record<string, string>) => new Response(JSON.stringify({ error: 'Unable to generate a follow-up' }), { status: 502, headers });

Deno.serve(async (request) => {
  const headers = headersFor(request.headers.get('Origin'));
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  const authorization = request.headers.get('Authorization');
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization ?? '' } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response(JSON.stringify({ error: 'Sign in is required' }), { status: 401, headers });
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return new Response(JSON.stringify({ error: 'AI is not configured' }), { status: 503, headers });
  try {
    const body = await request.json();
    if (!body?.aiConsent || !body?.partnerA?.name || !body?.partnerB?.name) return new Response(JSON.stringify({ error: 'Consent and couple context are required' }), { status: 400, headers });
    const history = Array.isArray(body.history) && body.history.length ? body.history.slice(-8).map((item: any, index: number) => `Round ${index + 1}: ${item.question} | ${body.partnerA.name}: ${item.answerA} | ${body.partnerB.name}: ${item.answerB}`).join('\n') : 'This is Round 1.';
    const prompt = `You are Cupidot, a witty romantic host for ${body.partnerA.name} and ${body.partnerB.name}.\nHistory:\n${history}\nCurrent choices: ${body.partnerA.name}: "${body.partnerA.answer}"; ${body.partnerB.name}: "${body.partnerB.answer}".\nMode: ${body.mode}. Mood: ${body.mood || 'playful'}.\nReturn only JSON: {"question":"...","options":["...","...","...","..."],"commentary":"..."}. Make the next question specifically connect their previous answers.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.85, maxOutputTokens: 300 } }) });
    if (!response.ok) return fail(headers);
    const gemini = await response.json(); const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text; const result = text ? JSON.parse(text) : null;
    if (!result?.question || !Array.isArray(result.options) || result.options.length < 2) return fail(headers);
    return new Response(JSON.stringify({ question: result.question, options: result.options.slice(0, 4), commentary: result.commentary || 'Cupidot is connecting the dots.' }), { headers });
  } catch { return fail(headers); }
});
