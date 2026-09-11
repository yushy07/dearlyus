import type { BotState } from '@/components/bot/CupidotBot';
import type {
  ActivityDefinition,
  ActivityResult,
  KeepsakeDraft,
  RealtimeActivityEvent,
  StartActivityInput,
  StandardSessionState,
  ValidationResult,
} from './activity-adapters/types';

export type CourtStage =
  | 'welcome'
  | 'choose_topic'
  | 'statement_one'
  | 'statement_two'
  | 'reveal'
  | 'judge_question'
  | 'judge_twist'
  | 'deliberating'
  | 'verdict'
  | 'finished';
export type JudgeReaction =
  | 'amused'
  | 'suspicious'
  | 'shocked'
  | 'thinking'
  | 'sassy';
export type CourtWinner = 'partnerA' | 'partnerB' | 'both' | 'nobody';

export interface CourtReaction {
  comparison: string;
  summaryOne: string;
  summaryTwo: string;
  question: string;
  reaction: JudgeReaction;
  redirected?: boolean;
}
export interface CourtVerdict {
  title: string;
  comparison: string;
  winner: CourtWinner;
  funnyReason: string;
  playfulSentence: string;
  judgeClosingLine: string;
  reaction: JudgeReaction;
  redirected?: boolean;
  source?: 'generated' | 'fallback';
}
export interface CourtSnapshot {
  [key: string]: unknown;
  activityType: 'court';
  schemaVersion: 2;
  status: StandardSessionState;
  stage: CourtStage;
  roundId: string;
  topicKey: string;
  topic: string;
  firstSpeakerId: string;
  secondSpeakerId: string;
  statementOneLocked: boolean;
  statementTwoLocked: boolean;
  statements?: { one: string; two: string };
  judgeReaction?: CourtReaction;
  followupLockedBy: string[];
  followups?: Array<{ userId: string; answer: string }>;
  objectionsUsed: string[];
  objection?: { userId: string; label: string; response: string };
  twist?: CourtTwist;
  twistResult?: Record<string, unknown>;
  verdict?: CourtVerdict;
  acceptedBy: string[];
  rematchCount: number;
  deadlineAt?: string | null;
  completed: boolean;
}

export interface CourtTopic {
  id: string;
  icon: string;
  title: string;
  prompt: string;
}
export interface CourtTwist {
  id: 'usually' | 'prediction' | 'compromise' | 'coin';
  title: string;
  prompt: string;
  options: string[];
}

export const COURT_TOPICS: CourtTopic[] = [
  {
    id: 'hoodie',
    icon: '🧥',
    title: 'The borrowed hoodie',
    prompt: 'Who has permanent custody of the favourite hoodie?',
  },
  {
    id: 'blanket',
    icon: '🛏️',
    title: 'Blanket territory',
    prompt: 'Who quietly becomes a blanket burrito at night?',
  },
  {
    id: 'snacks',
    icon: '🍟',
    title: 'Snack sharing',
    prompt: 'Does saying “I’m not hungry” cancel all fry rights?',
  },
  {
    id: 'playlist',
    icon: '🎶',
    title: 'Playlist control',
    prompt: 'Who deserves the next turn with the music?',
  },
  {
    id: 'replies',
    icon: '💬',
    title: 'The late reply',
    prompt: 'What really happened during that suspiciously long reply gap?',
  },
  {
    id: 'movie',
    icon: '🎬',
    title: 'Movie night',
    prompt: 'Who takes longer to choose what to watch?',
  },
  {
    id: 'alarm',
    icon: '⏰',
    title: 'Alarm snoozing',
    prompt: 'How many snoozes become a shared household event?',
  },
  {
    id: 'charger',
    icon: '🔌',
    title: 'Missing charger',
    prompt: 'Whose charger is somehow always on the other side?',
  },
  {
    id: 'teasing',
    icon: '😌',
    title: 'Excessive teasing',
    prompt: 'When does excellent banter become extremely suspicious behaviour?',
  },
];

export const OBJECTIONS = [
  'Missing context!',
  'That happened once!',
  'Extremely dramatic!',
  'The cat influenced events!',
  'I was being adorable!',
  'Selective memory!',
];

export const COURT_EVENTS = [
  'court_topic_selected',
  'court_statement_locked',
  'court_statements_revealed',
  'court_question_created',
  'court_followup_locked',
  'court_followups_revealed',
  'court_objection_used',
  'court_twist_started',
  'court_twist_completed',
  'court_deliberation_started',
  'court_verdict_created',
  'court_verdict_accepted',
  'court_sentence_softened',
  'court_round_finished',
  'court_rematch_started',
] as const;

export function initialCourt(input?: StartActivityInput): CourtSnapshot {
  return {
    activityType: 'court',
    schemaVersion: 2,
    status: 'active',
    stage: 'welcome',
    roundId: '',
    topicKey: '',
    topic: '',
    firstSpeakerId: String(input?.userId || 'partner-a'),
    secondSpeakerId: 'partner-b',
    statementOneLocked: false,
    statementTwoLocked: false,
    followupLockedBy: [],
    objectionsUsed: [],
    acceptedBy: [],
    rematchCount: 0,
    completed: false,
  };
}

export function normalizeCourt(
  value: unknown,
  fallback?: CourtSnapshot,
): CourtSnapshot {
  const raw =
    value && typeof value === 'object' ? (value as Partial<CourtSnapshot>) : {};
  if (raw.schemaVersion === 2)
    return { ...(fallback || initialCourt()), ...raw } as CourtSnapshot;
  return fallback || initialCourt();
}

export function courtBotState(reaction?: JudgeReaction): BotState {
  return reaction === 'thinking'
    ? 'thinking'
    : reaction === 'sassy' || reaction === 'suspicious'
      ? 'sassy'
      : reaction === 'shocked'
        ? 'shock'
        : 'happy';
}

export function pickCourtTwist(topicKey: string): CourtTwist | undefined {
  if (['replies', 'teasing', 'charger'].includes(topicKey)) return undefined;
  if (['snacks', 'blanket'].includes(topicKey))
    return {
      id: 'compromise',
      title: 'The Tiny Compromise',
      prompt: 'Which peace offering sounds fairest?',
      options: [
        'Share the next one',
        'Take turns choosing',
        'One cuddle tax',
        'Let a coin decide',
      ],
    };
  if (['playlist', 'movie'].includes(topicKey))
    return {
      id: 'prediction',
      title: 'Predict Your Person',
      prompt: 'What do you think your person would choose?',
      options: ['Your pick', 'Their pick', 'Take turns', 'Surprise us'],
    };
  return {
    id: 'usually',
    title: 'Who Usually Does It?',
    prompt: 'Point the tiny gavel toward the most likely answer.',
    options: ['Me', 'My person', 'Both of us', 'Nobody admits it'],
  };
}

export function localReaction(snapshot: CourtSnapshot): CourtReaction {
  if (
    seriousTopic(
      `${snapshot.topic} ${snapshot.statements?.one} ${snapshot.statements?.two}`,
    )
  )
    return {
      comparison:
        'This one deserves a real conversation without my tiny gavel. Let’s choose a lighter disagreement for Court.',
      summaryOne: 'This topic needs more care than a playful game can give it.',
      summaryTwo: 'Neither person needs to argue their side here.',
      question:
        'Which smaller everyday disagreement should we put before the Court instead?',
      reaction: 'thinking',
      redirected: true,
    };
  return {
    comparison: `I have heard two highly committed versions of “${snapshot.topic},” and both contain suspiciously excellent points.`,
    summaryOne:
      'The first story presents a strong case with impressive dramatic timing.',
    summaryTwo:
      'The second story offers an equally convincing account of the tiny chaos.',
    question:
      'What is the smallest compromise that would make both of you laugh about this tomorrow?',
    reaction: 'suspicious',
  };
}

export function localVerdict(snapshot: CourtSnapshot): CourtVerdict {
  return {
    title: 'Both Stories Are Adorably Suspicious',
    comparison:
      snapshot.judgeReaction?.comparison ||
      `Both sides made a memorable case about ${snapshot.topic}.`,
    winner: 'both',
    funnyReason:
      'The Court detected affection, selective memory, and enough shared responsibility to fill one tiny notebook.',
    playfulSentence:
      'Share one small treat today and let the person who laughs first choose it.',
    judgeClosingLine: 'The ruling is final until somebody brings dessert.',
    reaction: 'amused',
    source: 'fallback',
  };
}

export function seriousTopic(text: string) {
  return /\b(abuse|assault|suicide|self[- ]?harm|rape|forced sex|threat(?:en|ened|ening)?|stalk|password|bank account|medical diagnosis|divorce lawyer|police)\b/i.test(
    text,
  );
}

export function objectionResponse(label: string) {
  const replies: Record<string, string> = {
    'Missing context!':
      'Sustained. The missing context has been placed under a tiny spotlight.',
    'That happened once!':
      'Noted. The Court will reduce the drama by approximately twelve percent.',
    'Extremely dramatic!':
      'Overruled. Drama is the primary energy source of this courtroom.',
    'The cat influenced events!':
      'The cat remains an unreliable but very persuasive witness.',
    'I was being adorable!':
      'Accepted as context, not as a universal legal defence.',
    'Selective memory!':
      'Both memories will be handled with equal and affectionate suspicion.',
  };
  return (
    replies[label] ||
    'The objection has been recorded in very tiny handwriting.'
  );
}

export function reduceCourt(
  snapshot: CourtSnapshot,
  event: RealtimeActivityEvent,
): CourtSnapshot {
  const payload = (event.payload || {}) as Record<string, any>;
  const senderId = event.senderId || 'unknown-partner';
  switch (event.type) {
    case 'court_topic_selected':
      return {
        ...initialCourt(),
        roundId: String(payload.roundId || crypto.randomUUID()),
        topicKey: String(payload.topicKey || 'custom'),
        topic: String(payload.topic || ''),
        firstSpeakerId: String(
          payload.firstSpeakerId || snapshot.firstSpeakerId,
        ),
        secondSpeakerId: String(
          payload.secondSpeakerId || snapshot.secondSpeakerId,
        ),
        rematchCount: snapshot.rematchCount,
        stage: 'statement_one',
      };
    case 'court_statement_locked':
      return payload.slot === 1
        ? { ...snapshot, statementOneLocked: true, stage: 'statement_two' }
        : { ...snapshot, statementTwoLocked: true, stage: 'reveal' };
    case 'court_statements_revealed':
      return {
        ...snapshot,
        statements: {
          one: String(payload.statementOne || ''),
          two: String(payload.statementTwo || ''),
        },
        stage: 'reveal',
      };
    case 'court_question_created':
      return {
        ...snapshot,
        judgeReaction: payload as CourtReaction,
        stage: 'judge_question',
      };
    case 'court_followup_locked':
      return {
        ...snapshot,
        followupLockedBy: [
          ...new Set([...snapshot.followupLockedBy, senderId]),
        ],
      };
    case 'court_followups_revealed':
      return {
        ...snapshot,
        followups: Array.isArray(payload.answers) ? payload.answers : [],
        stage: payload.hasTwist ? 'judge_twist' : 'deliberating',
      };
    case 'court_objection_used':
      return {
        ...snapshot,
        objectionsUsed: [...new Set([...snapshot.objectionsUsed, senderId])],
        objection: {
          userId: senderId,
          label: String(payload.label || 'Objection!'),
          response: String(
            payload.response || objectionResponse(String(payload.label)),
          ),
        },
      };
    case 'court_twist_started':
      return {
        ...snapshot,
        twist: payload as CourtTwist,
        stage: 'judge_twist',
      };
    case 'court_twist_completed':
      return { ...snapshot, twistResult: payload, stage: 'deliberating' };
    case 'court_deliberation_started':
      return { ...snapshot, stage: 'deliberating' };
    case 'court_verdict_created':
      return {
        ...snapshot,
        verdict: payload as CourtVerdict,
        stage: 'verdict',
      };
    case 'court_sentence_softened':
      return snapshot.verdict
        ? {
            ...snapshot,
            verdict: {
              ...snapshot.verdict,
              playfulSentence: String(
                payload.playfulSentence || snapshot.verdict.playfulSentence,
              ),
              judgeClosingLine: String(
                payload.judgeClosingLine || snapshot.verdict.judgeClosingLine,
              ),
            },
          }
        : snapshot;
    case 'court_verdict_accepted':
      return {
        ...snapshot,
        acceptedBy: [...new Set([...snapshot.acceptedBy, senderId])],
      };
    case 'court_round_finished':
      return {
        ...snapshot,
        stage: 'finished',
        completed: true,
        status: 'completed',
      };
    case 'court_rematch_started':
      return {
        ...initialCourt(),
        stage: 'choose_topic',
        rematchCount: snapshot.rematchCount + 1,
      };
    default:
      return snapshot;
  }
}

export const courtActivityDefinition: ActivityDefinition<
  CourtSnapshot,
  RealtimeActivityEvent
> = {
  activityType: 'court',
  schemaVersion: 2,
  durableEvents: COURT_EVENTS,
  transientEvents: [],
  privateFields: ['statement', 'followup', 'prediction'],
  reconnectBehavior: 'loading_snapshot',
  initialSnapshot: initialCourt,
  validateEvent(event): ValidationResult {
    if (!COURT_EVENTS.includes(event.type as (typeof COURT_EVENTS)[number]))
      return {
        valid: false,
        code: 'INVALID_EVENT',
        message: 'That Court action is unavailable.',
      };
    const payload = (event.payload || {}) as Record<string, unknown>;
    if (
      (event.type === 'court_statement_locked' &&
        ('statement' in payload || 'answer' in payload)) ||
      (event.type === 'court_followup_locked' &&
        ('followup' in payload || 'answer' in payload))
    )
      return {
        valid: false,
        code: 'PRIVATE_DATA_LEAK',
        message: 'Private Court answers must stay in the sealed vault.',
      };
    return { valid: true };
  },
  reduce: reduceCourt,
  transitionRules(_snapshot, action, userId) {
    return Boolean(
      userId && COURT_EVENTS.includes(action as (typeof COURT_EVENTS)[number]),
    );
  },
  summarize(snapshot): ActivityResult {
    return {
      activityType: 'court',
      completed: snapshot.completed,
      summary: {
        topic: snapshot.topic,
        verdict: snapshot.verdict?.title,
        sentence: snapshot.verdict?.playfulSentence,
      },
    };
  },
  buildKeepsake(result): KeepsakeDraft | null {
    const summary = result.summary as Record<string, string>;
    return {
      kind: 'activity',
      title: `Tiny Court Ruling · ${summary.verdict || summary.topic}`,
      metadata: { activityType: 'court', ...summary },
    };
  },
};
