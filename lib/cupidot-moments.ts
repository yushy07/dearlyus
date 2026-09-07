export type CompanionMood = 'playful' | 'tender' | 'quiet';

export interface CompanionMoment {
  id: string;
  mood: CompanionMood;
  question: string;
  options: string[];
  reply: string;
}

export const COMPANION_MOMENTS: CompanionMoment[] = [
  {
    id: 'tiny-date',
    mood: 'playful',
    question:
      'You have ten minutes and absolutely no plan. What’s our tiny date?',
    options: [
      'A kitchen dance break',
      'Inventing terrible movie plots',
      'A snack taste test',
    ],
    reply:
      'A very respectable use of ten minutes. I’ll leave the planning committee to you.',
  },
  {
    id: 'mascot-job',
    mood: 'playful',
    question: 'If I had a job in your home, what would it be?',
    options: [
      'Chief blanket inspector',
      'Emergency snack consultant',
      'Keeper of questionable jokes',
    ],
    reply:
      'Accepted. My qualifications are mostly fluff, but my enthusiasm is excellent.',
  },
  {
    id: 'teleport',
    mood: 'playful',
    question: 'One imaginary door, one evening together. Where does it open?',
    options: [
      'A midnight bakery',
      'A cabin with board games',
      'An arcade by the sea',
    ],
    reply:
      'Door unlocked. Tell each other the very first thing you’d do there.',
  },
  {
    id: 'soundtrack',
    mood: 'playful',
    question: 'What kind of soundtrack does today deserve?',
    options: ['Ridiculously dramatic', 'Kitchen disco', 'Cozy end credits'],
    reply: 'Excellent direction. Each of you gets to nominate one song.',
  },
  {
    id: 'small-kindness',
    mood: 'tender',
    question: 'Which small kindness would feel lovely today?',
    options: [
      'A few unhurried words',
      'Something that makes me laugh',
      'A little company, no big plans',
    ],
    reply:
      'That’s a lovely starting point. You can tell your person in your own words.',
  },
  {
    id: 'ordinary-memory',
    mood: 'tender',
    question: 'Which ordinary moment would you like to revisit together?',
    options: [
      'A walk that lasted longer than planned',
      'A meal we still talk about',
      'A conversation that felt easy',
    ],
    reply:
      'Start with one detail you remember. Your person might remember a completely different one.',
  },
  {
    id: 'little-note',
    mood: 'tender',
    question: 'Finish a tiny note: “I like the way we…”',
    options: [
      'Find things to laugh about',
      'Make room for each other',
      'Turn ordinary days into stories',
    ],
    reply:
      'That already sounds like the beginning of a good note. Add a little example if you feel like it.',
  },
  {
    id: 'future-afternoon',
    mood: 'tender',
    question: 'What would you put in a slow afternoon together?',
    options: [
      'A familiar place',
      'Something we’ve never tried',
      'Nothing on the calendar',
    ],
    reply:
      'No grand occasion needed. Keep that little idea for whenever it fits.',
  },
  {
    id: 'soft-landing',
    mood: 'quiet',
    question: 'Nothing to finish here. What feels comfortable?',
    options: [
      'Take one slow breath',
      'Let my shoulders relax',
      'Just sit for a moment',
    ],
    reply: 'I’ll settle here. Take as much or as little time as you like.',
  },
  {
    id: 'quiet-company',
    mood: 'quiet',
    question: 'A little quiet company?',
    options: [
      'Listen to a familiar song',
      'Look out of the window',
      'Get comfortable and do nothing',
    ],
    reply: 'That’s enough. There’s no timer and nothing to earn.',
  },
  {
    id: 'gentle-close',
    mood: 'quiet',
    question: 'How would you like to end this little visit?',
    options: ['With a kind thought', 'With a stretch', 'With a cozy goodnight'],
    reply: 'A soft place to stop. You can come back whenever it suits you.',
  },
];

/** Draw without repeats until this mood's collection has been explored. */
export function nextCompanionMoment(
  mood: CompanionMood,
  seen: string[],
  random = Math.random,
): CompanionMoment {
  const pool = COMPANION_MOMENTS.filter((moment) => moment.mood === mood);
  const unseen = pool.filter((moment) => !seen.includes(moment.id));
  const candidates = unseen.length
    ? unseen
    : pool.filter((moment) => moment.id !== seen.at(-1));
  return candidates[Math.floor(random() * candidates.length)];
}
