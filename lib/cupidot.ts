/**
 * Cupidot — Autonomous On-Device Relationship Pattern & Thread Weaving Engine
 * 
 * Deeply analyzes multi-round conversation history, detects recurring couple archetypes,
 * identifies contradictions, tracks power dynamics, and synthesizes dilemmas that
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
  "Connecting threads from your previous answers... 🧵",
  "Detecting behavioral patterns between you two... 🔍",
  "Analyzing who secretly holds the relationship power... 👑",
  "Spotting funny contradictions in your choices... 🧐",
  "Weaving your late-night lore into the next dilemma... 💘",
  "Calculating compromise friction across the miles... ⚡",
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
    hasTravel: /(flight|trip|airport|travel|city|wander|pack|explore|bike|train|hotel)/.test(allText),
    hasFood: /(food|eat|dinner|coffee|cafe|pancake|snack|cook|bakery|dessert|breakfast|ramen|pizza)/.test(allText),
    hasSleep: /(sleep|bed|nap|morning|noon|wake|snooze|pajamas|exhausted|jetlag|couch)/.test(allText),
    hasIntimacy: /(hug|cuddle|kiss|touch|holding|face|bedroom|blush|love|romantic|forehead|hand)/.test(allText),
    hasArgument: /(argument|fight|disagree|mad|pout|silent|stubborn|yell|apologize|peace|guilty)/.test(allText),
    hasJealousy: /(jealous|flirt|territory|cute|look|stranger|protective|attention)/.test(allText),
    hasLateNight: /(late|night|midnight|camera|facetime|video|call|freeze|phone|text)/.test(allText),
    agreementCount,
    totalRounds: history.length + 1,
    prevRounds,
  };
}

/**
 * Procedural Pattern & Thread Weaver
 * Connects previous answers across rounds into new dilemmas for any couple
 */
export function generateCupidotDilemma(req: QuestionRequest): GeneratedQuestion {
  const nameA = req.partnerA?.name?.trim() || 'Partner 1';
  const nameB = req.partnerB?.name?.trim() || 'Partner 2';
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
export function getPokedCupidotDilemma(nameA = 'Partner 1', nameB = 'Partner 2'): CupidotDilemma {
  const dilemmas: CupidotDilemma[] = [
    {
      question: `Poke penalty! Connecting your relationship habits: what is the one thing ${nameA} does on camera that secretly makes ${nameB}'s heart skip a beat?`,
      options: [
        `Wearing that one oversized hoodie that looks ridiculously cute`,
        `The sleepy morning voice before coffee where words are barely formed`,
        `Biting their lip when trying not to laugh at a bad joke`,
        `Staring intensely at the screen with that little warm smile`,
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
  nameB = 'Partner 2'
): CourtVerdict {
  const combined = `${title} ${claimA} ${claimB}`.toLowerCase();

  if (/sleep|couch|nap|tired|bed|snooze|alarm/.test(combined)) {
    return {
      verdictTitle: 'Guilty of Unlawful Couch-Coma & Notification Neglect ⚖️',
      guiltyParty: nameB,
      reasoning: `The court finds Defendant ${nameB} guilty under Statute 14: falling asleep without properly clocking out on call constitutes gross negligence of couple snuggling protocols.`,
      sentence: `${nameB} must send 3 sleepy morning voice notes tomorrow and order ${nameA} their favorite drink or dessert.`,
    };
  }

  if (/playlist|music|song|skip|aux|sound|artist/.test(combined)) {
    return {
      verdictTitle: 'Guilty of Egregious Bluetooth Monopoly 📻',
      guiltyParty: nameA,
      reasoning: `Plaintiff ${nameA} demonstrated blatant disregard for constitutional AUX rights by skipping tracks 18 seconds in before the beat even dropped.`,
      sentence: `${nameB} is granted unilateral control of the playlist/speaker for 45 uninterrupted minutes without eye-rolling.`,
    };
  }

  if (/hoodie|jacket|clothes|shirt|stole|wear/.test(combined)) {
    return {
      verdictTitle: 'Legitimate Asset Seizure Recognized by International Law 🧥',
      guiltyParty: 'Neither',
      reasoning: `Under the Long-Distance Maritime Convention, once a favorite clothing item enters ${nameA}’s suitcase, legal ownership permanently transfers.`,
      sentence: `${nameB} must accept the loss with stoic grace and spray their cologne or perfume on the next backup hoodie.`,
    };
  }

  if (/read|reply|text|ignore|seen|hours|ghost/.test(combined)) {
    return {
      verdictTitle: 'Criminal Neglect of the Notification Tray 📱',
      guiltyParty: nameB,
      reasoning: `Leaving someone on "Seen" for over 42 minutes while active elsewhere is a Class 1 romantic misdemeanor.`,
      sentence: `${nameB} must record a 60-second acoustic love ballad or provide 15 consecutive compliments to ${nameA}.`,
    };
  }

  if (/food|fries|bite|eat|dinner|hungry|share/.test(combined)) {
    return {
      verdictTitle: 'The "I\'m Not Hungry" Food Theft Felony 🍟',
      guiltyParty: nameA,
      reasoning: `Saying "I just want one bite" and subsequently consuming 40% of ${nameB}'s food constitutes romantic grand larceny.`,
      sentence: `${nameA} must treat ${nameB} to midnight food or hand-feed them the first 3 bites of dessert on date night.`,
    };
  }

  // Dynamic Heuristic for Custom Cases
  const lengthA = claimA.length;
  const lengthB = claimB.length;
  const exclamationsA = (claimA.match(/!/g) || []).length;
  const exclamationsB = (claimB.match(/!/g) || []).length;

  if (exclamationsA > exclamationsB + 1) {
    return {
      verdictTitle: `Passionate Drama Verdict on "${title.slice(0, 32)}" ⚖️`,
      guiltyParty: 'Both',
      reasoning: `Judge Cupidot notes ${nameA} argued with intense theatrical passion (${exclamationsA} exclamation marks!), while ${nameB} attempted stoic avoidance. Both parties are hopelessly obsessed with each other.`,
      sentence: `Both parties are sentenced to a mandatory 20-minute silent forehead-touch cuddle upon your next airport reunion.`,
    };
  }

  return {
    verdictTitle: `Compromise Decreed on "${title.slice(0, 32)}" 🏛️`,
    guiltyParty: 'Mutual Chaos',
    reasoning: `After forensic evaluation of the relationship evidence, Judge Cupidot rules that petty arguments between ${nameA} and ${nameB} are simply poorly disguised requests for extra attention.`,
    sentence: `The accused must immediately send a silly face selfie, and the accuser must reply with an audio recording saying "I still adore you."`,
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
  nameB = 'Partner 2'
): DebateVerdict {
  const lenA = argA.trim().length;
  const lenB = argB.trim().length;

  let scoreA = Math.min(96, Math.max(68, 75 + Math.floor(lenA % 15)));
  let scoreB = Math.min(96, Math.max(68, 73 + Math.floor(lenB % 17)));

  if (lenA > lenB + 40) scoreA += 5;
  if (lenB > lenA + 40) scoreB += 5;

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

export function generateBucketDate(existingTitles: string[] = []): GeneratedBucketIdea {
  const pool: GeneratedBucketIdea[] = [
    {
      title: 'Midnight 24-Hour Convenience Store Feast in an Exciting City',
      category: 'Food',
      icon: '🍙',
      whyCupidotLovesIt: 'Pure romantic chaos: holding hands in fluorescent aisles trying every snack at 2:30 AM.',
    },
    {
      title: 'Synchronized Candlelit FaceTime Dinner Across Timezones',
      category: 'Virtual',
      icon: '🕯️',
      whyCupidotLovesIt: 'Dressing up in formal attire in your own bedroom just to eat with the person on your screen.',
    },
    {
      title: 'Sunrise Blanket Hug on a Misty Mountain Overlook',
      category: 'Adventure',
      icon: '🌄',
      whyCupidotLovesIt: 'Waking up before dawn wrapped in a shared quilt watching the world wake up together.',
    },
    {
      title: 'Secret Code Thrift-Store Outfit Swap Challenge',
      category: 'Reunion',
      icon: '🧥',
      whyCupidotLovesIt: 'You have 15 minutes and $25 to assemble an outfit for the other person that they MUST wear to dinner.',
    },
    {
      title: 'Audio-Only Stargazing Call with Zero Video',
      category: 'Virtual',
      icon: '✨',
      whyCupidotLovesIt: 'No cameras, no self-consciousness, just staring at the same stars listening to each other breathe.',
    },
    {
      title: 'Unannounced Airport Gate Surprise Hug of a Lifetime',
      category: 'Reunion',
      icon: '✈️',
      whyCupidotLovesIt: 'The ultimate bucket list milestone: that first second where distance is reduced to zero.',
    },
  ];

  const filtered = pool.filter((p) => !existingTitles.some((t) => t.toLowerCase().includes(p.title.toLowerCase().slice(0, 15))));
  return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[0];
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
    instructions: 'Both press your cheeks together into the camera lens with exaggerated cute pouts!',
    vibe: 'Maximum Cuteness',
    emoji: '🥟',
  },
  {
    title: 'The Finger Gun & Drama Queen Shock',
    instructions: 'One makes finger guns at the camera, the other acts like they just got shot in the heart!',
    vibe: 'Playful Chaos',
    emoji: '🔫',
  },
  {
    title: 'The Mirrored Cheek Heart',
    instructions: 'Each person makes half a heart on their cheek pointing toward the other screen.',
    vibe: 'Korean Life4Cuts Classic',
    emoji: '🫶',
  },
  {
    title: 'The Secret Agent Back-to-Back',
    instructions: 'Turn away from each other, look over your shoulders with serious spy expressions.',
    vibe: '007 Rom-Com',
    emoji: '🕶️',
  },
  {
    title: 'The Forehead Boop & Giggle',
    instructions: 'Lean in as close to the camera as possible with closed eyes and uncontrollable smiles.',
    vibe: 'Pure Romantic Vulnerability',
    emoji: '💖',
  },
];

export function getCupidotPoseIdea(): PoseIdea {
  return PHOTOBOOTH_POSES[Math.floor(Math.random() * PHOTOBOOTH_POSES.length)];
}

export function generateCupidotCaption(nameA = 'Partner 1', nameB = 'Partner 2'): string {
  const captions = [
    `${nameA} & ${nameB}: Across every timezone, our chemistry still broke the camera lens ✨`,
    `Proof that distance is just geography, not a match for ${nameA} & ${nameB} 📸💘`,
    `Two screens, one shared heartbeat. ${nameA} ♡ ${nameB} forever.`,
    `Counting down every sunrise until these photos are in the same frame.`,
    `In a world of 8 billion people, ${nameA} would still wait across the globe for ${nameB}.`,
  ];
  return captions[Math.floor(Math.random() * captions.length)];
}
