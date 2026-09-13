'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Heart,
  LockKeyhole,
  RotateCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ActivityShell } from '@/components/shared/ActivityShell';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import { useCoupleProfile } from '@/lib/couple';
import {
  applyDareAction,
  lockDareTruthAnswer,
  revealDareTruthAnswer,
} from '@/lib/activity-session';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { BottleSpinner } from './BottleSpinner';
import { DARE_DECKS, REACTIONS, type DareDeckId } from './dare-data';
import styles from './dare.module.css';

type Stage =
  | 'welcome'
  | 'choose_deck'
  | 'ready_to_spin'
  | 'spinning'
  | 'choose_truth_or_dare'
  | 'prompt_reveal'
  | 'answering'
  | 'partner_reaction'
  | 'round_complete'
  | 'finished';
type Snap = {
  stage?: Stage;
  selectedDeck?: DareDeckId;
  requestedDeck?: DareDeckId;
  roundNumber?: number;
  roundId?: string;
  activePlayerId?: string;
  promptType?: 'truth' | 'dare';
  prompt?: { index: number; id: string } | null;
  bottleSpin?: {
    spinId: string;
    seed: number;
    selectedPlayerId: string;
    finalRotationDegrees: number;
    settlesAt: string;
  };
  rerollCount?: number;
  answerLocked?: boolean;
  reaction?: string | null;
  history?: Record<string, unknown>[];
  completedTruths?: number;
  completedDares?: number;
  rematchCount?: number;
  completed?: boolean;
};
const fresh: Snap = {
  stage: 'welcome',
  roundNumber: 1,
  history: [],
  completedTruths: 0,
  completedDares: 0,
};

function localMove(s: Snap, a: string, p: Record<string, unknown>): Snap {
  const n = { ...s },
    r = n.roundNumber || 1;
  switch (a) {
    case 'dare_deck_selected':
      return p.deck === 'spicy'
        ? {
            ...fresh,
            stage: 'choose_deck',
            requestedDeck: 'spicy',
            roundId: crypto.randomUUID(),
          }
        : {
            ...fresh,
            stage: 'ready_to_spin',
            selectedDeck: p.deck as DareDeckId,
            roundId: crypto.randomUUID(),
          };
    case 'dare_spicy_consent_set':
      return {
        ...n,
        stage: 'ready_to_spin',
        selectedDeck: 'spicy',
        requestedDeck: undefined,
      };
    case 'dare_spin_requested': {
      const who = r % 2 ? 'local-a' : 'local-b';
      return {
        ...n,
        stage: 'spinning',
        bottleSpin: {
          spinId: crypto.randomUUID(),
          seed: r * 97,
          selectedPlayerId: who,
          finalRotationDegrees: 1440 + (who === 'local-a' ? 0 : 180),
          settlesAt: new Date(Date.now() + 4200).toISOString(),
        },
      };
    }
    case 'dare_spin_resolved':
      return {
        ...n,
        stage: 'choose_truth_or_dare',
        activePlayerId: n.bottleSpin?.selectedPlayerId,
      };
    case 'dare_type_selected':
      return {
        ...n,
        stage: 'prompt_reveal',
        promptType: p.type as 'truth' | 'dare',
        rerollCount: 0,
        prompt: null,
      };
    case 'dare_prompt_drawn': {
      const z = Number(p.catalogSize) || 1;
      return {
        ...n,
        stage: 'answering',
        prompt: {
          index:
            ((n.bottleSpin?.seed || 1) + r * 17 + (n.rerollCount || 0) * 31) %
            z,
          id: `${n.selectedDeck}:${n.promptType}:${r}`,
        },
      };
    }
    case 'dare_answer_locked':
      return { ...n, answerLocked: true };
    case 'dare_answer_revealed':
    case 'dare_challenge_completed':
      return { ...n, stage: 'partner_reaction' };
    case 'dare_partner_reacted':
      return { ...n, reaction: String(p.reaction) };
    case 'dare_challenge_confirmed':
    case 'dare_round_completed':
      return {
        ...n,
        stage: 'round_complete',
        history: [
          ...(n.history || []),
          { type: n.promptType, promptId: n.prompt?.id, reaction: n.reaction },
        ],
        completedTruths:
          (n.completedTruths || 0) + (n.promptType === 'truth' ? 1 : 0),
        completedDares:
          (n.completedDares || 0) + (n.promptType === 'dare' ? 1 : 0),
      };
    case 'dare_prompt_rerolled':
      return { ...n, stage: 'prompt_reveal', prompt: null, rerollCount: 1 };
    case 'dare_prompt_passed':
      return { ...n, stage: 'round_complete' };
    case 'dare_next_round_started':
      return {
        ...n,
        stage: 'ready_to_spin',
        roundNumber: r + 1,
        roundId: crypto.randomUUID(),
        bottleSpin: undefined,
        activePlayerId: undefined,
        promptType: undefined,
        prompt: null,
        reaction: null,
        answerLocked: false,
      };
    case 'dare_session_finished':
      return { ...n, stage: 'finished', completed: true };
    case 'dare_rematch_started':
      return {
        ...fresh,
        stage: 'choose_deck',
        rematchCount: (n.rematchCount || 0) + 1,
      };
    default:
      return n;
  }
}

export default function TruthOrDarePage() {
  const activity = useActivitySession(),
    { user } = useSupabaseSession(),
    couple = useCoupleProfile(),
    keepsake = useKeepsakeWriter();
  const live = Boolean(
    activity.sessionId &&
    !activity.sessionId.startsWith('mock-') &&
    activity.activityType === 'dare',
  );
  const [local, setLocal] = useState<Snap>(fresh),
    [remote, setRemote] = useState<Snap | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [answer, setAnswer] = useState(''),
    [shown, setShown] = useState(''),
    [saved, setSaved] = useState(false);
  const revisionRef = useRef(activity.revision);
  const snap =
      remote || (activity.session?.snapshot as Snap | undefined) || local,
    stage = snap.stage || 'welcome',
    deckId = snap.selectedDeck || snap.requestedDeck || 'playful',
    deck = DARE_DECKS[deckId],
    list = snap.promptType === 'dare' ? deck.dares : deck.truths,
    prompt = snap.prompt ? list[snap.prompt.index % list.length] : '';
  const myTurn =
      !live || !snap.activePlayerId || snap.activePlayerId === user?.id,
    chosen = !live
      ? snap.activePlayerId === 'local-b'
        ? couple.partnerB
        : couple.partnerA
      : snap.activePlayerId && snap.activePlayerId !== user?.id
        ? couple.partnerB
        : couple.partnerA,
    reduce =
      typeof window !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (live) setRemote((activity.session?.snapshot as Snap) || null);
  }, [live, activity.session?.snapshot]);
  useEffect(() => {
    revisionRef.current = activity.revision;
  }, [activity.revision]);
  useEffect(() => {
    if (live && activity.lastEvent?.type.startsWith('dare_'))
      void activity.recover(0);
  }, [live, activity.lastEvent?.id]);
  const act = useCallback(
    async (name: string, payload: Record<string, unknown> = {}) => {
      setBusy(true);
      setError(null);
      try {
        if (live && activity.sessionId) {
          const x = await applyDareAction<Snap>(
            activity.sessionId,
            name,
            payload,
            revisionRef.current || undefined,
          );
          revisionRef.current = x.revision;
          setRemote(x.snapshot);
          await activity.recover(0);
        } else setLocal((s) => localMove(s, name, payload));
      } catch (e: any) {
        setError(
          String(e?.message || 'That move did not go through.').includes(
            'REVISION_CONFLICT',
          )
            ? 'Your partner moved first. Refreshing the table…'
            : String(e?.message || 'That move did not go through.').replace(
                /^.*?: /,
                '',
              ),
        );
        if (live) await activity.recover(0);
      } finally {
        setBusy(false);
      }
    },
    [live, activity.sessionId, activity.revision, activity.recover],
  );
  useEffect(() => {
    if (stage !== 'spinning' || !snap.bottleSpin) return;
    const ms = Math.max(
      0,
      new Date(snap.bottleSpin.settlesAt).getTime() - activity.getServerNow(),
    );
    const t = setTimeout(
      () => void act('dare_spin_resolved'),
      reduce ? Math.min(ms, 400) : ms,
    );
    return () => clearTimeout(t);
  }, [stage, snap.bottleSpin?.spinId]);
  useEffect(() => {
    if (stage === 'prompt_reveal' && myTurn)
      void act('dare_prompt_drawn', {
        catalogSize: list.length,
        catalogVersion: 'distance-v2',
      });
  }, [stage, myTurn, snap.promptType, deckId]);
  useEffect(() => {
    if (
      !live ||
      !activity.sessionId ||
      stage !== 'partner_reaction' ||
      snap.promptType !== 'truth' ||
      shown
    )
      return;
    void revealDareTruthAnswer(activity.sessionId)
      .then((result) => setShown(result.answer.answer))
      .catch(() => setError('The revealed answer is reconnecting…'));
  }, [live, activity.sessionId, stage, snap.promptType, shown]);
  const lock = async () => {
    if (!answer.trim()) return;
    if (live && activity.sessionId) {
      setBusy(true);
      try {
        await lockDareTruthAnswer(activity.sessionId, answer.trim());
        await act('dare_answer_locked');
        const x = await revealDareTruthAnswer(activity.sessionId);
        setShown(x.answer.answer || answer.trim());
        await act('dare_answer_revealed');
      } catch (e: any) {
        setError(e?.message || 'Your answer could not be locked.');
        setBusy(false);
      }
    } else {
      setShown(answer.trim());
      await act('dare_answer_locked');
      await act('dare_answer_revealed');
    }
  };
  const save = async () => {
    const text = `Truth or Dare\n${couple.partnerA} & ${couple.partnerB}\n${snap.completedTruths || 0} truths · ${snap.completedDares || 0} dares\nA little braver, a little closer.`,
      file = new Blob([text], { type: 'text/plain' });
    if (keepsake.canSaveKeepsake)
      await keepsake.saveKeepsake({
        kind: 'activity',
        title: 'Our Truth or Dare night',
        file,
        activityPath: '/dare',
        caption: 'A little braver, a little closer.',
        metadata: {
          truths: snap.completedTruths || 0,
          dares: snap.completedDares || 0,
        },
      });
    else {
      const u = URL.createObjectURL(file),
        a = document.createElement('a');
      a.href = u;
      a.download = 'dearly-us-truth-or-dare.txt';
      a.click();
      URL.revokeObjectURL(u);
    }
    setSaved(true);
  };
  const shellStage =
    stage === 'finished'
      ? 'remember'
      : ['welcome', 'choose_deck', 'ready_to_spin'].includes(stage)
        ? 'ready'
        : 'play';
  return (
    <ActivityShell
      activityKey="dare"
      title="Truth or Dare"
      subtitle="One bottle. Two people. No distance between the answers."
      stage={shellStage}
      roomCode={couple.roomCode}
      isSoloDemo={!live}
      partnerName={couple.partnerB}
      recoveryState={activity.recoveryState}
      onRetryRecovery={() => void activity.recover(0)}
      cupidotPhase={stage === 'finished' ? 'completed' : 'revealed'}
      cupidotNote="Truth answers stay private until they are locked and revealed."
    >
      <main className={styles.court}>
        <div className={styles.curtain} />
        <header className={styles.intro}>
          <span>THE BOTTLE TABLE · ROUND {snap.roundNumber || 1}</span>
          <h1>
            {stage === 'finished'
              ? 'A little braver. A little closer.'
              : 'Spin across the miles.'}
          </h1>
          <p>
            {stage === 'finished'
              ? 'Keep the answers, the ridiculous dares, and the feeling of being in one room.'
              : 'A classic bottle chooses who goes next. The chosen person decides how brave the moment gets.'}
          </p>
        </header>
        {error && (
          <div className={styles.notice} role="alert">
            {error}
          </div>
        )}
        {['welcome', 'choose_deck'].includes(stage) && (
          <section className={styles.deckRoom}>
            <div className={styles.tableNote}>
              <Sparkles size={18} /> Pick the mood together
            </div>
            <h2>What kind of night is it?</h2>
            <div className={styles.deckGrid}>
              {(Object.entries(DARE_DECKS) as [DareDeckId, typeof deck][]).map(
                ([id, d]) => (
                  <button
                    key={id}
                    className={styles.deckCard}
                    onClick={() => void act('dare_deck_selected', { deck: id })}
                    disabled={busy}
                  >
                    <span>{id === 'spicy' ? '18+' : 'DU'}</span>
                    <strong>{d.name}</strong>
                    <small>{d.note}</small>
                    <i>
                      Choose deck <ChevronRight size={15} />
                    </i>
                  </button>
                ),
              )}
            </div>
            {snap.requestedDeck === 'spicy' && (
              <div className={styles.consent}>
                <ShieldCheck />
                <div>
                  <strong>Both people choose this deck</strong>
                  <p>
                    Either person can pass any prompt. No explanation needed.
                  </p>
                </div>
                <button
                  onClick={() =>
                    void act('dare_spicy_consent_set', { accepted: true })
                  }
                >
                  I’m comfortable
                </button>
              </div>
            )}
          </section>
        )}
        {!['welcome', 'choose_deck', 'finished'].includes(stage) && (
          <section className={styles.booth}>
            <Seat name={couple.partnerA} />
            <div className={styles.table}>
              <div className={styles.bottle}>
                <BottleSpinner
                  finalRotationDegrees={
                    snap.bottleSpin?.finalRotationDegrees || 0
                  }
                  spinId={snap.bottleSpin?.spinId}
                  spinning={stage === 'spinning'}
                  reducedMotion={reduce}
                />
              </div>
              <div className={styles.panel}>
                {stage === 'ready_to_spin' && (
                  <button
                    className={styles.spin}
                    onClick={() => void act('dare_spin_requested')}
                    disabled={busy}
                  >
                    <RotateCw /> Spin the bottle
                  </button>
                )}
                {stage === 'spinning' && (
                  <div className={styles.status}>Bottle in motion…</div>
                )}
                {stage === 'choose_truth_or_dare' &&
                  (myTurn ? (
                    <div className={styles.choice}>
                      <p>
                        The bottle chose <b>{chosen}</b>
                      </p>
                      <button
                        onClick={() =>
                          void act('dare_type_selected', { type: 'truth' })
                        }
                      >
                        Truth
                      </button>
                      <button
                        onClick={() =>
                          void act('dare_type_selected', { type: 'dare' })
                        }
                      >
                        Dare
                      </button>
                    </div>
                  ) : (
                    <Wait name={chosen} />
                  ))}
                {stage === 'answering' && (
                  <div className={styles.prompt}>
                    <span>{snap.promptType}</span>
                    <h2>{prompt}</h2>
                    {myTurn ? (
                      snap.promptType === 'truth' ? (
                        <div>
                          <textarea
                            value={answer}
                            onChange={(e) =>
                              setAnswer(e.target.value.slice(0, 280))
                            }
                            placeholder="Type your honest answer…"
                          />
                          <small>
                            {answer.length}/280 · hidden until locked
                          </small>
                          <button
                            onClick={() => void lock()}
                            disabled={busy || !answer.trim()}
                          >
                            Lock and reveal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => void act('dare_challenge_completed')}
                        >
                          <Check /> I did the dare
                        </button>
                      )
                    ) : (
                      <Wait name={chosen} />
                    )}{' '}
                    {myTurn && (
                      <nav>
                        <button onClick={() => void act('dare_prompt_passed')}>
                          Pass gently
                        </button>
                        <button
                          onClick={() => void act('dare_prompt_rerolled')}
                          disabled={(snap.rerollCount || 0) >= 1}
                        >
                          One reroll
                        </button>
                      </nav>
                    )}
                  </div>
                )}
                {stage === 'partner_reaction' && (
                  <div className={styles.reaction}>
                    <span>HEARD</span>
                    <h2>
                      {snap.promptType === 'truth' && shown
                        ? `“${shown}”`
                        : 'Dare completed across the miles.'}
                    </h2>
                    {myTurn ? (
                      <p>Waiting for your person to seal the round.</p>
                    ) : (
                      <>
                        <div>
                          {REACTIONS.map(([id, label]) => (
                            <button
                              key={id}
                              data-on={snap.reaction === id}
                              onClick={() =>
                                void act('dare_partner_reacted', {
                                  reaction: id,
                                })
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => void act('dare_challenge_confirmed')}
                          disabled={!snap.reaction}
                        >
                          Seal this round
                        </button>
                      </>
                    )}
                  </div>
                )}
                {stage === 'round_complete' && (
                  <div className={styles.complete}>
                    <Check />
                    <h2>Kept between you two.</h2>
                    <p>
                      {snap.completedTruths || 0} truths ·{' '}
                      {snap.completedDares || 0} dares
                    </p>
                    <button onClick={() => void act('dare_next_round_started')}>
                      Spin again
                    </button>
                    <button onClick={() => void act('dare_session_finished')}>
                      Finish tonight
                    </button>
                  </div>
                )}
              </div>
            </div>
            <Seat name={couple.partnerB} />
          </section>
        )}
        {stage === 'finished' && (
          <section className={styles.keepsake}>
            <div className={styles.paper}>
              <span>DEARLY US · TRUTH OR DARE</span>
              <h2>Our night at the bottle table</h2>
              <div>
                <b>
                  {snap.completedTruths || 0}
                  <small>truths told</small>
                </b>
                <i />
                <b>
                  {snap.completedDares || 0}
                  <small>dares done</small>
                </b>
              </div>
              <p>
                {couple.partnerA} & {couple.partnerB}
                <br />A little braver, a little closer.
              </p>
            </div>
            <nav>
              <button
                onClick={() => void save()}
                disabled={saved || keepsake.saving}
              >
                {saved
                  ? 'Saved to Our Space'
                  : keepsake.saving
                    ? 'Saving…'
                    : 'Keep this memory'}
              </button>
              <button onClick={() => void act('dare_rematch_started')}>
                Play another night
              </button>
            </nav>
          </section>
        )}
      </main>
    </ActivityShell>
  );
}

function Seat({ name }: { name: string }) {
  return (
    <div className={styles.seat}>
      <span>{name.slice(0, 1)}</span>
      <strong>{name}</strong>
      <small>at the table</small>
    </div>
  );
}
function Wait({ name }: { name: string }) {
  return (
    <div className={styles.wait}>
      <LockKeyhole />
      <strong>{name} has the moment</strong>
      <span>Stay close. Their choice is private.</span>
    </div>
  );
}
