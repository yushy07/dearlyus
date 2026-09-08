/**
 * Cupidot — Autonomous On-Device Relationship Pattern & Thread Weaving Engine
 *
 * Analyzes multi-round conversation history, detects shared couple lore,
 * identifies funny contrasts, and synthesizes dilemmas that
 * weave previous answers directly together for ANY couple worldwide.
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
  "Weaving your late-night lore into tonight's moments... 💘",
  'Connecting threads from your favorite memories together... 🧵',
  'Noticing the shared inside jokes that make your story yours... ✨',
  'Holding space for whatever energy you two bring tonight... ☕',
  'Preparing a cozy little corner in Our Space for you two... 🌸',
  'Counting down the shared laughs across the miles... ✈️',
  'Curling up peacefully while you two talk, create, and plan... 🌙',
  'Matching your spontaneous ideas against your cozy instincts... 🗺️',
  'Safeguarding your sealed answers and private drafts... 💌',
  'Celebrating another irreplaceable chapter in your story... 💖',
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
  hasTradition: boolean;
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
  ]
    .join(' ')
    .toLowerCase();

  let agreementCount = 0;
  for (const h of history) {
    if (
      h.answerA?.trim() &&
      h.answerB?.trim() &&
      (h.answerA === h.answerB ||
        h.answerA.includes(h.answerB) ||
        h.answerB.includes(h.answerA))
    ) {
      agreementCount++;
    }
  }

  const currentMatch =
    currentA.trim().length > 0 &&
    currentB.trim().length > 0 &&
    (currentA === currentB ||
      currentA.includes(currentB) ||
      currentB.includes(currentA));
  if (currentMatch) agreementCount++;

  const prevRounds = history.map((h) => ({
    q: h.question,
    a: h.answerA,
    b: h.answerB,
  }));

  return {
    hasTravel:
      /(flight|trip|airport|travel|city|wander|pack|explore|bike|train|hotel)/.test(
        allText,
      ),
    hasFood:
      /(food|eat|dinner|coffee|cafe|pancake|snack|cook|bakery|dessert|breakfast|ramen|pizza)/.test(
        allText,
      ),
    hasSleep:
      /(sleep|bed|nap|morning|noon|wake|snooze|pajamas|exhausted|jetlag|couch)/.test(
        allText,
      ),
    hasIntimacy:
      /(hug|cuddle|kiss|touch|holding|face|bedroom|blush|love|romantic|forehead|hand)/.test(
        allText,
      ),
    hasArgument:
      /(argument|fight|disagree|mad|pout|silent|stubborn|yell|apologize|peace|guilty)/.test(
        allText,
      ),
    hasTradition:
      /(tradition|habit|routine|anniversary|milestone|photo|memory|inside joke)/.test(
        allText,
      ),
    hasLateNight:
      /(late|night|midnight|camera|facetime|video|call|freeze|phone|text)/.test(
        allText,
      ),
    agreementCount,
    totalRounds: history.length + 1,
    prevRounds,
  };
}

/**
 * Procedural Pattern & Thread Weaver
 * Connects previous answers across rounds into new dilemmas for any couple
 */
export function generateCupidotDilemma(
  req: QuestionRequest,
): GeneratedQuestion {
  const nameA = req.partnerA?.name?.trim() || 'Partner 1';
  const nameB = req.partnerB?.name?.trim() || 'Partner 2';
  const ansA = req.partnerA?.answer || 'loving our moments';
  const ansB = req.partnerB?.answer || 'being together';

  const analysis = analyzeThemes(req);
  const totalRounds = analysis.totalRounds;
  const prevRound = analysis.prevRounds[analysis.prevRounds.length - 1];

  // --- THREAD PATTERN 1: Callback to an earlier round's specific choice ---
  if (prevRound && prevRound.a && prevRound.b) {
    const prevA =
      prevRound.a.length > 30 ? prevRound.a.slice(0, 28) + '...' : prevRound.a;
    const prevB =
      prevRound.b.length > 30 ? prevRound.b.slice(0, 28) + '...' : prevRound.b;

    if (analysis.hasFood && analysis.hasSleep) {
      return {
        question: `Connecting threads from Round 1 & 2: earlier ${nameA} leaned toward "${prevA}", while ${nameB} preferred comfort. When you finally close the distance, who is dragging whom out of bed for midnight food?`,
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
        question: `Connecting your travel and intimacy answers: in the previous round, you chose "${prevA}" and "${prevB}". On a long-haul flight together, who falls asleep on the other's shoulder within 20 minutes of takeoff?`,
        options: [
          `${nameA} passes out immediately using ${nameB} as a human pillow`,
          `${nameB} claims they aren't tired, then drools on ${nameA}'s jacket`,
          `Both fight over the middle armrest while holding hands`,
          `We stay awake sharing one pair of earphones watching movies`,
        ],
        commentary: `Cupidot [Thread Weaved]: "Tracking your journey lore: high physical affection combined with travel endurance! ✈️"`,
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
        commentary: `Cupidot [Inside Lore]: "Loving these playful late-night video call memories! 🤭"`,
        source: 'fallback',
      };
    }
  }

  // --- THREAD PATTERN 2: High Agreement Multi-Round Synergy ---
  if (analysis.agreementCount >= 2 && totalRounds >= 2) {
    return {
      question: `Shared Rhythm: You two have chosen matching options across multiple rounds! For our next question: who is more likely to propose a spontaneous midnight road trip or city walk?`,
      options: [
        `${nameA} packs a bag in 5 minutes flat`,
        `${nameB} researches snacks and navigation first`,
        `Both jump in the car with zero destination in mind`,
        `We spend an hour talking about it and stay cozy at home instead`,
      ],
      commentary: `Cupidot [Shared Rhythm]: "Matching choices on multiple rounds so far! ✨"`,
      source: 'fallback',
    };
  }

  // --- THREAD PATTERN 3: High Clash Multi-Round Dynamic ---
  if (analysis.agreementCount === 0 && totalRounds >= 2) {
    return {
      question: `Fun Contrast: Different instincts make for the best stories! When you finally unpack in your shared home, who claims closet space first?`,
      options: [
        `${nameA} annexes the main rack within the first 48 hours`,
        `${nameB} negotiates a neat 50/50 balance`,
        `Whoever has fewer clothes keeps their extra jackets stored`,
        `We compromise by adding another rack so nobody compromises`,
      ],
      commentary: `Cupidot [Playful Contrast]: "Different perspectives make conversations lively! ⚡"`,
      source: 'fallback',
    };
  }

  // --- THREAD PATTERN 4: Emotional Depth & Vulnerability ---
  if (analysis.hasIntimacy || analysis.hasTradition) {
    return {
      question: `Deep Thread: In this round, ${nameA} answered "${ansA.slice(0, 24)}" and ${nameB} chose "${ansB.slice(0, 24)}". If either of you had a genuinely horrible day, what brings your heart back to life faster than anything?`,
      options: [
        `An uninterrupted voice note reminding you why everything will be okay`,
        `A surprise food delivery arriving at your door from across the miles`,
        `Falling asleep together on call with no pressure to talk`,
        `A goofy 60-second video making fun of the entire situation`,
      ],
      commentary: `Cupidot [Emotional Profile]: "Connecting your attachment styles: distance is tough, but your emotional safety net is ironclad. 💖"`,
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
export function getPokedCupidotDilemma(
  nameA = 'Partner 1',
  nameB = 'Partner 2',
): CupidotDilemma {
  const dilemmas: CupidotDilemma[] = [
    {
      question: `Playful spark! Connecting your relationship habits: what is the one sweet quirk ${nameA} does on camera that secretly makes ${nameB}'s heart skip a beat?`,
      options: [
        `Wearing that one oversized hoodie that looks ridiculously cozy`,
        `The sleepy morning voice before coffee where words are barely formed`,
        `Biting their lip when trying not to laugh at a bad joke`,
        `Staring warmly at the screen with that little tender smile`,
      ],
      commentary: `Cupidot: "Miles apart and you're still giving each other butterflies through a screen? Gross. I love it. 💖"`,
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
        `Both collide awkwardly in a tangled mess of backpacks and happy tears`,
        `Frozen in shock for 3 seconds before the biggest hug of the year`,
      ],
      commentary: `Cupidot: "Airports were engineered for romance. Keep counting down the days, lovers ✈️"`,
      tag: 'romantic',
    },
    {
      question: `First spark confession: When reminiscing about when you two first knew this was something special, how does the story go?`,
      options: [
        `${nameA} has timestamps, screenshots, and receipts ready to prove it`,
        `${nameB} insists they knew on day one before ${nameA} even realized`,
        `We both argue that the other fell harder and faster`,
        `A cheeky smirk because you both know the true answer`,
      ],
      commentary: `Cupidot: "Poked for memories and memories delivered! Two hearts, one unforgettable story. 😏"`,
      tag: 'romantic',
    },
  ];

  return dilemmas[Math.floor(Math.random() * dilemmas.length)];
}

// ---------------------------------------------------------------------------
// 🏛️ JUDGE CUPIDOT — Couple Courtroom AI Engine
// ---------------------------------------------------------------------------

export interface CourtVerdict {
  verdictTitle: string;
  guiltyParty: string;
  reasoning: string;
  sentence: string;
}

export function judgeCourtCase(
  title: string,
  claimA: string,
  claimB: string,
  nameA = 'Partner 1',
  nameB = 'Partner 2',
): CourtVerdict {
  const combined = `${title} ${claimA} ${claimB}`.toLowerCase();

  if (/sleep|couch|nap|tired|bed|snooze|alarm/.test(combined)) {
    return {
      verdictTitle: 'Whimsical Ruling: The Great Couch-Nap Treaty 📜',
      guiltyParty: 'Neither — Mutual Play',
      reasoning: `Judge Cupidot rules this an honorable state of exhaustion. Rest is universally recognized, while sleepy evening check-ins remain cherished.`,
      sentence: `Both partners are awarded an extra cozy check-in tomorrow, plus their choice of tea or dessert.`,
    };
  }

  if (/playlist|music|song|skip|aux|sound|artist/.test(combined)) {
    return {
      verdictTitle: 'The Shared Soundstage Compromise 📻',
      guiltyParty: 'Neither — Mutual Play',
      reasoning: `Both musical curators have valid acoustic claims. Music thrives on variety and spontaneous dance parties.`,
      sentence: `Both partners take alternating turns choosing the next three songs with zero skips allowed.`,
    };
  }

  if (/hoodie|jacket|clothes|shirt|stole|wear/.test(combined)) {
    return {
      verdictTitle: 'The Cozy Wardrobe Treaty 🧥',
      guiltyParty: 'Neither — Mutual Play',
      reasoning: `Under distance relationship traditions, oversized clothing carries comfort and scent across the miles.`,
      sentence: `Shared custody approved! The borrower keeps it cozy; the lender receives an extra loving reunion hug.`,
    };
  }

  if (/read|reply|text|ignore|seen|hours|ghost/.test(combined)) {
    return {
      verdictTitle: 'The Gentle Notification Grace Period 📱',
      guiltyParty: 'Neither — Mutual Play',
      reasoning: `Busy schedules happen across time zones. Gentle check-ins without pressure keep connection restful.`,
      sentence: `Both exchange one sweet, zero-pressure audio note whenever their evening settles.`,
    };
  }

  if (/food|fries|bite|eat|dinner|hungry|share/.test(combined)) {
    return {
      verdictTitle: 'The Communal French Fry Agreement 🍟',
      guiltyParty: 'Neither — Mutual Play',
      reasoning: `A stolen French fry is the ultimate declaration of affection. Next time, order the extra-large basket!`,
      sentence: `Next date night, both agree to share dessert or order double fries right from the start.`,
    };
  }

  return {
    verdictTitle: `Whimsical Compromise on "${title.slice(0, 32)}" 🏛️`,
    guiltyParty: 'Neither — Mutual Play',
    reasoning: `After playful review of both perspectives, Judge Cupidot rules this a harmless, charming debate between ${nameA} and ${nameB}.`,
    sentence: `Both partners take a deep breath, send a silly face selfie, and share what they appreciate most about each other.`,
  };
}

// ---------------------------------------------------------------------------
// 🎙️ CUPIDOT AI DEBATE ARBITER
// ---------------------------------------------------------------------------

export interface DebateVerdict {
  winner: string;
  scoreA: number;
  scoreB: number;
  analysis: string;
  penalty: string;
}

export function judgeDebate(
  topic: string,
  argA: string,
  argB: string,
  nameA = 'Partner 1',
  nameB = 'Partner 2',
): DebateVerdict {
  const lenA = argA.trim().length;
  const lenB = argB.trim().length;
  const wordsA = argA.trim().split(/\s+/).filter(Boolean);
  const wordsB = argB.trim().split(/\s+/).filter(Boolean);
  const uniqueA = new Set(wordsA.map((w) => w.toLowerCase())).size;
  const uniqueB = new Set(wordsB.map((w) => w.toLowerCase())).size;

  // Calculate dynamic rhetorical scores based on argument depth, uniqueness, and emotion
  let scoreA = Math.min(
    98,
    Math.max(
      72,
      75 +
        Math.min(16, Math.floor(uniqueA * 1.4)) +
        (argA.includes('?') ? 2 : 0) +
        (argA.includes('!') ? 2 : 0),
    ),
  );
  let scoreB = Math.min(
    98,
    Math.max(
      72,
      75 +
        Math.min(16, Math.floor(uniqueB * 1.4)) +
        (argB.includes('?') ? 2 : 0) +
        (argB.includes('!') ? 2 : 0),
    ),
  );

  if (lenA > lenB + 30) scoreA = Math.min(99, scoreA + 3);
  if (lenB > lenA + 30) scoreB = Math.min(99, scoreB + 3);

  let winner = 'Dead Heat Draw';
  if (scoreA > scoreB) winner = nameA;
  else if (scoreB > scoreA) winner = nameB;

  const penalties = [
    `Loser must make breakfast in bed and serve it wearing a makeshift chef's hat on Day 1 of reunion.`,
    `Loser must record a 30-second dramatic Shakespearean monologue declaring ${winner}'s brilliance.`,
    `Loser must let ${winner} pick the movie tonight with ZERO veto power allowed.`,
    `Loser owes ${winner} a 15-minute shoulder massage while listening to ${winner}'s favorite album.`,
  ];

  const penalty = penalties[Math.floor(Math.random() * penalties.length)];

  const analysis =
    winner === nameA
      ? `${nameA} clinched victory through ruthless emotional conviction and superior rhetorical flair. ${nameB} made a valiant effort, but folded under the weight of ${nameA}'s undeniable couple authority.`
      : winner === nameB
        ? `${nameB} carried the round with calm, calculated logic and devastating counter-points. ${nameA}'s passionate defense was admirable, but ${nameB}'s argument was bulletproof.`
        : `A spectacular ideological deadlock! Both ${nameA} and ${nameB} argued with such unhinged chemistry that neither deserved to lose.`;

  return {
    winner,
    scoreA,
    scoreB,
    analysis,
    penalty,
  };
}

// ---------------------------------------------------------------------------
// 🗺️ CUPIDOT AI DATE ARCHITECT — Bucket List Ideation
// ---------------------------------------------------------------------------

export interface GeneratedBucketIdea {
  title: string;
  category: 'Virtual' | 'Reunion' | 'Adventure' | 'Food';
  icon: string;
  whyCupidotLovesIt: string;
}

export function generateBucketDate(
  existingTitles: string[] = [],
): GeneratedBucketIdea {
  const pool: GeneratedBucketIdea[] = [
    {
      title: 'Midnight 24-Hour Convenience Store Feast in an Exciting City',
      category: 'Food',
      icon: '🍙',
      whyCupidotLovesIt:
        'Pure romantic chaos: holding hands in fluorescent aisles trying every snack at 2:30 AM.',
    },
    {
      title: 'Synchronized Candlelit FaceTime Dinner Across Timezones',
      category: 'Virtual',
      icon: '🕯️',
      whyCupidotLovesIt:
        'Dressing up in formal attire in your own bedroom just to eat with the person on your screen.',
    },
    {
      title: 'Sunrise Blanket Hug on a Misty Mountain Overlook',
      category: 'Adventure',
      icon: '🌄',
      whyCupidotLovesIt:
        'Waking up before dawn wrapped in a shared quilt watching the world wake up together.',
    },
    {
      title: 'Secret Code Thrift-Store Outfit Swap Challenge',
      category: 'Reunion',
      icon: '🧥',
      whyCupidotLovesIt:
        'You have 15 minutes and $25 to assemble an outfit for the other person that they MUST wear to dinner.',
    },
    {
      title: 'Audio-Only Stargazing Call with Zero Video',
      category: 'Virtual',
      icon: '✨',
      whyCupidotLovesIt:
        'No cameras, no self-consciousness, just staring at the same stars listening to each other breathe.',
    },
    {
      title: 'Unannounced Airport Gate Surprise Hug of a Lifetime',
      category: 'Reunion',
      icon: '✈️',
      whyCupidotLovesIt:
        'The ultimate bucket list milestone: that first second where distance is reduced to zero.',
    },
  ];

  const filtered = pool.filter(
    (p) =>
      !existingTitles.some((t) =>
        t.toLowerCase().includes(p.title.toLowerCase().slice(0, 15)),
      ),
  );
  return filtered.length > 0
    ? filtered[Math.floor(Math.random() * filtered.length)]
    : pool[0];
}

// ---------------------------------------------------------------------------
// 📸 CUPIDOT PHOTOBOOTH POSE COACH & CAPTIONER
// ---------------------------------------------------------------------------

export interface PoseIdea {
  title: string;
  instructions: string;
  vibe: string;
  emoji: string;
}

export const PHOTOBOOTH_POSES: PoseIdea[] = [
  {
    title: 'The Steamed Dumpling Cheek Squish',
    instructions:
      'Both press your cheeks together into the camera lens with exaggerated cute pouts!',
    vibe: 'Maximum Cuteness',
    emoji: '🥟',
  },
  {
    title: 'The Finger Gun & Drama Queen Shock',
    instructions:
      'One makes finger guns at the camera, the other acts like they just got shot in the heart!',
    vibe: 'Playful Chaos',
    emoji: '🔫',
  },
  {
    title: 'The Mirrored Cheek Heart',
    instructions:
      'Each person makes half a heart on their cheek pointing toward the other screen.',
    vibe: 'Korean Life4Cuts Classic',
    emoji: '🫶',
  },
  {
    title: 'The Secret Agent Back-to-Back',
    instructions:
      'Turn away from each other, look over your shoulders with serious spy expressions.',
    vibe: '007 Rom-Com',
    emoji: '🕶️',
  },
  {
    title: 'The Forehead Boop & Giggle',
    instructions:
      'Lean in as close to the camera as possible with closed eyes and uncontrollable smiles.',
    vibe: 'Pure Romantic Vulnerability',
    emoji: '💖',
  },
];

export function getCupidotPoseIdea(): PoseIdea {
  return PHOTOBOOTH_POSES[Math.floor(Math.random() * PHOTOBOOTH_POSES.length)];
}

export function generateCupidotCaption(
  nameA = 'Partner 1',
  nameB = 'Partner 2',
): string {
  const captions = [
    `${nameA} & ${nameB}: Across every timezone, our chemistry still broke the camera lens ✨`,
    `Proof that distance is just geography, not a match for ${nameA} & ${nameB} 📸💘`,
    `Two screens, one shared heartbeat. ${nameA} ♡ ${nameB} forever.`,
    `Counting down every sunrise until these photos are in the same frame.`,
    `In a world of 8 billion people, ${nameA} would still wait across the globe for ${nameB}.`,
  ];
  return captions[Math.floor(Math.random() * captions.length)];
}

// ---------------------------------------------------------------------------
// 🌦️ CUPIDOT'S DAILY LOVE FORECAST & WEATHER REPORT
// ---------------------------------------------------------------------------

export interface LoveForecast {
  dateString: string;
  sweetnessPressure: number; // 85 - 99%
  stolenHoodieProbability: number; // 70 - 98%
  laughterPrecipitation: number; // 80 - 100%
  chemistryHeatIndex: string;
  windDirection: string;
  headline: string;
  severeWeatherWarning: string;
  partnerANote: string;
  partnerBNote: string;
  cupidotPrescription: string;
}

export function generateLoveForecast(
  nameA = 'Partner 1',
  nameB = 'Partner 2',
  cityA = 'Here',
  cityB = 'There',
): LoveForecast {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Deterministic seed based on date string and names
  let seed = 0;
  const seedString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${nameA}-${nameB}`;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed * 31 + seedString.charCodeAt(i)) % 10000;
  }

  const sweetnessPressure = 88 + (seed % 11);
  const stolenHoodieProbability = 75 + ((seed * 3) % 24);
  const laughterPrecipitation = 82 + ((seed * 7) % 18);

  const HEADLINES = [
    `Scattered showers of late-night laughing fits with heavy FaceTime highs across ${cityA} & ${cityB} 🌦️`,
    `Unprecedented romantic atmospheric pressure detected between ${nameA} and ${nameB} 💖`,
    `Warm emotional air currents colliding: 99% probability of sudden "I miss you" voice notes 💌`,
    `High-pressure intimacy system parked over ${cityA} & ${cityB}. Visibility: 100% pure devotion ✨`,
    `Severe sweetness watch in effect: Extended smiling at phone screens guaranteed today 📱`,
  ];

  const WARNINGS = [
    `⚠️ SEVERE WEATHER ALERT: 94% chance of stolen oversized hoodies and long-distance yearning tonight.`,
    `⚠️ ROMANTIC GALE WARNING: High-velocity butterflies detected in the chest cavity whenever ${nameA} calls ${nameB}.`,
    `⚠️ ADVISORY: Prolonged eye contact through the webcam will cause uncontrollable smiling fits.`,
    `⚠️ CRITICAL RADAR UPDATE: Extreme magnetic attraction causing spontaneous flight booking urges.`,
  ];

  const PRESCRIPTIONS = [
    `Cupidot prescribes: Minimum of 1 spontaneous voice note whisper and 2 forehead kisses sent via emoji before sleep.`,
    `Cupidot prescribes: Mandatory late-night music-sharing session with at least one embarrassing confession.`,
    `Cupidot prescribes: Order each other surprise delivery boba or midnight snacks across the timezone gap.`,
    `Cupidot prescribes: Hold each other's gaze on camera for 20 seconds without speaking.`,
  ];

  const headline = HEADLINES[seed % HEADLINES.length];
  const severeWeatherWarning = WARNINGS[(seed * 2) % WARNINGS.length];
  const cupidotPrescription = PRESCRIPTIONS[(seed * 3) % PRESCRIPTIONS.length];

  return {
    dateString,
    sweetnessPressure,
    stolenHoodieProbability,
    laughterPrecipitation,
    chemistryHeatIndex: `${95 + (seed % 10)}°F Romantic Chemistry`,
    windDirection: `${cityA} ➡️ ${cityB} (Gusts of 45 mph Affection)`,
    headline,
    severeWeatherWarning,
    partnerANote: `${nameA}'s mood radar: 100% receptive to romantic surprises and sweet compliments.`,
    partnerBNote: `${nameB}'s mood radar: Ready to melt at the sound of ${nameA}'s laugh.`,
    cupidotPrescription,
  };
}
