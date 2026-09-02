/**
 * Cupidot — Autonomous On-Device Relationship Pattern & Thread Weaving Engine
 * 
 * Deeply analyzes multi-round conversation history, detects recurring couple archetypes,
 * identifies contradictions, tracks power dynamics, and synthesizes dilemmas that
 * weave previous answers directly together.
 */

import { QuestionRequest, GeneratedQuestion } from './gemini';

export interface CupidotDilemma {
  question: string;
  options: string[];
  commentary: string;
  tag: 'spicy' | 'romantic' | 'playful' | 'deep';
  thread?: string;
}

export const CUPIDOT_THOUGHTS = [
  "Connecting threads from your previous answers... 🧵",
  "Detecting behavioral patterns between you two... 🔍",
  "Analyzing who secretly holds the relationship power... 👑",
  "Spotting funny contradictions in your choices... 🧐",
  "Weaving your late-night lore into the next dilemma... 💘",
  "Calculating compromise friction across 11,420 km... ⚡",
  "Matching your love language against your vacation instincts... 🗺️",
  "Consulting the Cupid archives on couple psychology... 🧠",
  "Crafting a dilemma neither of you can dodge... 🌶️",
  "Measuring emotional synchronicity over time... 📈",
];

export function getRandomCupidotThought(): string {
  return CUPIDOT_THOUGHTS[Math.floor(Math.random() * CUPIDOT_THOUGHTS.length)];
}

interface ThemeAnalysis {
  hasTravel: boolean;
  hasFood: boolean;
  hasSleep: boolean;
  hasIntimacy: boolean;
  hasArgument: boolean;
  hasJealousy: boolean;
  hasLateNight: boolean;
  agreementCount: number;
  totalRounds: number;
  prevRounds: Array<{ q: string; a: string; b: string }>;
}

function analyzeThemes(req: QuestionRequest): ThemeAnalysis {
  const history = req.history || [];
  const currentA = req.partnerA?.answer || '';
  const currentB = req.partnerB?.answer || '';

  const allText = [
    ...history.map((h) => `${h.question} ${h.answerA} ${h.answerB}`),
    `${currentA} ${currentB}`,
  ].join(' ').toLowerCase();

  let agreementCount = 0;
  for (const h of history) {
    if (h.answerA && h.answerB && (h.answerA === h.answerB || h.answerA.includes(h.answerB) || h.answerB.includes(h.answerA))) {
      agreementCount++;
    }
  }

  const currentMatch = currentA.length > 0 && (currentA === currentB || currentA.includes(currentB) || currentB.includes(currentA));
  if (currentMatch) agreementCount++;

  const prevRounds = history.map((h) => ({
    q: h.question,
    a: h.answerA,
    b: h.answerB,
  }));

  return {
    hasTravel: /(flight|trip|airport|travel|tokyo|paris|city|wander|pack|explore|bike|train)/.test(allText),
    hasFood: /(food|eat|ramen|dinner|coffee|cafe|pancake|snack|cook|bakery|dessert|breakfast)/.test(allText),
    hasSleep: /(sleep|bed|nap|morning|noon|wake|snooze|pajamas|exhausted|jetlag)/.test(allText),
    hasIntimacy: /(hug|cuddle|kiss|touch|holding|face|bedroom|blush|love|romantic|forehead)/.test(allText),
    hasArgument: /(argument|fight|disagree|mad|pout|silent|stubborn|yell|apologize|peace)/.test(allText),
    hasJealousy: /(jealous|flirt|territory|cute|look|stranger|protective|attention)/.test(allText),
    hasLateNight: /(late|night|3 am|midnight|camera|facetime|video|call|freeze|phone)/.test(allText),
    agreementCount,
    totalRounds: history.length + 1,
    prevRounds,
  };
}

/**
 * Procedural Pattern & Thread Weaver
 * Connects previous answers across rounds into new dilemmas
 */
export function generateCupidotDilemma(req: QuestionRequest): GeneratedQuestion {
  const nameA = req.partnerA?.name || 'Mia';
  const nameB = req.partnerB?.name || 'Alex';
  const ansA = req.partnerA?.answer || 'loving our moments';
  const ansB = req.partnerB?.answer || 'being together';

  const analysis = analyzeThemes(req);
  const totalRounds = analysis.totalRounds;
  const prevRound = analysis.prevRounds[analysis.prevRounds.length - 1];

  // --- THREAD PATTERN 1: Callback to an earlier round's specific choice ---
  if (prevRound && prevRound.a && prevRound.b) {
    const prevA = prevRound.a.length > 30 ? prevRound.a.slice(0, 28) + '...' : prevRound.a;
    const prevB = prevRound.b.length > 30 ? prevRound.b.slice(0, 28) + '...' : prevRound.b;

    if (analysis.hasFood && analysis.hasSleep) {
      return {
        question: `Connecting threads from Round 1 & 2: earlier ${nameA} leaned toward "${prevA}", while ${nameB} preferred comfort. When you finally close the distance, who is dragging whom out of bed for food at 11 PM?`,
        options: [
          `${nameA} uses puppy eyes until ${nameB} puts on shoes`,
          `${nameB} orders food delivery directly to the bed instead`,
          `Both stay in bed arguing about menus until restaurants close`,
          `Rock-paper-scissors where loser has to walk in pajamas`,
        ],
        commentary: `Cupidot [Pattern Connected]: "I detected a recurring tug-of-war between ${nameA}'s spontaneous cravings and ${nameB}'s sleep sanctuary! 🍜"`,
        source: 'fallback',
      };
    }

    if (analysis.hasTravel && analysis.hasIntimacy) {
      return {
        question: `Connecting your travel and intimacy answers: in the previous round, you chose "${prevA}" and "${prevB}". On a 14-hour flight together, who falls asleep on the other's shoulder within 20 minutes of takeoff?`,
        options: [
          `${nameA} passes out immediately using ${nameB} as a human pillow`,
          `${nameB} claims they aren't tired, then drools on ${nameA}'s jacket`,
          `Both fight over the middle armrest while holding hands`,
          `We stay awake sharing one pair of wired headphones watching movies`,
        ],
        commentary: `Cupidot [Thread Weaved]: "Tracking your journey lore: high physical affection combined with international travel endurance! ✈️"`,
        source: 'fallback',
      };
    }

    if (analysis.hasLateNight || analysis.hasArgument) {
      return {
        question: `Thread Callback: We started with late-night calls ("${prevA}"), but now we're talking habits. When a video call freezes on the most unflattering face possible, what is the immediate protocol?`,
        options: [
          `Screenshot immediately and add to the secret blackmail sticker pack`,
          `Pretend not to notice to preserve the other's dignity`,
          `Send a burst of laughing emojis and hang up to restart`,
          `Make an even uglier frozen face in solidarity`,
        ],
        commentary: `Cupidot [Inside Lore]: "I've spotted your communication archetype: 50% tender vulnerability, 50% chaotic comedy gremlin! 🤭"`,
        source: 'fallback',
      };
    }
  }

  // --- THREAD PATTERN 2: High Agreement Multi-Round Synergy ---
  if (analysis.agreementCount >= 2 && totalRounds >= 2) {
    return {
      question: `Pattern Detected: You two have agreed on almost every single round! Since you're clearly telepathic, who is the real mastermind pulling the strings in this relationship?`,
      options: [
        `${nameA} is the CEO, ${nameB} is the cheerful executive assistant`,
        `${nameB} lets ${nameA} think they're in charge, but secretly runs everything`,
        `Strict democratic anarchy where every decision takes 45 minutes`,
        `Neither—our shared one braincell rotates on odd and even days`,
      ],
      commentary: `Cupidot [Pattern Detected]: "Unusually high synchronicity score! Are you two genuinely soulmates or just flirting in front of the AI? 😏"`,
      source: 'fallback',
    };
  }

  // --- THREAD PATTERN 3: High Clash Multi-Round Dynamic ---
  if (analysis.agreementCount === 0 && totalRounds >= 2) {
    return {
      question: `Pattern Detected: Consecutive clashes! ${nameA} and ${nameB} have chosen opposite instincts across multiple rounds. When you finally move in together, who surrenders closet space first?`,
      options: [
        `${nameA} annexes 80% of the hangers within the first 48 hours`,
        `${nameB} fights for a strict 50/50 treaty with tape on the floor`,
        `Whoever has fewer clothes loses and keeps their jackets in a suitcase`,
        `We compromise by buying another wardrobe so nobody has to compromise`,
      ],
      commentary: `Cupidot [Tension Analysis]: "Notice how your opposites-attract dynamic creates maximum comedic friction? Keep that energy! ⚡"`,
      source: 'fallback',
    };
  }

  // --- THREAD PATTERN 4: Emotional Depth & Vulnerability ---
  if (analysis.hasIntimacy || analysis.hasJealousy) {
    return {
      question: `Deep Thread: In this round, ${nameA} answered "${ansA.slice(0, 24)}" and ${nameB} chose "${ansB.slice(0, 24)}". If either of you had a genuinely horrible day, what brings your heart back to life faster than anything?`,
      options: [
        `An uninterrupted voice note reminding you why everything will be okay`,
        `A surprise food delivery arriving at your door from across the world`,
        `Falling asleep together on call with no pressure to talk`,
        `A goofy 60-second video making fun of the entire situation`,
      ],
      commentary: `Cupidot [Emotional Profile]: "Connecting your attachment styles: distance is hard, but your emotional safety net is ironclad. 💖"`,
      source: 'fallback',
    };
  }

  // --- DEFAULT ADAPTIVE THREAD ---
  return {
    question: `Looking across your answers: ${nameA} voted for "${ansA.slice(0, 26)}" while ${nameB} leaned toward "${ansB.slice(0, 26)}". On your very first morning together in person, what is the non-negotiable rule?`,
    options: [
      `No phones or alarms allowed until at least 1:00 PM`,
      `The first person awake must make the other coffee or tea in bed`,
      `A mandatory 20-minute morning cuddle where nobody speaks`,
      `Immediately putting on matching oversized shirts and taking a photostrip`,
    ],
    commentary: `Cupidot [Thread Synthesized]: "Synthesizing your contrasting vibes: romance, morning patience, and reunion anticipation! ✨"`,
    source: 'fallback',
  };
}

/**
 * Manual poke dilemma generator with cheeky relationship tests
 */
export function getPokedCupidotDilemma(nameA = 'Mia', nameB = 'Alex'): CupidotDilemma {
  const dilemmas: CupidotDilemma[] = [
    {
      question: `Poke penalty! Connecting your relationship habits: what is the one thing ${nameA} does on camera that secretly makes ${nameB}'s heart skip a beat?`,
      options: [
        `Wearing that one oversized hoodie that looks ridiculously cute`,
        `The sleepy morning voice before coffee where words are barely formed`,
        `Biting their lip when trying not to laugh at a bad joke`,
        `Staring intensely at the screen with that little warm smile`,
      ],
      commentary: `Cupidot: "11,420 km away and you're still giving each other butterflies through an iPhone? Gross. I love it. 💖"`,
      tag: 'spicy',
    },
    {
      question: `Late-night truth probe: In the hierarchy of couple confessions, who is more likely to wake up in the middle of the night just to check if the other texted?`,
      options: [
        `${nameA} checks at 3:15 AM and leaves 4 half-asleep voice notes`,
        `${nameB} claims they never do, but the 'Seen 1m ago' timestamp says otherwise`,
        `Both wake up at the exact same odd hour because of the timezone curse`,
        `Whoever has the earlier alarm suffers in silence`,
      ],
      commentary: `Cupidot: "The long-distance nocturnal check-in pattern is universal! Busted. 🚨"`,
      tag: 'playful',
    },
    {
      question: `Airport reunion thread: When you finally make eye contact at the arrivals gate, who drops their bags first to run into the other's arms?`,
      options: [
        `${nameA} sprints full speed like a romance movie scene`,
        `${nameB} pretends to walk calmly, then abandons the luggage cart`,
        `Both collide awkwardly in a tangled mess of backpacks and tears`,
        `Frozen in shock for 3 seconds before the biggest hug of the year`,
      ],
      commentary: `Cupidot: "Airports were engineered for romance. Keep counting down the days, lovers ✈️"`,
      tag: 'romantic',
    },
    {
      question: `Cheeky territorial test: When a mutual friend asks who was the one that fell in love first, how does the argument play out?`,
      options: [
        `${nameA} has timestamps, screenshots, and receipts ready to prove it`,
        `${nameB} insists they knew on day one before ${nameA} even realized`,
        `We both argue that the other fell harder and faster`,
        `A cheeky smirk because you both know the true answer`,
      ],
      commentary: `Cupidot: "Poked for drama and drama delivered! History is written by the boldest lover. 😏"`,
      tag: 'spicy',
    },
  ];

  return dilemmas[Math.floor(Math.random() * dilemmas.length)];
}
