/**
 * Cupidot — On-Device Cheeky, Naughty, Romantic Heuristic Intelligence Engine
 * Acts as the witty, teasing companion mascot and provides zero-latency fallback
 * when external AI APIs time out or fail.
 */

import { QuestionRequest, GeneratedQuestion } from './gemini';

export interface CupidotDilemma {
  question: string;
  options: string[];
  commentary: string;
  tag: 'spicy' | 'romantic' | 'playful' | 'deep';
}

export const CUPIDOT_THOUGHTS = [
  "Analyzing your chaotic couple chemistry... 💭",
  "Calculating who loves who more... 💘",
  "Detecting unspoken tension across the ocean... 😏",
  "Cooking up a dilemma you're both gonna blush at... 🌶️",
  "Checking flight prices so you two stop whining... ✈️",
  "Consulting the Cupid tribunal on who texts first... ⚖️",
  "Measuring heartbeats across two timezones... 💓",
  "Wondering who gives in first when an argument starts... 🤭",
  "Calibrating romantic mischief levels... ✨",
  "Reading between the lines of your last text... 💌",
];

export function getRandomCupidotThought(): string {
  return CUPIDOT_THOUGHTS[Math.floor(Math.random() * CUPIDOT_THOUGHTS.length)];
}

const POOL_MATCH_DILEMMAS: (a: string, b: string) => CupidotDilemma[] = (a, b) => [
  {
    question: `You two matched suspiciously fast. Since you're clearly reading each other's minds, what's the first thing that happens when the bedroom door closes on reunion night?`,
    options: [
      `A 10-minute bear hug where nobody speaks`,
      `Collapsing on the bed exhausted but refusing to let go`,
      `An immediate passionate reunion kiss`,
      `Ordering massive room service in robes`,
    ],
    commentary: `Cupidot: "Suspiciously in sync... are you two actually telepathic or just shamelessly obsessed with each other? 🤭"`,
    tag: 'spicy',
  },
  {
    question: `Since ${a} and ${b} are so perfectly aligned: who is secretly the bigger clingy baby when you're both sick?`,
    options: [
      `${a} wants 24/7 forehead kisses and soup`,
      `${b} pretends to be tough but pouts constantly`,
      `Both of us whine equally across FaceTime`,
      `Strictly dependent on who got sick first`,
    ],
    commentary: `Cupidot: "High synergy detected, but let's expose the real softie in this relationship! 😏"`,
    tag: 'playful',
  },
  {
    question: `You both picked the cozy romantic option! When you finally wake up together on a Sunday with zero plans, who refuses to leave bed first?`,
    options: [
      `${a} traps ${b} in a morning cuddle lock`,
      `${b} refuses to open their eyes until kissed`,
      `Neither—we stay in bed scrolling reels together until noon`,
      `Whoever is closest to the coffee maker loses and gets up`,
    ],
    commentary: `Cupidot: "Aww. You two make distance look easy. Don't worry, I'm taking notes for your wedding speech 💍"`,
    tag: 'romantic',
  },
];

const POOL_CLASH_DILEMMAS: (a: string, b: string) => CupidotDilemma[] = (a, b) => [
  {
    question: `Total disagreement alert! When ${a} and ${b} have a petty argument on video call, who is the first one to break and smile?`,
    options: [
      `${a} makes a stupid funny face to break the tension`,
      `${b} can't stay mad for more than 4 minutes`,
      `Both stare silently until someone bursts out laughing`,
      `We send an aggressive meme as a peace treaty`,
    ],
    commentary: `Cupidot: "A classic standoff! Someone is definitely sleeping on the far side of the bed during reunion week 😏"`,
    tag: 'playful',
  },
  {
    question: `${a} chose adventure while ${b} chose comfort. We're in Tokyo with 3 hours left before our flight: who wins the itinerary duel?`,
    options: [
      `${a} drags ${b} to one last hidden ramen spot`,
      `${b} convinces ${a} to sit at the airport cafe and relax`,
      `We compromise and get lost in a train station together`,
      `We sprint through duty-free buying everything in sight`,
    ],
    commentary: `Cupidot: "Mia wants romance, Alex wants chaos. This is why you two need couple diplomacy 🤭"`,
    tag: 'playful',
  },
  {
    question: `You two answered totally differently! Be brutally honest: who gets more jealous when a cute stranger flirts with the other?`,
    options: [
      `${a} plays it cool outside but fumes inside`,
      `${b} immediately marks territory with an arm around the waist`,
      `Neither—we hype each other up and laugh about it`,
      `Whoever is further away across the timezone suffers more`,
    ],
    commentary: `Cupidot: "Ooh, a little spicy territorial instinct across the miles! I love the drama 🌶️"`,
    tag: 'spicy',
  },
];

const POOL_SPICY_POKE_DILEMMAS: (a: string, b: string) => CupidotDilemma[] = (a, b) => [
  {
    question: `Poke penalty! What is the one thing ${a} does on video call that secretly drives ${b} completely crazy?`,
    options: [
      `Wearing that one oversized hoodie that looks way too cute`,
      `Biting their lip when thinking or concentrating`,
      `The sleepy, husky morning voice before coffee`,
      `Laughing so hard they look away from the camera`,
    ],
    commentary: `Cupidot: "11,420 km away and you're still making each other blush through a phone screen? Shameless. 💖"`,
    tag: 'spicy',
  },
  {
    question: `Late-night confession: if we were stuck in an elevator for 4 hours with no cell service, what happens by hour two?`,
    options: [
      `Deepest childhood secrets come spilling out`,
      `Making out in the corner away from the security camera`,
      `Inventing an entire delusional comedy podcast together`,
      `Napping on the floor using a jacket as a shared pillow`,
    ],
    commentary: `Cupidot: "Poked for drama and drama was delivered! Don't look at me, answer the question 😏"`,
    tag: 'spicy',
  },
  {
    question: `Reunion countdown test: When you finally see each other at arrivals, what is the exact duration of the first kiss?`,
    options: [
      `Quick sweet peck because people are watching, then a massive hug`,
      `A slow, cinematic movie kiss like nobody else exists in the airport`,
      `A tearful, messy giggle-kiss with luggage dropped on the floor`,
      `Forehead kiss first, then holding each other's faces`,
    ],
    commentary: `Cupidot: "Airports were built for romance. Keep your eyes on each other, lovers ✈️"`,
    tag: 'romantic',
  },
  {
    question: `Midnight dilemma: Who is more guilty of texting 'I'm going to sleep now' and then staying awake for 45 minutes on Instagram?`,
    options: [
      `${a} 100%—caught red-handed by the 'Active 5m ago' badge`,
      `${b} sends 6 TikToks right after saying goodnight`,
      `Both of us say goodnight three separate times before actually sleeping`,
      `Whoever's timezone is currently in the daylight hours`,
    ],
    commentary: `Cupidot: "The universal long-distance couple crime has been detected! 🚨"`,
    tag: 'playful',
  },
];

/**
 * Generates an on-device contextual dilemma in Cupidot's cheeky voice.
 */
export function generateCupidotDilemma(req: QuestionRequest): GeneratedQuestion {
  const nameA = req.partnerA?.name || 'Mia';
  const nameB = req.partnerB?.name || 'Alex';
  const ansA = (req.partnerA?.answer || '').toLowerCase();
  const ansB = (req.partnerB?.answer || '').toLowerCase();

  // Determine match vs clash
  const isMatch = ansA.length > 0 && (ansA === ansB || ansA.includes(ansB) || ansB.includes(ansA));

  const pool = isMatch
    ? POOL_MATCH_DILEMMAS(nameA, nameB)
    : POOL_CLASH_DILEMMAS(nameA, nameB);

  const selected = pool[Math.floor(Math.random() * pool.length)];

  return {
    question: selected.question,
    options: selected.options,
    commentary: selected.commentary,
    source: 'fallback',
  };
}

/**
 * Returns a cheeky dilemma when the user manually pokes Cupidot.
 */
export function getPokedCupidotDilemma(nameA = 'Mia', nameB = 'Alex'): CupidotDilemma {
  const all = POOL_SPICY_POKE_DILEMMAS(nameA, nameB);
  return all[Math.floor(Math.random() * all.length)];
}
