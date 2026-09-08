# Cupidot workflow 1 — Trust and quick fixes

**Status:** Not started  
**Prepared:** 8 September 2026  
**Source:** [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md), baseline `fded19081c0b47c5ec982b6491e3b9d203f2cbb4`.  
**Primary task ownership:** S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, R08.

## Outcome

Correct misleading behavior and concrete defects before building more shared features. Preserve the approved artwork and recent companion improvements.

## Start condition and scope

Start here. Recheck each cited code path against the current checkout; the audit is a dated baseline, not proof that another change has not already fixed it.

Local frontend, helper logic and product behavior only. Redesign the conflict/scoring experience locally; any backend enforcement or specialist-dependent launch approval remains in file 4.

This is a workflow subdivision of the audit, not a new claim that every live issue is proven. Evidence and requirement references are preserved below. Existing test passes do not mark any task in this file done.

## Work in this order

1. Remove invented partner replies, synthetic relationship/intimacy scores and real-conflict guilt/punishment framing. This is early containment for R04 and local redesign for R08; R04 remains owned by file 3.
2. Fix S01–S08: primitive presence, truthful ritual/saving/recovery labels, exact approval edits, separate close/decline and correct form initialization.
3. Fix S09–S11: 2D recovery, reaction timer cleanup and visible persistence failures.
4. Fix S12–S15: missing-answer handling, downward tone fallback, critical safety priority and concise truthful copy.
5. Complete the local R08 experience: round-level game results, mutually chosen fictional play and neutral stop/lighter/home actions. Do not invent a clinical support flow or treat it as reviewed.
6. Update S16 test/document claims using the results actually obtained after these fixes. Record any remaining live dependencies for file 4.

## Task details from the audit

These IDs have one primary owner across the four files. Related work can contribute to a larger revamp; it is not a separate duplicate implementation. For files 1–3, checking a task means its **local deliverable** is ready. Any required live acceptance remains open in file 4.

| Local/owned work ready | ID | Change | Original evidence and required result | Blueprint |
| --- | --- | --- | --- | --- |
| [ ] | S01 | Fix presence return type | `sanitizeSafePresence(true)` returns a boxed String: it displays `here`, but `=== 'here'` is false. This breaks the Tonight card branch. Return a primitive or use one consistently typed object. E3/E5 | F §5,14 |
| [ ] | S02 | Correct ritual reward text | UI says “+3 sparks”; engine awards 10 for a ritual. Show the actual successful result or remove the number. E3/E5 | F §7,12 |
| [ ] | S03 | Add an unscheduled-ritual empty state | A default Sunday ritual has actionable completion with ID `default`. Offer creation instead; do not treat an uncreated ritual as completed. E3/E10 | F §12 |
| [ ] | S04 | Remove unsupported guarantees | Guidance promises “exact same second,” “Nothing was lost” and “progress is saved” from a phase prop alone. Describe confirmed state and actual recovery/save outcomes. E11 | F §11,21; I §4 |
| [ ] | S05 | Label capsule reflection honestly | A fixed template appears after a 450 ms timeout; default activities may not have happened. Identify it as a template and use confirmed/user-selected activity data. E12 | F §13; I §6,8 |
| [ ] | S06 | Preserve approval edits | Modal passes caption/mood edits; parent only consumes `seedId`. Preserve the exact reviewed version. E3/E13 | F §13 |
| [ ] | S07 | Separate close from decline | Approval calls `onClose`, but parent maps close to `declineMemorySeed`. Separate successful close, dismissal and explicit decline. E3/E13 | F §13 |
| [ ] | S08 | Reset forms for the current target | Ritual/seed fields initialize from props once. Reinitialize/key on opening a different target to prevent stale edits. E10/E13 | F §12,13 |
| [ ] | S09 | Add usable 3D recovery | Automatically return to 2D or provide a working retry after model/WebGL failure. “Try again soon” is not a retry mechanism. E2 | F §19,21 |
| [ ] | S10 | Clean up pet reaction timers | Untracked home/stage timers can override later quiet/goodnight states. Cancel/replace them and clean up on unmount. E2/E10 | F §6,15 |
| [ ] | S11 | Show persistence errors | Consent updates optimistically without visible rollback; capsule failures are logged without rendering the hook error. Add pending, retry and failure feedback. E8/E12 | F §20,21 |
| [ ] | S12 | Reject empty-answer agreement | `currentA.includes(currentB)` is true for empty B. Require both answers before comparison. This fix does not justify relationship inference. E14 | I §6,9 |
| [ ] | S13 | Keep tone fallback downward | `getCuratedDialogue` can fall back through Romantic after Quiet/Warm. Existing populated buckets mask this; missing variants must never raise the ceiling. E4 | I §3,8,25 |
| [ ] | S14 | Preserve critical safety output | `canCupidotSpeak` blocks `refuse_unsafe` while focused; quiet-session rules also omit it. Necessary private safety information must outrank decorative-speech suppression. E4 | I §5,14,16 |
| [ ] | S15 | Correct remaining character copy | Remove dismissive welcomes, invented observations and technical personality labels from active paths. Keep the new companion's concise tone; deeper rewrites are R05/R08. E4/E12/E14 | I §2,4,15 |
| [ ] | S16 | Correct QA claims | QA notes say 76 tests; 77 run now. “Multi-tab” and “complete approval” helper tests do not test actual tabs/UI approval. Label real scope. E19 | F §27; I §28 |

## Subsystem redesigns owned here

The original acceptance criteria include the final connected outcome. Files 1–3 implement their local portion; file 4 verifies live authority before global completion.

### R08 — Relationship evaluation and conflict behavior

**Evidence:** Match creates an 88% floor plus synthetic intimacy/banter/future metrics. Fallback interprets relationship dynamics. Court assigns guilt/mandatory sentences from keywords or superficial features without a preceding real-conflict boundary check. Its playful disclaimer doesn't resolve that conflict. E14/E21.

**Replace with:** Round-level matching and curiosity, no evaluation of affection/relationship quality. Make Court explicitly fictional, mutually chosen play with neutral stop/lighter/home paths. Separate any private, region-appropriate, reviewed safety/support flow from shared entertainment.

**Keep:** Harmless game mechanics and optional playful presentation.

**Acceptance:** No fabricated feelings, real-world blame, relationship diagnosis, pressure to disclose/intensify/reconcile, or automatic partner disclosure of safety concerns. High-risk flows need specialist review; this report does not certify them. **F §10,20,23 / I §9,15,16,18,29.**

## Completion gate

- [ ] No fabricated partner answer or relationship/intimacy/affection score remains in the affected paths.
- [ ] Approval edits survive; approval completion cannot invoke decline; empty rituals cannot be completed.
- [ ] Presence comparison, reward wording, failed saving, fallback tone and safety-priority cases have meaningful regression evidence.
- [ ] Character art and existing working companion interactions are preserved; affected UI is checked at phone and desktop sizes.
- [ ] Tests appropriate to changed behavior, type checking and build checks pass or are explicitly recorded as blocked; no old result is relabelled current.
- [ ] Local fixes and outstanding live/specialist verification are separately listed in the handoff.

## Progress and handoff

| Field | Record |
| --- | --- |
| Last checked code revision | Not recorded yet |
| Completed task IDs | None recorded |
| Tests and browser evidence | Not recorded yet |
| Live dependencies | Record for file 4; not assumed verified |
| Deferred scope / reason / approval | None recorded |
| Blockers / next action | Start with the first ordered work item |

Give file 2 the corrected helpers, neutral copy, actual test evidence and any unresolved scope decisions. Do not mark R08 globally complete until its live/private-flow checks in file 4 are resolved.

## Source evidence

F/I refer to the two blueprints linked in [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md). The master retains the complete 59-section coverage map, audit limits and helper-probe results.

- **E2:** [Pet stage](C:/Users/ayush/Desktop/cool/components/bot/CupidotPetStage.tsx:102), [3D renderer](C:/Users/ayush/Desktop/cool/components/bot/CupidotBot.tsx:128), [2D renderer](C:/Users/ayush/Desktop/cool/components/bot/Cupidot2D.tsx), [motion CSS](C:/Users/ayush/Desktop/cool/app/globals.css:4486).
- **E3:** [Home wiring](C:/Users/ayush/Desktop/cool/components/our-space/CupidotHomeArea.tsx:35), [Our Space route](C:/Users/ayush/Desktop/cool/app/our-space/page.tsx).
- **E4:** [Behavior helpers](C:/Users/ayush/Desktop/cool/lib/cupidot-behavior.ts:49): `computeEffectiveRomanceLevel`, `getCuratedDialogue`, `canCupidotSpeak`, `handleSafetyBoundary`, `validateStructuredAiOutput`.
- **E5:** [State helpers](C:/Users/ayush/Desktop/cool/lib/cupidot-state.ts:58): presence wrapper, sparks, module-local celebration Map, storage and approval functions.
- **E8:** [AI requests](C:/Users/ayush/Desktop/cool/lib/gemini.ts:119), [consent hook](C:/Users/ayush/Desktop/cool/lib/ai-consent.ts:8), [consent toggle](C:/Users/ayush/Desktop/cool/components/shared/AiConsentToggle.tsx).
- **E10:** [Pet hook](C:/Users/ayush/Desktop/cool/hooks/useCupidotPet.ts:28), [ritual form](C:/Users/ayush/Desktop/cool/components/our-space/CustomRitualModal.tsx:20), [ritual entries](C:/Users/ayush/Desktop/cool/components/our-space/SharedRituals.tsx).
- **E11:** [Activity guidance](C:/Users/ayush/Desktop/cool/components/shared/CupidotActivityGuidance.tsx:100). No route-level `guidanceMode=` argument was found in inspected app pages.
- **E12:** [Capsule workflow](C:/Users/ayush/Desktop/cool/components/our-space/DateNightCapsuleModal.tsx:28).
- **E13:** [Approval modal](C:/Users/ayush/Desktop/cool/components/our-space/KeepsakeApprovalModal.tsx:24), [detail modal](C:/Users/ayush/Desktop/cool/components/our-space/KeepsakeDetailModal.tsx), [types](C:/Users/ayush/Desktop/cool/types/cupidot.ts).
- **E14:** [Procedural fallback/judge](C:/Users/ayush/Desktop/cool/lib/cupidot.ts): `analyzeThemes`, `generateCupidotDilemma`, `judgeCourtCase`.
- **E19:** [Pet tests](C:/Users/ayush/Desktop/cool/tests/cupidot-pet.test.ts:246), [behavior tests](C:/Users/ayush/Desktop/cool/tests/cupidot-behavior.test.ts), [QA matrix](C:/Users/ayush/Desktop/cool/docs/qa-manual-matrix.md).
- **E21:** [Match scoring](C:/Users/ayush/Desktop/cool/app/match/page.tsx:125), [Court](C:/Users/ayush/Desktop/cool/app/court/page.tsx:89), plus E14.

## Navigation

Next: [Core behavior, state and consent](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/02_Core_Behavior_and_Consent.md).  
[Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md).
