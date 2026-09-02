/**
 * Intelligent Question Engine & Fallback Generator
 * Supports Gemini 1.5/2.5 Flash with zero-latency localized fallback.
 */

export interface QuestionRequest {
  partnerA: { name: string; answer: string };
  partnerB: { name: string; answer: string };
  mode: 'quiz' | 'cards' | 'host';
  mood?: 'romantic' | 'playful' | 'deep' | 'spicy';
  history?: Array<{ question: string; answerA: string; answerB: string }>;
  currentTopic?: string;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  commentary?: string;
  source: 'gemini' | 'fallback';
}

const LOCAL_FALLBACK_QUESTIONS: Record<string, GeneratedQuestion[]> = {
  quiz: [
    {
      question: "If we had 24 hours in a new city with no phones, what's our first move?",
      options: ["Find a cozy hidden cafe & talk", "Get lost exploring street alleys", "Visit the biggest local market", "Rent bikes and ride until sunset"],
      commentary: "Testing your spontaneous adventure synergy!",
      source: 'fallback',
    },
    {
      question: "What's the little habit of mine that secretly makes you smile the most?",
      options: ["The silly voice when sleepy", "How excited I get about good food", "Randomly sending 10 reels at once", "Singing lyrics slightly wrong"],
      commentary: "The sweetest inside jokes are in the small details.",
      source: 'fallback',
    },
    {
      question: "When we finally close the distance, what's our mandatory Sunday morning routine?",
      options: ["Slow coffee & homemade pancakes", "Sleeping in until noon uninterrupted", "Morning walk to a nearby bakery", "Cooking breakfast together in pajamas"],
      commentary: "Future morning blueprints locked in.",
      source: 'fallback',
    },
    {
      question: "Which of our late-night call memories lives rent-free in your head?",
      options: ["Falling asleep on camera together", "Laughing uncontrollably at 3 AM", "Deep talks about our 5-year dreams", "Playing games until the sun came up"],
      commentary: "Distance only makes late-night lore stronger.",
      source: 'fallback',
    },
  ],
  cards: [
    {
      question: "What was a moment this past month where you wished more than anything I was right next to you?",
      options: ["A tough day that needed a silent hug", "A hilarious moment nobody else understood", "Waking up to a beautiful morning", "Eating something so good you had to share it"],
      commentary: "Honesty card revealed.",
      source: 'fallback',
    },
    {
      question: "What is a small promise you want us to make for our next reunion?",
      options: ["No checking work emails during dates", "Cook at least 3 meals together", "Take a 4-cut photostrip every single day", "Stay up all night talking under the stars"],
      commentary: "Reunion promises locked in.",
      source: 'fallback',
    },
  ],
  host: [
    {
      question: "Scenario: You get a free weekend trip anywhere in the world, but you can only bring one backpack between the two of you. Who packs what?",
      options: ["One person gets 70% space, the other gets 30%", "Strict 50/50 division with a luggage scale", "Whoever packs first gets all the space", "Buy everything at the destination"],
      commentary: "Observing your couple packing diplomacy!",
      source: 'fallback',
    },
    {
      question: "Scenario: We're stranded at a foreign airport with a 6-hour delay and only $20. What is our survival strategy?",
      options: ["Find the quietest gate and nap together", "Buy snacks and invent silly games", "Wander duty-free testing every perfume", "Find an airport bar and interview strangers"],
      commentary: "Airport delay dynamics on the record.",
      source: 'fallback',
    },
  ],
};

import { generateCupidotDilemma } from './cupidot';

/**
 * Generates the next question via Gemini Flash or seamlessly returns Cupidot's on-device fallback.
 */
export async function generateAdaptiveQuestion(req: QuestionRequest): Promise<GeneratedQuestion> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateCupidotDilemma(req);
  }

  try {
    const historyText = req.history?.length
      ? req.history
          .map((h, i) => `Round ${i + 1}: Question: "${h.question}" -> ${req.partnerA.name}: "${h.answerA}", ${req.partnerB.name}: "${h.answerB}"`)
          .join('\n')
      : 'This is Round 1.';

    const prompt = `You are "Cupidot", the witty, cheeky, observant, romantic date host for a long-distance couple named ${req.partnerA.name} and ${req.partnerB.name}.

Multi-Round History:
${historyText}

Current Round Choices:
- ${req.partnerA.name} chose: "${req.partnerA.answer}"
- ${req.partnerB.name} chose: "${req.partnerB.answer}"
Mode: ${req.mode}
Mood: ${req.mood || 'playful, cheeky, romantic'}

CRITICAL TASK:
1. DEEPLY ANALYZE the patterns across all previous rounds and current choices. Detect recurring themes (e.g. who is the sleeper vs adventurer, who is clingier, love languages, inside jokes, vacation vs homebody instincts).
2. CONNECT THREADS: Weave together at least two distinct threads from earlier answers into the next question, referencing specific previous choices.
3. WRITE CHEEKY OBSERVATIONAL COMMENTARY: Start with "Cupidot [Pattern Detected]:" or "Cupidot [Thread Connected]:", playfully teasing them about their emerging dynamic.

Return ONLY valid JSON matching this exact schema:
{
  "question": "A tailored dilemma that explicitly references or connects threads from their earlier answers",
  "options": ["Option 1 (tailored to their dynamic)", "Option 2", "Option 3", "Option 4"],
  "commentary": "Cupidot's 1-2 sentence witty, cheeky observational reaction identifying their patterns"
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.85,
            maxOutputTokens: 300,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return generateCupidotDilemma(req);
    }

    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return generateCupidotDilemma(req);

    const parsed = JSON.parse(text);
    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length < 2) {
      return generateCupidotDilemma(req);
    }

    return {
      question: parsed.question,
      options: parsed.options.slice(0, 4),
      commentary: parsed.commentary || 'Observing your couple synergy!',
      source: 'gemini',
    };
  } catch {
    return generateCupidotDilemma(req);
  }
}
