import { describe, expect, it } from 'vitest';
import {
  courtActivityDefinition,
  initialCourt,
  localReaction,
  localVerdict,
  pickCourtTwist,
  reduceCourt,
  seriousTopic,
  type CourtSnapshot,
} from '../lib/court';

const event = (
  type: string,
  payload: Record<string, unknown> = {},
  senderId = 'partner-a',
) => ({ type, payload, senderId });

describe('playful Couples Court', () => {
  it('starts with the v2 welcome and no private answers in shared state', () => {
    const court = initialCourt({ roomCode: 'LOVE1234', userId: 'partner-a' });
    expect(court.schemaVersion).toBe(2);
    expect(court.stage).toBe('welcome');
    expect(court.statements).toBeUndefined();
    expect(court.followups).toBeUndefined();
  });

  it('rejects private values in public lock events', () => {
    expect(
      courtActivityDefinition.validateEvent!(
        event('court_statement_locked', { statement: 'secret' }),
      ),
    ).toMatchObject({ valid: false, code: 'PRIVATE_DATA_LEAK' });
    expect(
      courtActivityDefinition.validateEvent!(
        event('court_followup_locked', { answer: 'secret' }),
      ),
    ).toMatchObject({ valid: false, code: 'PRIVATE_DATA_LEAK' });
    expect(
      courtActivityDefinition.validateEvent!(
        event('court_statement_locked', { slot: 1 }),
      ),
    ).toEqual({ valid: true });
  });

  it('moves through private turns and reveals both stories together', () => {
    let court = initialCourt();
    court = reduceCourt(
      court,
      event('court_topic_selected', {
        topicKey: 'snacks',
        topic: 'Who owns the fries?',
        firstSpeakerId: 'partner-a',
        secondSpeakerId: 'partner-b',
      }),
    );
    court = reduceCourt(
      court,
      event('court_statement_locked', { slot: 1 }, 'partner-a'),
    );
    expect(court.stage).toBe('statement_two');
    expect(court.statements).toBeUndefined();
    court = reduceCourt(
      court,
      event('court_statement_locked', { slot: 2 }, 'partner-b'),
    );
    court = reduceCourt(
      court,
      event('court_statements_revealed', {
        statementOne: 'I ordered them.',
        statementTwo: 'Fries are communal.',
      }),
    );
    expect(court.stage).toBe('reveal');
    expect(court.statements).toEqual({
      one: 'I ordered them.',
      two: 'Fries are communal.',
    });
  });

  it('counts objections by unique partner', () => {
    let court: CourtSnapshot = { ...initialCourt(), stage: 'reveal' };
    court = reduceCourt(
      court,
      event(
        'court_objection_used',
        { label: 'The cat influenced events!', response: 'Cat noted.' },
        'partner-a',
      ),
    );
    court = reduceCourt(
      court,
      event(
        'court_objection_used',
        { label: 'Missing context!', response: 'Context noted.' },
        'partner-a',
      ),
    );
    court = reduceCourt(
      court,
      event(
        'court_objection_used',
        { label: 'Missing context!', response: 'Context noted.' },
        'partner-b',
      ),
    );
    expect(court.objectionsUsed).toEqual(['partner-a', 'partner-b']);
    expect(court.objection?.response).toContain('Context');
  });

  it('selects short topic twists and skips some rounds', () => {
    expect(pickCourtTwist('snacks')?.id).toBe('compromise');
    expect(pickCourtTwist('playlist')?.id).toBe('prediction');
    expect(pickCourtTwist('replies')).toBeUndefined();
  });

  it('quietly redirects serious topics', () => {
    expect(seriousTopic('My partner threatened me')).toBe(true);
    const reaction = localReaction({
      ...initialCourt(),
      topic: 'A threat happened',
    });
    expect(reaction.redirected).toBe(true);
    expect(reaction.comparison).toContain('real conversation');
  });

  it('produces a complete affectionate fallback verdict', () => {
    const verdict = localVerdict({
      ...initialCourt(),
      topic: 'The missing charger',
      topicKey: 'charger',
    });
    expect(verdict).toMatchObject({
      winner: 'both',
      source: 'fallback',
      reaction: 'amused',
    });
    expect(verdict.playfulSentence).toContain('video date');
    expect(JSON.stringify(verdict).toLowerCase()).not.toMatch(
      /toxic|manipulative|guilty/,
    );
  });

  it('chooses a side after a clear admission and assigns a remote sentence', () => {
    const verdict = localVerdict({
      ...initialCourt(),
      topicKey: 'snacks',
      topic: 'The missing fries',
      statements: {
        one: 'I ordered enough for myself.',
        two: 'I admit I took the crispy fries without asking.',
      },
    });
    expect(verdict.winner).toBe('partnerA');
    expect(verdict.playfulSentence).toMatch(/voice-note|remote movie date/);
  });
});
