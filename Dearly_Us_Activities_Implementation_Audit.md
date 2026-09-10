# Dearly Us Activities Implementation Audit

**Audit date:** 10 September 2026  
**Scope:** Desktop implementation and live Supabase. Mobile work is intentionally excluded.

## Executive status

The visual and interaction work is substantial, but the full roadmap is **not yet complete**. All catalogue activities now have distinct page designs and most have adapters, keepsake calls, and a shared-shell attempt. The main blocker is the integration layer: most pages construct a fake session identifier from the room code, several newer pages call hook properties that do not exist, and the shared shell is invoked with a different prop contract than the component exposes. This means the UI can bundle, but the live two-person journeys are not reliable yet.

The live Supabase backend is now completed for the reusable foundation needed by the current site. The unsafe local draft was replaced with an additive patch that matches the production `couples`, `room_members`, `activity_sessions`, `keepsakes`, and `relationship_milestones` models.

## Live Supabase completed

- Preserved the existing secured activity session, event replay, private-answer, recovery, pause, completion, room, and keepsake functions.
- Added `plans_and_milestones` for Future, Timezone/Reunion, Bucket List, Date Planner, rituals, forecasts, Lab sessions, Love Match, and date-night capsules.
- Added `temporary_assets` with ownership, expiry, size, media-type, and approval metadata.
- Added the private `activity-assets` Storage bucket with a 12 MiB limit and image/audio MIME allow-list.
- Added room participant activity role, last acknowledged revision, and reconnect metadata.
- Added authenticated RPCs for date-night capsules, daily ritual entries, scheduled dates, temporary asset registration, and revision acknowledgement.
- Added and verified RLS and Storage policies. Anonymous execution access to the five new functions is zero.

Live verification result: both new tables present, private bucket present, three room recovery columns present, five functions present, twelve related database/Storage policies present, and no anonymous function execution.

## Foundation gaps that affect nearly every activity

1. **The page/runtime contract is split.** `ActivitySessionContext` knows the real UUID returned by `start_activity`, while most pages bypass it and call `useActivityRuntime` with values such as `room-LOVE123-quiz`. Supabase expects a UUID, so these pages cannot be called live safely.
2. **The hook API and page API disagree.** Bucket, Date Planner, Forecast, Lab, Love Match, Timezone and Reunion expect `dispatch`, `roomId`, `isHost`, and `partnerPresence`, which `useActivityRuntime` does not return.
3. **The shell API and page API disagree.** Most revamped pages pass `activityTitle`, `activitySubtitle`, `currentStage`, guidance fields, and a keepsake summary, but `ActivityShell` expects `activityKey`, `title`, `subtitle`, `stage`, `cupidotPhase`, `cupidotNote`, and a rendered keepsake rail.
4. **The keepsake API disagrees in six newer pages.** Those pages expect `isSaving` and a `subtitle` field; the hook exposes `saving`, and `SaveKeepsakeInput` has no `subtitle`.
5. **Passing adapters does not prove live play.** Several pages keep the actual game state in component state and merely emit occasional events. Recovery therefore cannot reconstruct the visible screen reliably.
6. **Server authority is incomplete.** Competitive activities still calculate random outcomes, timers, or scores in the browser. Refreshing or using two clients can produce different results.
7. **Catalogue recovery is absent.** Metadata and filters are implemented, but the activity catalogue does not query recoverable sessions or show a real Continue action.

## Activity-by-activity status

| Activity | What is already strong | What is still lacking before roadmap completion |
|---|---|---|
| Photobooth | Complete specialist flow, camera/upload paths, paired room work, editor, export, and keepsake integration | Two signed-in users on separate networks still need full countdown, transfer retry, reconnect, PNG, 4x6 sheet, and Our Space verification |
| Know Me Quiz | Packs, private-answer UI, reactions, receipt, adapter, and solo testing path | Page must consume the real session UUID; remove the testing simulation from live mode; verify no early reveal and deterministic two-client recovery |
| Letters to the Future | Strong wax-seal/editor presentation and download path | Sealed letters are still stored in local storage; shared authorship, private audio/photo storage, recipient-only scheduled reveal, timezone handling, and revocation are incomplete; one invalid wax-seal prop blocks clean type checking |
| Truth or Dare | Large activity set, minigames, transitions, adapter, and keepsake path | Coin, dice, reaction timing, prompt selection, and loser choice use client randomness; these need one authoritative event seed/result and matched scoring across clients |
| Honest Cards | Strong prompt and reflection UI with receipt and AI consent | It explicitly asks one browser to type the partner answer in a solo sandbox; live private per-person submission and mutual reveal are not connected |
| Date Host | Rich host-led sequence, tones, scenarios, reactions, and receipt | Both partner choices remain local page state; live turn control and recovery need the real session; the tone value currently violates its declared type |
| The Arcade | Three substantial playable games and strong visual/game feel | High scores are local storage, round seeds are generated inside reducers, and scores come from clients; simultaneous play, replay-safe seeds, and verifiable server results remain incomplete |
| Digital Scrapbook | Tactile board, movable pieces, themes, notes, adapter, and keepsake entry | No complete private asset upload/recovery pipeline is wired, positions are locally randomized, collaborative conflict handling is absent, and export parity is not demonstrated |
| Love Match | Clear check-in/result redesign and keepsake intent | New page does not compile against runtime/keepsake/shell APIs; inputs are not in the private vault and the shared reveal is not proven |
| IQ Duel | Puzzle loop, categories, score display, adapter, and result | Timer/answers/scores remain client-driven; private lock-in, shared deadline, latency fairness, and authoritative scoring need implementation |
| Riddle Night | Progressive riddle presentation, clues, shared notebook concept, and adapter | Fake session ID prevents dependable live recovery; clue spend and answer resolution need one authoritative state and two-client verification |
| The Lab | Refined focus-room layout, presets, tasks, breaks, and session keepsake | Page expects a nonexistent runtime API; timer is local rather than a shared deadline, partner task is manually entered, and the long-lived session record is not wired to the new backend |
| The Great Debate | Structured phases, evidence/testimony fields, voting, adapter, and scorecard | Phase timer and voting are not private/server-authoritative; simultaneous turn order, locked votes, and recovery require live integration |
| Couples Court | Detailed themed case flow, consent concept, objections, verdict, and keepsake | Shell contract is broken; case/plea/verdict controls are still primarily one-screen state and mutual consent/reveal must be enforced live |
| Draw Together | Functional canvas, batched normalized strokes, undo/clear direction, export, adapter, and remote-cursor work | Must use the real session UUID everywhere; checkpoint recovery, simultaneous edit conflicts, reconnect, export parity, and two-account QA remain |
| Snap Hunt | Camera-style proof interface, rounds, reactions, scoring, adapter, and result | Proofs are not registered through private temporary Storage; hidden proof exchange, expiry cleanup, matched judging, and retry/reconnect behavior are incomplete |
| Our Future | Strong vision-board presentation, categories, commitments, and adapter | Board data is still written to local storage; collaborative long-lived records, revision merging, timelines, reminders, and Our Space milestones are not wired |
| Birthday Gift | Attractive templates, editor sections, coupons, reveal animation, and keepsake intent | No private photo/audio upload flow is wired; autosave, scheduling, recipient-only revocable link, timezone-safe reveal, missing-media gate, and archive states remain incomplete |
| Fashion Show | Runway presentation, round themes, rating UI, adapter, and scorecard | Partner score is explicitly simulated; real partner looks, private lock/reveal, blind voting, anti-self-vote checks, and authoritative scoring are missing |
| Matching Shirts | Two-shirt customizer, motifs, text/color controls, previews, adapter, and PNG export | Both designs are edited locally; paired roles, synchronized revisions, print-size accuracy checks, shared approval, and saved templates need completion |
| Love Forecast | Strong editorial forecast card, transparent rule set, narration, export, and history direction | Page does not compile against shared APIs; only one local check-in drives the result, private two-person reveal and one-record-per-couple/day are not wired |
| Timezone and Reunion | Rich dual-city design, reunion planning, packing list, heartbeat, calendar/export direction | Page does not compile against shared APIs; persisted shared plan/milestone calls are incomplete, concurrent list ownership/merging and timezone edge-case QA remain |
| 100 Dates Bucket List | Ticket/deck design, states, scratch reveal, filters, custom ideas, and progress view | Page does not compile; only 16 seed items are present, changes remain local component state, partner proposal/acceptance, proof, scheduling, and backend records are not wired |
| Date Night Planner | Strong preset itinerary, collaborative-looking editor, timer, execution view, and keepsake | Page does not compile; preferences are not privately collected, timer is local, real collaborative reorder/approval and backend authoritative plan recovery are incomplete |

## Verification run

- Lint: passed.
- Unit tests: passed, 13 files and 226 tests.
- Type check: failed because of the shared shell, runtime hook, keepsake hook, Date Host tone, and Letter wax-seal contract mismatches described above.
- Production build: client/RSC bundles compiled; final server packaging stopped on the known Windows `EPERM readlink C:\\Users\\ayush` environment issue. This build system does not run the separate TypeScript check, so its partial compilation does not clear the type failures.
- Live two-account activity QA: not run during this audit. It should happen only after the session UUID and page/runtime integration is fixed.

## Recommended completion order

1. Make `ActivitySessionContext` the only source of the live room/session/user/host state and adapt `useActivityRuntime` to it.
2. Reconcile the shared shell and keepsake APIs, then restore a clean TypeScript check.
3. Prove Quiz end to end with two accounts: create/join, private answers, reveal, refresh, reconnect, completion, and keepsake.
4. Apply that proven live pattern to Cards, Host, Court, and Love Match.
5. Add authoritative seeds/deadlines/scoring for Dare, Arcade, IQ, Debate, Fashion, Riddle, and Hunt.
6. Wire private temporary assets and long-lived plans into Letter, Scrapbook, Hunt, Birthday, Future, Timezone, Bucket, Date Planner, Forecast, and Lab.
7. Run desktop visual refinement and the complete two-account/browser matrix.
8. Begin mobile work only after desktop approval.
