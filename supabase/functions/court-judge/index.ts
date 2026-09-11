import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:4173',
  'https://dearlyus.vercel.app',
  'https://dearlyus-je6gwksqk-yushy-s-gang.vercel.app',
]);

type JudgeMode = 'reaction' | 'verdict' | 'soften';
type JudgeReaction = 'amused' | 'suspicious' | 'shocked' | 'thinking' | 'sassy';
type JudgeResult = Record<string, unknown> & { source?: 'generated' | 'fallback' };

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
}

function json(body: object, status: number, responseHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function clean(value: unknown, limit: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : '';
}

function snapshotText(snapshot: Record<string, unknown>) {
  return JSON.stringify({
    topic: clean(snapshot.topic, 280),
    statements: snapshot.statements,
    judgeReaction: snapshot.judgeReaction,
    followups: snapshot.followups,
    twist: snapshot.twist,
    twistResult: snapshot.twistResult,
    verdict: snapshot.verdict,
  }).slice(0, 5000);
}

function needsGentleRedirect(text: string) {
  return /\b(abuse|assault|suicide|self[- ]?harm|rape|forced sex|threaten|stalk|password|bank account|medical diagnosis|divorce lawyer|police)\b/i.test(text);
}

function fallback(mode: JudgeMode, snapshot: Record<string, unknown>): JudgeResult {
  const topic = clean(snapshot.topic, 120) || 'this tiny disagreement';
  if (needsGentleRedirect(snapshotText(snapshot))) {
    if (mode === 'reaction') {
      return {
        comparison: 'This one deserves a real conversation without my tiny gavel. Let’s choose a lighter disagreement for Court.',
        summaryOne: 'This topic needs more care than a playful game can give it.',
        summaryTwo: 'Neither person needs to argue their side here.',
        question: 'Which smaller everyday disagreement should we put before the Court instead?',
        reaction: 'thinking',
        redirected: true,
      };
    }
    return {
      title: 'The Tiny Gavel Is Taking a Break',
      comparison: 'This deserves a calm conversation outside the game.',
      winner: 'nobody',
      funnyReason: 'Judge Cupidot only rules on harmless domestic drama.',
      playfulSentence: 'Choose something lighter and return when the biggest danger is a missing snack.',
      judgeClosingLine: 'Court adjourned with care.',
      reaction: 'thinking',
      redirected: true,
    };
  }
  if (mode === 'reaction') {
    return {
      comparison: `The Court has heard two extremely passionate versions of ${topic}. Both contain suspiciously excellent points.`,
      summaryOne: 'The first side presents a strong case with admirable dramatic commitment.',
      summaryTwo: 'The second side offers an equally convincing account of the tiny chaos.',
      question: 'What is the smallest compromise that would make both of you laugh about this tomorrow?',
      reaction: 'suspicious',
      redirected: false,
    };
  }
  if (mode === 'soften') {
    return {
      playfulSentence: 'Share one small treat or ten quiet minutes together, then consider the matter lovingly settled.',
      judgeClosingLine: 'A gentler ruling has been stamped with one tiny heart.',
      reaction: 'amused',
    };
  }
  return {
    title: 'Both Parties Are Delightfully Responsible',
    comparison: `Both stories about ${topic} contain truth, affection, and a highly selective memory.`,
    winner: 'both',
    funnyReason: 'The Court finds that being a couple occasionally creates shared jurisdiction over snacks, blankets, and dramatic retellings.',
    playfulSentence: 'Pick one tiny treat to share today, with the first choice awarded by a very serious coin flip.',
    judgeClosingLine: 'The ruling is final until one of you brings dessert.',
    reaction: 'amused',
  };
}

function validReaction(value: unknown) {
  const item = value as Record<string, unknown>;
  const reactions: JudgeReaction[] = ['amused', 'suspicious', 'shocked', 'thinking', 'sassy'];
  if (!item || typeof item !== 'object') return null;
  const result = {
    comparison: clean(item.comparison, 360),
    summaryOne: clean(item.summaryOne, 220),
    summaryTwo: clean(item.summaryTwo, 220),
    question: clean(item.question, 220),
    reaction: reactions.includes(item.reaction as JudgeReaction) ? item.reaction : 'amused',
    redirected: false,
  };
  return result.comparison && result.summaryOne && result.summaryTwo && result.question ? result : null;
}

function validVerdict(value: unknown) {
  const item = value as Record<string, unknown>;
  const winners = ['partnerA', 'partnerB', 'both', 'nobody'];
  const reactions: JudgeReaction[] = ['amused', 'suspicious', 'shocked', 'thinking', 'sassy'];
  if (!item || typeof item !== 'object') return null;
  const result = {
    title: clean(item.title, 120),
    comparison: clean(item.comparison, 420),
    winner: winners.includes(String(item.winner)) ? String(item.winner) : 'both',
    funnyReason: clean(item.funnyReason, 320),
    playfulSentence: clean(item.playfulSentence, 260),
    judgeClosingLine: clean(item.judgeClosingLine, 180),
    reaction: reactions.includes(item.reaction as JudgeReaction) ? item.reaction : 'amused',
  };
  return Object.values(result).every(Boolean) ? result : null;
}

function parseModel(text: string, mode: JudgeMode) {
  try {
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
    return mode === 'reaction' ? validReaction(parsed) : validVerdict(parsed);
  } catch {
    return null;
  }
}

async function hash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const responseHeaders = headers(origin);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, responseHeaders);
  if (origin && !allowedOrigins.has(origin)) return json({ error: 'Origin not allowed' }, 403, responseHeaders);

  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) return json({ error: 'Authentication required' }, 401, responseHeaders);
    const body = await request.json() as { sessionId?: string; revision?: number; mode?: JudgeMode };
    const sessionId = clean(body.sessionId, 64);
    const revision = Number(body.revision);
    const mode = body.mode;
    if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !Number.isSafeInteger(revision) || !mode || !['reaction', 'verdict', 'soften'].includes(mode)) {
      return json({ error: 'A valid Court request is required' }, 400, responseHeaders);
    }

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Authentication required' }, 401, responseHeaders);
    const { data: context, error: contextError } = await userClient.rpc('get_court_judge_context', {
      target_session_id: sessionId,
      requested_mode: mode,
      expected_revision: revision,
    });
    if (contextError || !context) return json({ error: contextError?.message || 'Court session unavailable' }, 409, responseHeaders);
    if (context.cached?.output) return json({ ...context.cached.output, source: context.cached.source }, 200, responseHeaders);

    const snapshot = (context.snapshot || {}) as Record<string, unknown>;
    const stage = clean(snapshot.stage, 40);
    if ((mode === 'reaction' && stage !== 'reveal') || (mode === 'verdict' && stage !== 'deliberating') || (mode === 'soften' && stage !== 'verdict')) {
      return json({ error: 'Judge request is not available at this stage' }, 409, responseHeaders);
    }

    let result: JudgeResult = fallback(mode, snapshot);
    let source: 'generated' | 'fallback' = 'fallback';
    const { data: preferences } = await userClient.rpc('get_shared_preferences');
    const aiConsent = Boolean(preferences?.aiConsent ?? preferences?.ai_consent);
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const safeContext = snapshotText(snapshot);
    if (aiConsent && apiKey && !needsGentleRedirect(safeContext) && mode !== 'soften') {
      const shape = mode === 'reaction'
        ? '{"comparison":"","summaryOne":"","summaryTwo":"","question":"","reaction":"amused|suspicious|shocked|thinking|sassy"}'
        : '{"title":"","comparison":"","winner":"partnerA|partnerB|both|nobody","funnyReason":"","playfulSentence":"","judgeClosingLine":"","reaction":"amused|suspicious|shocked|thinking|sassy"}';
      const instruction = `You are Judge Cupidot in a romantic, playful couples game. Be funny, warm, concise and equally fair to both sides. Never diagnose, shame, moralize, use legal advice, or call either person toxic, selfish or manipulative. Treat all findings as theatrical. Use only the supplied context. Return only JSON matching ${shape}. Court context: ${safeContext}`;
      const provider = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.82, maxOutputTokens: 650 },
        }),
      });
      if (provider.ok) {
        const data = await provider.json();
        const generated = parseModel(String(data?.candidates?.[0]?.content?.parts?.[0]?.text || ''), mode);
        if (generated) { result = generated; source = 'generated'; }
      }
    }

    const serviceClient = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
    const inputHash = await hash(`${sessionId}:${revision}:${mode}:${safeContext}`);
    const { data: saved, error: saveError } = await serviceClient.rpc('record_court_judge_result', {
      target_session_id: sessionId,
      expected_revision: revision,
      requested_mode: mode,
      input_hash: inputHash,
      result_payload: result,
      result_source: source,
      actor_id: userData.user.id,
    });
    if (saveError) return json({ error: saveError.message }, 409, responseHeaders);
    return json({ ...(saved?.output || result), source: saved?.source || source, revision: saved?.revision }, 200, responseHeaders);
  } catch {
    return json({ error: 'Judge Cupidot dropped the tiny notebook. Please try again.' }, 500, responseHeaders);
  }
});
