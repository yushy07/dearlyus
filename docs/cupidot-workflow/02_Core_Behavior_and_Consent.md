# Cupidot workflow 2 — Core behavior, state and consent

**Status:** Not started  
**Prepared:** 8 September 2026  
**Source:** [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md), baseline `fded19081c0b47c5ec982b6491e3b9d203f2cbb4`.  
**Primary task ownership:** M01, M02, M07, M09, M10, M11, M12, M17, R01, R02, R05.

## Outcome

Make home, floating companion, activity guidance, preferences and voice use one consistent client-side model and behavior pipeline.

## Start condition and scope

Start only after file 1 passes its local completion gate. Use corrected presence, output, timer and privacy behavior as the starting point.

Local types, client integration, deterministic policy, mocks and tests. Describe required server contracts, but do not implement backend handlers, database migrations or Edge Function source locally. Server consent/ownership cannot be certified by a browser helper.

This is a workflow subdivision of the audit, not a new claim that every live issue is proven. Evidence and requirement references are preserved below. Existing test passes do not mark any task in this file done.

## Work in this order

1. Define one typed contract for pet state, current authorized product phase, presence, personal preferences and effective shared consent. Separate cached/demo state from authoritative state.
2. Implement local R01 with M01/M02: consume real presence sources where already available, reset account/couple/session state, validate cached data and define stable event identities.
3. Implement local R02 with M07/M10: separate individual choices from effective permissions; wire every consumer; fail closed for unknown/unverified sensitive permission; discard responses after withdrawal.
4. Implement R05 with M11/M12: one priority/intent/output owner, per-arrival and transition budgets, dismissal memory, repetition control, quiet/recording suppression, captions and replay.
5. Complete M09: explicit bounded requests and validation of all response fields, permitted context, tone and state-available actions. Ensure deterministic fallbacks remain useful with AI disabled.
6. Complete M17: validate before recording event identity/sequence, buffer or reconcile gaps and prove replay order with the local harness.
7. Record backend contract requirements and failure states for file 4. Expose no client-only switch as verified live consent.

## Task details from the audit

These IDs have one primary owner across the four files. Related work can contribute to a larger revamp; it is not a separate duplicate implementation. For files 1–3, checking a task means its **local deliverable** is ready. Any required live acceptance remains open in file 4.

| Local/owned work ready | ID | Change | Original evidence and required result | Blueprint |
| --- | --- | --- | --- | --- |
| [ ] | M01 | Connect actual partner presence | Pet uses `Boolean(partner)`: membership, not online status. Use real connection/interaction state; handle solo arrival, one reunion, reconnect, ready and multi-tab aggregation. E10/E15 | F §14; I §14 |
| [ ] | M02 | Repair persistence/session boundaries | Validate storage and reset/scoped refs on identity/couple/session changes. `sparksThisSession` persists without a real session reset, potentially leaving the cap exhausted. Durable sharing is R01. E5/E10 | F §7,21 |
| [ ] | M07 | Connect settings to every consumer | Home guidance/romance stay in its hook; routes don't pass the guidance setting to activity guidance. Home motion/audio toggles stay in parent state instead of controlling pet/voice. E3/E10/E11/E17 | F §10,19,20 |
| [ ] | M09 | Complete AI validation/timeouts | Active Gemini path doesn't call structured validator or set an explicit timeout. Options aren't safety-checked, nor is minimum count rechecked after filtering. Validate full output, tone, actual context and state-available actions. E4/E8 | I §8,20–22 |
| [ ] | M10 | Handle consent through request lifecycle | Separate AI, follow-up, intensity, reuse and media permission. Avoid global storage overriding live-derived consent; discard stale responses after withdrawal. Sanitization drops `romanceLevel`; fallback ignores it. E8/E14 | I §3,6,10,21 |
| [ ] | M11 | Implement freshness/interruption state | Local prompt pool is useful, but curated seed defaults to 0; speaking helper doesn't enforce stored dismissal keys/recent intents. Add per-arrival/transition budgets, recent variants and silence when appropriate. E1/E4 | I §5,24 |
| [ ] | M12 | Coordinate voice | Retain modes; add replay, universal captions, quiet-hour/context gating and suppression during recording/private phases. One output owner should cancel competing speech and honor immediate mute/soften. E1/E18 | F §19; I §19 |
| [ ] | M17 | Correct recovery ordering | Runtime requests gap recovery but immediately applies the newer event; IDs/sequence are recorded before validation. Buffer/reconcile invalid/out-of-order events before claiming recovery. E7 | F §11,21 |

## Subsystem redesigns owned here

The original acceptance criteria include the final connected outcome. Files 1–3 implement their local portion; file 4 verifies live authority before global completion.

### R01 — Shared pet ownership, state and progression

**Evidence:** The pet hook reads/writes browser storage, owns one ritual and seed, and does not subscribe to an authoritative shared pet/reward record. Floating companion owns another state tree. E1/E5/E10.

**Replace with:** One client-facing model derived from authorized couple/session/presence/preferences/pet state. Stable event IDs, durable growth/decor ownership, concurrency handling, cache validation and account/couple transitions.

**Keep:** Character components, catalogue, undo UI and corrected pure helpers.

**Acceptance:** Two authorized devices converge; refresh/retries cannot duplicate rewards; a local tap cannot impersonate shared completion. Local frontend first, live storage/enforcement afterward. **F §1–8,14,21 / I §6,7,14.**

### R02 — Mutual consent and romance authority

**Evidence:** Rules allows all six levels through a local setter. Tested minimum/adult/session helpers aren't wired into it. Client AI consent contract exposes one shared boolean rather than individual approvals. E4/E8/E10/E17.

**Replace with:** Private individual preferences, server-derived intersection, verified eligibility, session-scoped Spicy reconfirmation, immediate private lowering and fail-closed permission. Separate personal audio/motion from shared sensitive permission.

**Keep:** Labels, definitions, minimum-rule helper and neutral soften copy.

**Acceptance:** Neither partner can raise intensity alone; prior-session or tampered/stale requests cannot restore permission; private downgrade identity stays hidden. Live verification required. **F §20 / I §3,10,21,29.**

### R05 — One behavior and dialogue decision system

**Evidence:** Moments, home helpers, guidance, procedural fallback and voice callers act independently. Policy helpers are largely not in the active pipeline. Fallback infers archetypes, synchronicity and opposites-attract dynamics and offers pressure-oriented options. E1/E4/E8/E11/E14/E18.

**Replace with:** Authorized event → priority/usefulness → effective consent and permitted context → intent → curated/optional AI → validation → one accessible output. Handle private phases, recording, dismissal, quiet, recovery and safety before personality.

**Keep:** Compliant curated lines, moment catalogue, named states and character rendering. Replace the inference-driven fallback itself, not just its title.

**Acceptance:** A date works without AI; hidden answers cannot affect output; no invented knowledge or unapproved tone; no competing responses. **I §2–9,14–16,19–24.**

## Completion gate

- [ ] Home, companion and guidance agree on presence, phase and effective settings.
- [ ] Local tests demonstrate unknown/withdrawn consent, stale responses, age/session ceilings and neutral private lowering without claiming live enforcement.
- [ ] Private phases and recording suppress nonessential voice; critical safety/recovery information still works; audio-off preserves meaning.
- [ ] AI disabled, timeout, invalid options/context/tone and unsafe output all produce a valid bounded fallback.
- [ ] Missing, invalid, duplicated and out-of-order events do not corrupt the demonstrated local flow.
- [ ] Client contracts, current verification results and a live-dependency list are ready for files 3 and 4.

## Progress and handoff

| Field | Record |
| --- | --- |
| Last checked code revision | Not recorded yet |
| Completed task IDs | None recorded |
| Tests and browser evidence | Not recorded yet |
| Live dependencies | Record for file 4; not assumed verified |
| Deferred scope / reason / approval | None recorded |
| Blockers / next action | Start with the first ordered work item |

File 3 builds features on these shared contracts. R01/R02/R05 are only locally ready here; their authoritative enforcement remains pending in file 4.

## Source evidence

F/I refer to the two blueprints linked in [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md). The master retains the complete 59-section coverage map, audit limits and helper-probe results.

- **E1:** [Companion](C:/Users/ayush/Desktop/cool/components/bot/CupidotCompanion.tsx), [moments](C:/Users/ayush/Desktop/cool/lib/cupidot-moments.ts), [browser test](C:/Users/ayush/Desktop/cool/tests/browser/cupidot-companion.spec.ts).
- **E3:** [Home wiring](C:/Users/ayush/Desktop/cool/components/our-space/CupidotHomeArea.tsx:35), [Our Space route](C:/Users/ayush/Desktop/cool/app/our-space/page.tsx).
- **E4:** [Behavior helpers](C:/Users/ayush/Desktop/cool/lib/cupidot-behavior.ts:49): `computeEffectiveRomanceLevel`, `getCuratedDialogue`, `canCupidotSpeak`, `handleSafetyBoundary`, `validateStructuredAiOutput`.
- **E5:** [State helpers](C:/Users/ayush/Desktop/cool/lib/cupidot-state.ts:58): presence wrapper, sparks, module-local celebration Map, storage and approval functions.
- **E7:** [Private answers](C:/Users/ayush/Desktop/cool/hooks/usePrivateAnswers.ts:159), [event runtime](C:/Users/ayush/Desktop/cool/lib/runtime/activity-runtime.ts:48), [Supabase transport](C:/Users/ayush/Desktop/cool/lib/runtime/supabase-transport.ts), [mock transport](C:/Users/ayush/Desktop/cool/lib/runtime/mock-transport.ts). Browser mock storage/event sharing is development scaffolding, not an authorization boundary.
- **E8:** [AI requests](C:/Users/ayush/Desktop/cool/lib/gemini.ts:119), [consent hook](C:/Users/ayush/Desktop/cool/lib/ai-consent.ts:8), [consent toggle](C:/Users/ayush/Desktop/cool/components/shared/AiConsentToggle.tsx).
- **E10:** [Pet hook](C:/Users/ayush/Desktop/cool/hooks/useCupidotPet.ts:28), [ritual form](C:/Users/ayush/Desktop/cool/components/our-space/CustomRitualModal.tsx:20), [ritual entries](C:/Users/ayush/Desktop/cool/components/our-space/SharedRituals.tsx).
- **E11:** [Activity guidance](C:/Users/ayush/Desktop/cool/components/shared/CupidotActivityGuidance.tsx:100). No route-level `guidanceMode=` argument was found in inspected app pages.
- **E14:** [Procedural fallback/judge](C:/Users/ayush/Desktop/cool/lib/cupidot.ts): `analyzeThemes`, `generateCupidotDilemma`, `judgeCourtCase`.
- **E15:** [Presence provider](C:/Users/ayush/Desktop/cool/contexts/PresenceContext.tsx:30), [membership source](C:/Users/ayush/Desktop/cool/contexts/CoupleSpaceContext.tsx:252).
- **E17:** [Rules/settings](C:/Users/ayush/Desktop/cool/components/our-space/YourRoomYourRulesModal.tsx:24): local switches and direct level selection.
- **E18:** [Voice](C:/Users/ayush/Desktop/cool/lib/voice.ts), [sound](C:/Users/ayush/Desktop/cool/lib/sound.ts), [Letter recording](C:/Users/ayush/Desktop/cool/app/letter/page.tsx).

## Navigation

Previous: [Trust and quick fixes](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/01_Trust_and_Quick_Fixes.md).  
Next: [Shared features and product polish](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/03_Shared_Features_and_Polish.md).  
[Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md).
