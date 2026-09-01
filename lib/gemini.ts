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
      options: ["Alex gets 70% space, Mia gets 30%", "Mia gets 70% space, Alex gets 30%", "Strict 50/50 division with a scale", "Buy everything at the destination"],
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

/**
 * Generates the next question via Gemini Flash or seamlessly returns localized fallback.
 */
export async function generateAdaptiveQuestion(req: QuestionRequest): Promise<GeneratedQuestion> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modeKey = req.mode || 'quiz';
  const fallbackPool = LOCAL_FALLBACK_QUESTIONS[modeKey] || LOCAL_FALLBACK_QUESTIONS.quiz;
  const fallbackChoice = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

  if (!apiKey) {
    return fallbackChoice;
  }

  try {
    const prompt = `You are the witty, warm, and observant host of a date night game for a long-distance couple named ${req.partnerA.name} and ${req.partnerB.name}.
Previous Round:
- ${req.partnerA.name} answered: "${req.partnerA.answer}"
- ${req.partnerB.name} answered: "${req.partnerB.answer}"
${req.history?.length ? `Recent Context: ${JSON.stringify(req.history.slice(-2))}` : ''}
Mode: ${req.mode}
Mood: ${req.mood || 'playful and romantic'}

Generate the next custom follow-up question that builds directly upon their previous answers or playfully connects their two distinct personalities.
Return ONLY valid JSON matching this exact schema:
{
  "question": "The question string",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "commentary": "A short, witty 1-sentence observational reaction to their previous picks"
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
      return fallbackChoice;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallbackChoice;

    const parsed = JSON.parse(text);
    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length < 2) {
      return fallbackChoice;
    }

    return {
      question: parsed.question,
      options: parsed.options.slice(0, 4),
      commentary: parsed.commentary || 'Observing your couple synergy!',
      source: 'gemini',
    };
  } catch {
    return fallbackChoice;
  }
}
