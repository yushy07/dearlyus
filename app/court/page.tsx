'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  Gavel,
  Heart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ActivityShell } from '@/components/shared';
import { Cupidot2D } from '@/components/bot/Cupidot2D';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import { useCoupleProfile } from '@/lib/couple';
import { sounds } from '@/lib/sound';
import {
  COURT_TOPICS,
  OBJECTIONS,
  courtBotState,
  initialCourt,
  localReaction,
  localVerdict,
  normalizeCourt,
  objectionResponse,
  pickCourtTwist,
  reduceCourt,
  seriousTopic,
  type CourtReaction,
  type CourtSnapshot,
  type CourtStage,
  type CourtVerdict,
} from '@/lib/court';
import { askCourtJudge, submitCourtAction } from '@/lib/court-client';
import { createCourtRuling, downloadCourtRuling } from '@/lib/court-keepsake';
import './court.css';

const STEPS = ['Topic', 'Your sides', 'Judge asks', 'Tiny twist', 'Ruling'];

export default function CourtPage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const keepsakes = useKeepsakeWriter();
  const runtime = useActivityRuntime<CourtSnapshot>({
    activityType: 'court',
    transportMode: 'auto',
  });
  const live =
    runtime.transportName === 'supabase' && Boolean(runtime.sessionId);
  const [local, setLocal] = useState<CourtSnapshot>(() => initialCourt());
  const court = live ? normalizeCourt(runtime.snapshot) : local;
  const [introDismissed, setIntroDismissed] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [statementOne, setStatementOne] = useState('');
  const [statementTwo, setStatementTwo] = useState('');
  const [followupOne, setFollowupOne] = useState('');
  const [followupTwo, setFollowupTwo] = useState('');
  const [softened, setSoftened] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (live) setIntroDismissed(true);
  }, [live]);

  const names = useMemo(() => {
    if (!live) return { first: partnerA, second: partnerB };
    return court.firstSpeakerId === runtime.currentUserId
      ? { first: partnerA, second: partnerB }
      : { first: partnerB, second: partnerA };
  }, [court.firstSpeakerId, live, partnerA, partnerB, runtime.currentUserId]);

  const step =
    court.stage === 'welcome' || court.stage === 'choose_topic'
      ? 0
      : ['statement_one', 'statement_two', 'reveal'].includes(court.stage)
        ? 1
        : court.stage === 'judge_question'
          ? 2
          : ['judge_twist', 'deliberating'].includes(court.stage)
            ? 3
            : 4;

  async function serverAction(
    action: string,
    payload: Record<string, unknown> = {},
  ) {
    if (!runtime.sessionId || !runtime.runtime)
      throw new Error('The shared Court room is not ready yet.');
    const result = await submitCourtAction(
      runtime.sessionId,
      runtime.runtime.getRevision(),
      action,
      payload,
    );
    await runtime.requestRecovery();
    return result;
  }

  function localEvent(
    type: string,
    payload: Record<string, unknown> = {},
    senderId = runtime.currentUserId,
  ) {
    setLocal((value) =>
      reduceCourt(value, {
        id: crypto.randomUUID(),
        sequence: Date.now(),
        schemaVersion: 2,
        senderId,
        createdAt: new Date().toISOString(),
        activityType: 'court',
        type,
        payload,
      }),
    );
  }

  async function guarded(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Judge Cupidot dropped a page. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  function startTopic(topicKey: string, topic: string) {
    if (!topic.trim()) return;
    if (seriousTopic(topic)) {
      setError(
        'This one deserves a real conversation without my tiny gavel. Let’s choose a lighter disagreement for Court.',
      );
      return;
    }
    sounds.playPop();
    void guarded(async () => {
      if (live)
        await serverAction('court_topic_selected', {
          topicKey,
          topic: topic.trim(),
        });
      else
        localEvent('court_topic_selected', {
          topicKey,
          topic: topic.trim(),
          firstSpeakerId: 'partner-a',
          secondSpeakerId: 'partner-b',
        });
    });
  }

  async function lockStatement(slot: 1 | 2) {
    const answer = (slot === 1 ? statementOne : statementTwo).trim();
    if (!answer) return;
    await guarded(async () => {
      if (live) {
        const round = 2001 + court.rematchCount * 10;
        const lock = await runtime.privateVault.lockAnswer(round, {
          statement: answer,
          slot,
        });
        await serverAction('court_statement_locked', { slot });
        if (slot === 2 && lock.bothLocked) {
          const revealed = await runtime.privateVault.revealAnswers(round);
          const first = revealed.answers.find(
            (entry) => (entry.answer as { slot?: number })?.slot === 1,
          );
          const second = revealed.answers.find(
            (entry) => (entry.answer as { slot?: number })?.slot === 2,
          );
          await serverAction('court_statements_revealed', {
            statementOne: String(
              (first?.answer as { statement?: string })?.statement || '',
            ),
            statementTwo: String(
              (second?.answer as { statement?: string })?.statement || '',
            ),
          });
        }
      } else {
        localEvent(
          'court_statement_locked',
          { slot },
          slot === 1 ? 'partner-a' : 'partner-b',
        );
        if (slot === 2)
          localEvent(
            'court_statements_revealed',
            { statementOne, statementTwo },
            'partner-b',
          );
      }
      sounds.playPop();
    });
  }

  async function askReaction() {
    await guarded(async () => {
      if (live && runtime.sessionId && runtime.runtime) {
        await askCourtJudge(
          runtime.sessionId,
          runtime.runtime.getRevision(),
          'reaction',
        );
        await runtime.requestRecovery();
      } else
        localEvent(
          'court_question_created',
          localReaction(court) as unknown as Record<string, unknown>,
        );
      sounds.playPop();
    });
  }

  async function lockFollowups() {
    if (!followupOne.trim() || (!live && !followupTwo.trim())) return;
    await guarded(async () => {
      const twist = pickCourtTwist(court.topicKey);
      if (live) {
        const round = 2003 + court.rematchCount * 10;
        const lock = await runtime.privateVault.lockAnswer(round, {
          followup: followupOne.trim(),
        });
        await serverAction('court_followup_locked');
        if (lock.bothLocked) {
          const revealed = await runtime.privateVault.revealAnswers(round);
          await serverAction('court_followups_revealed', {
            answers: revealed.answers,
            hasTwist: Boolean(twist),
          });
        } else
          setError(
            'Your answer is sealed. Your partner can answer privately on their screen.',
          );
        return;
      }
      localEvent('court_followup_locked', {}, 'partner-a');
      localEvent('court_followup_locked', {}, 'partner-b');
      localEvent('court_followups_revealed', {
        answers: [
          { userId: 'partner-a', answer: followupOne },
          { userId: 'partner-b', answer: followupTwo },
        ],
        hasTwist: Boolean(twist),
      });
      if (twist)
        localEvent(
          'court_twist_started',
          twist as unknown as Record<string, unknown>,
        );
      sounds.playPop();
    });
  }

  async function object(label: string) {
    await guarded(async () => {
      const payload = { label, response: objectionResponse(label) };
      if (live) await serverAction('court_objection_used', payload);
      else
        localEvent(
          'court_objection_used',
          payload,
          court.objectionsUsed.includes('partner-a')
            ? 'partner-b'
            : 'partner-a',
        );
      sounds.playPop();
    });
  }

  async function deliverVerdict() {
    if (live && runtime.sessionId && runtime.runtime) {
      await serverAction('court_deliberation_started');
      await askCourtJudge(
        runtime.sessionId,
        runtime.runtime.getRevision(),
        'verdict',
      );
      await runtime.requestRecovery();
    } else {
      localEvent('court_deliberation_started');
      await new Promise((resolve) => setTimeout(resolve, 650));
      localEvent(
        'court_verdict_created',
        localVerdict(court) as unknown as Record<string, unknown>,
      );
    }
    sounds.playCelebration();
  }

  async function finishTwist(choice: string) {
    await guarded(async () => {
      if (live) await serverAction('court_twist_completed', { choice });
      else localEvent('court_twist_completed', { choice });
      if (!live || runtime.isHost) await deliverVerdict();
    });
  }

  async function soften() {
    if (softened || !court.verdict) return;
    await guarded(async () => {
      if (live && runtime.sessionId && runtime.runtime) {
        await askCourtJudge(
          runtime.sessionId,
          runtime.runtime.getRevision(),
          'soften',
        );
        await runtime.requestRecovery();
      } else
        localEvent('court_sentence_softened', {
          playfulSentence:
            'Share one cosy moment today and let the person who smiles first choose the snack.',
          judgeClosingLine:
            'A softer ruling, sealed with one extremely tiny heart.',
        });
      setSoftened(true);
      sounds.playPop();
    });
  }

  async function accept() {
    await guarded(async () => {
      if (live) await serverAction('court_verdict_accepted');
      else {
        localEvent('court_verdict_accepted', {}, 'partner-a');
        localEvent('court_round_finished', {}, 'partner-b');
      }
      sounds.playCelebration();
    });
  }

  async function makeRuling(download: boolean) {
    if (!court.verdict) return;
    await guarded(async () => {
      const blob = await createCourtRuling(court, partnerA, partnerB);
      if (download) downloadCourtRuling(blob);
      else {
        await keepsakes.saveKeepsake({
          kind: 'activity',
          title: `Official Tiny Court Ruling · ${court.verdict!.title}`,
          file: blob,
          activityPath: '/court',
          caption: court.verdict!.playfulSentence,
          metadata: {
            activityType: 'court',
            topic: court.topic,
            statements: court.statements,
            verdict: court.verdict,
          },
        });
        setSaved(true);
      }
    });
  }

  async function rematch() {
    await guarded(async () => {
      if (live) await serverAction('court_rematch_started');
      else localEvent('court_rematch_started');
      setStatementOne('');
      setStatementTwo('');
      setFollowupOne('');
      setFollowupTwo('');
      setSaved(false);
      setSoftened(false);
    });
  }

  const myTurn =
    !live ||
    (court.stage === 'statement_one'
      ? court.firstSpeakerId
      : court.secondSpeakerId) === runtime.currentUserId;
  const shellStage = step === 0 ? 'ready' : step === 4 ? 'remember' : 'play';

  return (
    <ActivityShell
      activityKey="court"
      activityTitle="Couples Court"
      activitySubtitle="Tiny disagreements. Enormous drama. Affectionate rulings."
      currentStage={shellStage}
      isSoloDemo={!live}
      roomCode={runtime.roomCode || undefined}
      partnerName={partnerB}
      partnerPresence={runtime.partnerOnline ? 'online' : 'offline'}
      recoveryState={runtime.recoveryState}
      onRetryRecovery={() => void runtime.requestRecovery()}
      guidancePhase={court.stage === 'verdict' ? 'revealed' : 'private'}
      guidancePrivacyNote="Your draft stays private. Only locked answers are revealed together."
    >
      <div className="tiny-court">
        <nav className="court-progress" aria-label="Court progress">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={index === step ? 'active' : index < step ? 'done' : ''}
            >
              <b>{index + 1}</b>
              {label}
            </span>
          ))}
        </nav>
        <section
          className={`courtroom stage-${court.stage}`}
          aria-live="polite"
        >
          <div className="velvet-curtain curtain-left" aria-hidden="true" />
          <div className="velvet-curtain curtain-right" aria-hidden="true" />
          <div className="court-crest" aria-hidden="true">
            ♡
          </div>
          <Judge
            reaction={court.judgeReaction?.reaction || court.verdict?.reaction}
            stage={court.stage}
          />
          <Desk
            side="left"
            name={names.first}
            active={court.stage === 'statement_one'}
          />
          <Desk
            side="right"
            name={names.second}
            active={court.stage === 'statement_two'}
          />
          <main className="court-center">
            {!introDismissed && court.stage === 'welcome' && (
              <Welcome
                onStart={() => {
                  sounds.playPop();
                  setIntroDismissed(true);
                }}
              />
            )}
            {introDismissed &&
              (court.stage === 'welcome' || court.stage === 'choose_topic') && (
                <TopicPicker
                  custom={customTopic}
                  setCustom={setCustomTopic}
                  onPick={startTopic}
                  busy={busy}
                />
              )}
            {court.stage === 'statement_one' && (
              <StatementTurn
                name={names.first}
                value={statementOne}
                setValue={setStatementOne}
                onLock={() => void lockStatement(1)}
                canWrite={myTurn}
                busy={busy}
              />
            )}
            {court.stage === 'statement_two' && (
              <StatementTurn
                name={names.second}
                value={statementTwo}
                setValue={setStatementTwo}
                onLock={() => void lockStatement(2)}
                canWrite={myTurn}
                busy={busy}
              />
            )}
            {court.stage === 'reveal' && (
              <Reveal
                court={court}
                names={names}
                onContinue={() => void askReaction()}
                busy={busy}
              />
            )}
            {court.stage === 'judge_question' && (
              <JudgeQuestion
                reaction={court.judgeReaction}
                first={followupOne}
                second={followupTwo}
                setFirst={setFollowupOne}
                setSecond={setFollowupTwo}
                names={names}
                live={live}
                onLock={() => void lockFollowups()}
                busy={busy}
              />
            )}
            {court.stage === 'judge_twist' && (
              <JudgeTwist
                court={court}
                onChoose={(choice) => void finishTwist(choice)}
                busy={busy}
              />
            )}
            {court.stage === 'deliberating' && (
              <Deliberating
                onVerdict={() => void guarded(deliverVerdict)}
                busy={busy}
                live={live}
              />
            )}
            {(court.stage === 'verdict' || court.stage === 'finished') &&
              court.verdict && (
                <VerdictCard
                  verdict={court.verdict}
                  finished={court.stage === 'finished'}
                  accepted={court.acceptedBy.length}
                  live={live}
                  softened={softened}
                  onSoften={() => void soften()}
                  onAccept={() => void accept()}
                  onDownload={() => void makeRuling(true)}
                  onSave={() => void makeRuling(false)}
                  saving={busy || keepsakes.saving}
                  saved={saved}
                  onRematch={() => void rematch()}
                />
              )}
          </main>
          {['reveal', 'judge_question', 'judge_twist'].includes(
            court.stage,
          ) && (
            <ObjectionBar
              used={court.objectionsUsed.length}
              response={court.objection?.response}
              onObject={(label) => void object(label)}
              busy={busy}
            />
          )}
        </section>
        {error && (
          <div className="court-error" role="alert">
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
    </ActivityShell>
  );
}

function Judge({
  reaction,
  stage,
}: {
  reaction?: CourtReaction['reaction'];
  stage: CourtStage;
}) {
  const thinking = stage === 'deliberating';
  return (
    <div
      className={`judge-bench ${thinking ? 'thinking' : ''}`}
      aria-label="Judge Cupidot"
    >
      <div className="judge-label">JUDGE CUPIDOT</div>
      <div className="judge-cupidot">
        <Cupidot2D
          state={thinking ? 'thinking' : courtBotState(reaction)}
          size={150}
        />
        <span className="judge-robe" />
        <span className="judge-collar">♡</span>
        {thinking && <span className="judge-glasses">⌁⌁</span>}
        <span className="tiny-gavel">♥</span>
      </div>
    </div>
  );
}

function Desk({
  side,
  name,
  active,
}: {
  side: 'left' | 'right';
  name: string;
  active: boolean;
}) {
  return (
    <div className={`partner-desk desk-${side} ${active ? 'active' : ''}`}>
      <span className="desk-lamp" />
      <strong>{name}</strong>
      <small>{active ? 'Cupidot is listening' : 'Waiting at the desk'}</small>
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <article className="court-card welcome-card">
      <span className="eyebrow">TONIGHT’S TINY HEARING</span>
      <h1>Welcome to Couples Court</h1>
      <p>
        Where the charges are tiny, the drama is enormous, and every sentence is
        payable in affection.
      </p>
      <ol>
        <li>Pick something silly.</li>
        <li>Tell both sides privately.</li>
        <li>Answer the Judge.</li>
        <li>Receive the ruling.</li>
      </ol>
      <button className="gavel-button" onClick={onStart}>
        <Gavel size={20} /> Call our Court to order
      </button>
      <small>About 3–5 minutes · one playful round</small>
    </article>
  );
}

function TopicPicker({
  custom,
  setCustom,
  onPick,
  busy,
}: {
  custom: string;
  setCustom: (v: string) => void;
  onPick: (id: string, topic: string) => void;
  busy: boolean;
}) {
  return (
    <article className="court-card topic-card">
      <span className="eyebrow">A VERY SMALL MATTER</span>
      <h2>What requires Judge Cupidot’s attention?</h2>
      <p>Choose an everyday disagreement worth laughing about.</p>
      <div className="topic-grid">
        {COURT_TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onPick(topic.id, topic.prompt)}
            disabled={busy}
          >
            <span>{topic.icon}</span>
            <strong>{topic.title}</strong>
            <small>{topic.prompt}</small>
          </button>
        ))}
      </div>
      <div className="custom-matter">
        <label htmlFor="custom-matter">Or bring your own tiny matter</label>
        <div>
          <input
            id="custom-matter"
            maxLength={180}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Who keeps leaving mugs beside the bed?"
          />
          <button
            onClick={() => onPick('custom', custom)}
            disabled={!custom.trim() || busy}
          >
            Bring it in
          </button>
        </div>
      </div>
    </article>
  );
}

function StatementTurn({
  name,
  value,
  setValue,
  onLock,
  canWrite,
  busy,
}: {
  name: string;
  value: string;
  setValue: (v: string) => void;
  onLock: () => void;
  canWrite: boolean;
  busy: boolean;
}) {
  if (!canWrite)
    return (
      <article className="court-card waiting-card">
        <div className="sealed-note">♡</div>
        <h2>Judge Cupidot is hearing the other side</h2>
        <p>
          No whispering to the bench. Their words remain private until both
          sides are ready.
        </p>
      </article>
    );
  return (
    <article className="court-card statement-card">
      <span className="eyebrow">{name.toUpperCase()}’S TURN</span>
      <h2>Tell Cupidot your side</h2>
      <p>Keep it short, honest and delightfully dramatic.</p>
      <div className="court-paper">
        <textarea
          autoFocus
          maxLength={280}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Here is what happened from my highly reliable perspective…"
        />
        <small>{value.length} / 280 · private until locked</small>
      </div>
      <button
        className="brass-button"
        onClick={onLock}
        disabled={!value.trim() || busy}
      >
        That’s my side <span>♡</span>
      </button>
    </article>
  );
}

function Reveal({
  court,
  names,
  onContinue,
  busy,
}: {
  court: CourtSnapshot;
  names: { first: string; second: string };
  onContinue: () => void;
  busy: boolean;
}) {
  return (
    <article className="court-card reveal-card">
      <span className="eyebrow">BOTH STORIES, SIDE BY SIDE</span>
      <h2>The tiny truth has unfolded</h2>
      <div className="story-pair">
        <blockquote>
          <strong>{names.first}</strong>
          <p>{court.statements?.one}</p>
          <span>HEARD BY THE JUDGE</span>
        </blockquote>
        <blockquote>
          <strong>{names.second}</strong>
          <p>{court.statements?.two}</p>
          <span>HEARD BY THE JUDGE</span>
        </blockquote>
      </div>
      <button className="gavel-button" onClick={onContinue} disabled={busy}>
        <Sparkles size={18} /> Cupidot, compare our stories
      </button>
    </article>
  );
}

function JudgeQuestion({
  reaction,
  first,
  second,
  setFirst,
  setSecond,
  names,
  live,
  onLock,
  busy,
}: {
  reaction?: CourtReaction;
  first: string;
  second: string;
  setFirst: (v: string) => void;
  setSecond: (v: string) => void;
  names: { first: string; second: string };
  live: boolean;
  onLock: () => void;
  busy: boolean;
}) {
  return (
    <article className="court-card question-card">
      <span className="eyebrow">THE JUDGE LEANS FORWARD</span>
      <p className="judge-observation">“{reaction?.comparison}”</p>
      <div className="fair-summary">
        <p>
          <b>{names.first}:</b> {reaction?.summaryOne}
        </p>
        <p>
          <b>{names.second}:</b> {reaction?.summaryTwo}
        </p>
      </div>
      <h2>{reaction?.question}</h2>
      <div className="followup-papers">
        <label>
          {live ? 'Your private answer' : names.first}
          <textarea
            maxLength={180}
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
        </label>
        {!live && (
          <label>
            {names.second}
            <textarea
              maxLength={180}
              value={second}
              onChange={(e) => setSecond(e.target.value)}
            />
          </label>
        )}
      </div>
      <button
        className="brass-button"
        onClick={onLock}
        disabled={!first.trim() || (!live && !second.trim()) || busy}
      >
        {live ? 'Seal my answer' : 'Reveal both answers'}
      </button>
    </article>
  );
}

function JudgeTwist({
  court,
  onChoose,
  busy,
}: {
  court: CourtSnapshot;
  onChoose: (choice: string) => void;
  busy: boolean;
}) {
  const twist = court.twist || pickCourtTwist(court.topicKey);
  if (!twist)
    return (
      <Deliberating
        onVerdict={() => onChoose('No twist needed')}
        busy={busy}
        live={false}
      />
    );
  return (
    <article className="court-card twist-card">
      <span className="eyebrow">JUDGE’S TWIST · 20 SECONDS</span>
      <h2>{twist.title}</h2>
      <p>{twist.prompt}</p>
      <div className="twist-options">
        {twist.options.map((option) => (
          <button key={option} onClick={() => onChoose(option)} disabled={busy}>
            {option}
          </button>
        ))}
      </div>
    </article>
  );
}

function Deliberating({
  onVerdict,
  busy,
  live,
}: {
  onVerdict: () => void;
  busy: boolean;
  live: boolean;
}) {
  return (
    <article className="court-card deliberating-card">
      <div className="notebook">
        ♡<i />
        <i />
        <i />
      </div>
      <h2>Thinking very seriously about something extremely unserious…</h2>
      <p>
        Cupidot is comparing every tiny detail and preparing an affectionate
        ruling.
      </p>
      <button className="gavel-button" onClick={onVerdict} disabled={busy}>
        {busy
          ? 'Tiny wheels turning…'
          : live
            ? 'Ask for the ruling'
            : 'Read the ruling'}
      </button>
    </article>
  );
}

function ObjectionBar({
  used,
  response,
  onObject,
  busy,
}: {
  used: number;
  response?: string;
  onObject: (label: string) => void;
  busy: boolean;
}) {
  return (
    <aside className="objection-bar">
      <div>
        <b>One playful objection each</b>
        <small>{Math.min(used, 2)} of 2 tokens used</small>
      </div>
      <div className="objection-options">
        {OBJECTIONS.map((label) => (
          <button
            key={label}
            onClick={() => onObject(label)}
            disabled={used >= 2 || busy}
          >
            {label}
          </button>
        ))}
      </div>
      {response && <p>Judge Cupidot: “{response}”</p>}
    </aside>
  );
}

function VerdictCard({
  verdict,
  finished,
  accepted,
  live,
  softened,
  onSoften,
  onAccept,
  onDownload,
  onSave,
  saving,
  saved,
  onRematch,
}: {
  verdict: CourtVerdict;
  finished: boolean;
  accepted: number;
  live: boolean;
  softened: boolean;
  onSoften: () => void;
  onAccept: () => void;
  onDownload: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  onRematch: () => void;
}) {
  return (
    <article className="court-card verdict-card">
      <span className="eyebrow">OFFICIAL TINY COURT RULING</span>
      <div className="verdict-seal">♡</div>
      <h1>{verdict.title}</h1>
      <p className="comparison">{verdict.comparison}</p>
      <p>{verdict.funnyReason}</p>
      <section className="sentence">
        <small>THE AFFECTIONATE SENTENCE</small>
        <strong>{verdict.playfulSentence}</strong>
      </section>
      <blockquote>“{verdict.judgeClosingLine}”</blockquote>
      {!finished ? (
        <div className="acceptance">
          <button onClick={onAccept} disabled={saving}>
            <Check size={17} /> We accept the ruling
          </button>
          <button onClick={onSoften} disabled={softened || saving}>
            <Heart size={17} />{' '}
            {softened ? 'Sentence softened' : 'Judge, make it gentler'}
          </button>
          {live && <small>{accepted}/2 partners accepted</small>}
        </div>
      ) : (
        <div className="print-slot">
          <span>YOUR RULING IS READY</span>
          <div className="ruling-ticket">
            <b>{verdict.title}</b>
            <small>Sealed by Judge Cupidot ♡</small>
          </div>
          <div className="finish-actions">
            <button onClick={onDownload} disabled={saving}>
              <Download size={16} /> Download ruling
            </button>
            <button onClick={onSave} disabled={saved || saving}>
              {saved ? <Check size={16} /> : <Heart size={16} />}
              {saved
                ? 'Saved in Our Space'
                : saving
                  ? 'Saving…'
                  : 'Save to Our Space'}
            </button>
            <button onClick={onRematch} disabled={saving}>
              <RotateCcw size={16} /> Another tiny matter
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
