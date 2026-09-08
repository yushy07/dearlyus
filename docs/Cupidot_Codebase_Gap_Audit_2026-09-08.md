# Cupidot — Codebase Verification and Change List

**Reviewed:** 8 September 2026  
**Repository:** `C:/Users/ayush/Desktop/cool`  
**Baseline:** `fded19081c0b47c5ec982b6491e3b9d203f2cbb4`  
**Scope:** Read-only source audit, existing tests, isolated helper probes. No application/backend implementation changes.

## Workflow files — use these for implementation tracking

The audit below remains the dated master reference. Work through these **four files in order**; together they preserve all **16 small fixes, 20 major changes and 8 revamps**. Every original task ID has one primary owner. Larger revamps have a local stage in files 1–3 and a live acceptance stage in file 4; do not mark them globally complete from a local test alone.

| Order | Workflow file | Primary ownership |
| --- | --- | --- |
| 1 | [Trust and quick fixes](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/01_Trust_and_Quick_Fixes.md) | S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, R08 |
| 2 | [Core behavior, state and consent](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/02_Core_Behavior_and_Consent.md) | M01, M02, M07, M09, M10, M11, M12, M17, R01, R02, R05 |
| 3 | [Shared features and product polish](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/03_Shared_Features_and_Polish.md) | M03, M04, M05, M06, M08, M13, M14, M15, M16, M18, M19, R03, R04, R06, R07 |
| 4 | [Live backend and final verification](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/04_Live_Backend_and_Final_Verification.md) | M20 |

**Boundary:** Finish local work in files 1–3 before live backend implementation in file 4. Do not create local migrations or Edge Function source. Keep the excluded two-account create/join test excluded unless separately authorized.

Use the workflow checklists for progress. Keep the original evidence and all 59 blueprint-section mappings below; no audited scope has been removed. No implementation task is marked complete by this split.

## 1. Overall result

**Keep the character and useful UI. Rework the systems that make Cupidot shared, trustworthy and context-aware.**

Cupidot has a working local companion, a substantial home interface, reusable behavior helpers and some real activity/backend integration. It does **not yet implement the complete shared companion described in the two blueprints**. The largest gaps concern integration and authoritative shared state, rather than more dialogue or new artwork.

The recent floating companion improvements are present: Playful/Tender/Quiet, 11 local prompts, visible choices, optional voice and keyboard dialog controls. This is a local conversation starter, as its UI correctly explains. It does not replace the shared-pet, date-host, consent or memory systems.

The most important work is:

1. Remove fabricated partner answers and relationship/intimacy scoring.
2. Connect home, floating companion, activity guidance, voice and settings to one behavior system.
3. Make pet state, rewards, consent, rituals and memory approvals genuinely shared and authorized.
4. Extend the real Quiz/Draw foundation to other relevant activities.
5. Replace personality inference with concise, consent-aware responses and explainable suggestions.
6. Test the connected flows; passing helper tests cannot establish their complete guarantees.

**No full visual revamp is justified by these documents.** Appearance belongs to a separate Character Design document. “Full revamp” below means redesigning a specific subsystem while retaining useful components and artwork.

## 2. Sources and verification limits

Reference documents:

- [Features & Functionality](C:/Users/ayush/Desktop/Cupidot_Features_and_Functionality.md), abbreviated **F**.
- [Intelligence & Behavior](C:/Users/ayush/Desktop/Cupidot_Intelligence_and_Behavior.md), abbreviated **I**.

For example, **F §13 / I §11** identifies memory requirements. The Desktop files were the reference; repository copies have formatting differences.

The documents were treated as **requirements to compare**, not instructions to execute their roadmaps, publish changes, modify Supabase or perform destructive actions.

### Verified now

- Read both blueprints; traced components, hooks, behavior helpers, activity pages, transports, account APIs and tests.
- `npm test`: **77 tests passed across 6 suites** on this baseline.
- Ran five isolated probes against current helper implementations; results are in section 7.
- Searched call sites to distinguish implemented helpers from connected product behavior.

### Not verified now

- Live Supabase function bodies, RLS, Storage policies, deployments, retention, rate limits or server-side mutual consent.
- Real two-account/create-join or cross-device testing. The previously excluded create/join test was not run.
- Fresh browser, screen-reader, device-performance or notification-delivery testing across the product. The earlier companion browser pass is not a current full-product audit.
- Current GitHub remote state: the earlier push attempt was blocked by automatic approval review.

**“Not found” means not found in the inspected code paths/searches, not proven absent from the live service.** An RPC name, comment or UI claim is not evidence of deployed enforcement.

## 3. What exists and should be retained

| Area | Verified foundation | Limit |
| --- | --- | --- |
| Floating companion | Three moods, 11 prompts, selection feedback, quiet audio, keyboard dialog controls. E1 | Local state; disconnected from home guidance/romance and shared activity context. |
| Character presentation | Approved 2D art, optional 3D stage, named states, reactions, OS reduced-motion support. 3D rendering checks visibility/intersection. E2 | Failed 3D load shows text rather than automatically restoring 2D; app settings are not consistently connected. |
| Home | Pet, Tonight/resume card, ritual corner, collection shelf, rules and approval dialogs. `/our-space` reuses profile. E3 | Pet-specific state is largely browser storage. |
| Behavior | Minimum romance rule, adult/session ceiling helpers, curated library, mappings, silence checks, output validator. E4 | Many are helper/test paths rather than a complete runtime pipeline. |
| Progression | Five chapters, spark arithmetic, soft cap, catalogue and decor undo. E5 | No authoritative event ledger or variety/session lifecycle. |
| Activities | Quiz/Draw use real session operations when a live session exists and disable their mock runtime then. E6 | Other inspected pages often always select mock mode. |
| Privacy/recovery | Private-answer RPC clients, readiness-only lock events, reveal reauthorization, event IDs and recovery APIs. E7 | Not universal or live-verified. |
| AI boundary | Browser sends session ID, mode and mood to `gemini`, not names/answer history in the request body. E8 | Server behavior unverified; output/fallback pipeline incomplete. |
| Account APIs | Shared preferences, keepsake upload/finalize/delete, ritual entries and scheduled-date calls. E9 | Not equivalent to mutual approval, intelligent reuse or a notification scheduler. |
| Tests | Six suites pass. E19 | Some test names describe broader guarantees than their setups prove. |

## 4. Small changes — focused fixes

The report groups the work into **16 small fixes, 20 major changes and 8 subsystem revamps**. Major changes feed the larger revamps; these are not 44 independent projects or additive effort estimates.

These are small in implementation scope, not necessarily low importance. Completing them does not complete the larger parent feature.

| ID | Change | Evidence and required result | Blueprint |
| --- | --- | --- | --- |
| S01 | Fix presence return type | `sanitizeSafePresence(true)` returns a boxed String: it displays `here`, but `=== 'here'` is false. This breaks the Tonight card branch. Return a primitive or use one consistently typed object. E3/E5 | F §5,14 |
| S02 | Correct ritual reward text | UI says “+3 sparks”; engine awards 10 for a ritual. Show the actual successful result or remove the number. E3/E5 | F §7,12 |
| S03 | Add an unscheduled-ritual empty state | A default Sunday ritual has actionable completion with ID `default`. Offer creation instead; do not treat an uncreated ritual as completed. E3/E10 | F §12 |
| S04 | Remove unsupported guarantees | Guidance promises “exact same second,” “Nothing was lost” and “progress is saved” from a phase prop alone. Describe confirmed state and actual recovery/save outcomes. E11 | F §11,21; I §4 |
| S05 | Label capsule reflection honestly | A fixed template appears after a 450 ms timeout; default activities may not have happened. Identify it as a template and use confirmed/user-selected activity data. E12 | F §13; I §6,8 |
| S06 | Preserve approval edits | Modal passes caption/mood edits; parent only consumes `seedId`. Preserve the exact reviewed version. E3/E13 | F §13 |
| S07 | Separate close from decline | Approval calls `onClose`, but parent maps close to `declineMemorySeed`. Separate successful close, dismissal and explicit decline. E3/E13 | F §13 |
| S08 | Reset forms for the current target | Ritual/seed fields initialize from props once. Reinitialize/key on opening a different target to prevent stale edits. E10/E13 | F §12,13 |
| S09 | Add usable 3D recovery | Automatically return to 2D or provide a working retry after model/WebGL failure. “Try again soon” is not a retry mechanism. E2 | F §19,21 |
| S10 | Clean up pet reaction timers | Untracked home/stage timers can override later quiet/goodnight states. Cancel/replace them and clean up on unmount. E2/E10 | F §6,15 |
| S11 | Show persistence errors | Consent updates optimistically without visible rollback; capsule failures are logged without rendering the hook error. Add pending, retry and failure feedback. E8/E12 | F §20,21 |
| S12 | Reject empty-answer agreement | `currentA.includes(currentB)` is true for empty B. Require both answers before comparison. This fix does not justify relationship inference. E14 | I §6,9 |
| S13 | Keep tone fallback downward | `getCuratedDialogue` can fall back through Romantic after Quiet/Warm. Existing populated buckets mask this; missing variants must never raise the ceiling. E4 | I §3,8,25 |
| S14 | Preserve critical safety output | `canCupidotSpeak` blocks `refuse_unsafe` while focused; quiet-session rules also omit it. Necessary private safety information must outrank decorative-speech suppression. E4 | I §5,14,16 |
| S15 | Correct remaining character copy | Remove dismissive welcomes, invented observations and technical personality labels from active paths. Keep the new companion's concise tone; deeper rewrites are R05/R08. E4/E12/E14 | I §2,4,15 |
| S16 | Correct QA claims | QA notes say 76 tests; 77 run now. “Multi-tab” and “complete approval” helper tests do not test actual tabs/UI approval. Label real scope. E19 | F §27; I §28 |

## 5. Major changes — integration or feature completion

| ID | Change | Required outcome and current gap | Blueprint |
| --- | --- | --- | --- |
| M01 | Connect actual partner presence | Pet uses `Boolean(partner)`: membership, not online status. Use real connection/interaction state; handle solo arrival, one reunion, reconnect, ready and multi-tab aggregation. E10/E15 | F §14; I §14 |
| M02 | Repair persistence/session boundaries | Validate storage and reset/scoped refs on identity/couple/session changes. `sparksThisSession` persists without a real session reset, potentially leaving the cap exhausted. Durable sharing is R01. E5/E10 | F §7,21 |
| M03 | Award only eligible shared outcomes | Wire activity, ritual, date, milestone and approved-save events; use stable IDs and variety rules. Current call sites mostly award local Togetherness actions and local seeds; unknown action types are accepted. E3/E5/E10 | F §4,7,8 |
| M04 | Turn collection into a shared home | Current placement is IDs/highlighted catalogue buttons. Render and arrange items, validate unlocks, support undo, activity souvenirs and optional seasonal/interaction rewards with “not now.” E3/E5 | F §5,8 |
| M05 | Make Quiet Together shared | Replace local countdown with a common session/deadline, independent joining, pause/end/recovery and valid completion. Stop ambience on natural completion too. E16 | F §9,17,18 |
| M06 | Finish Quick Spark/Deep Connection | Add independent participation, private drafting, appropriate reveal, skip/exit and optional approved save. A local answer click must not stand in for shared completion. E16 | F §9–11 |
| M07 | Connect settings to every consumer | Home guidance/romance stay in its hook; routes don't pass the guidance setting to activity guidance. Home motion/audio toggles stay in parent state instead of controlling pet/voice. E3/E10/E11/E17 | F §10,19,20 |
| M08 | Replace decorative privacy controls | Ask-before-save/quiet-hours toggles are local dialog state. Add functional personal categories, resurfacing and Surprise allow-lists; don't present guaranteed consent as a switch that can disable it. E17 | F §16,20 |
| M09 | Complete AI validation/timeouts | Active Gemini path doesn't call structured validator or set an explicit timeout. Options aren't safety-checked, nor is minimum count rechecked after filtering. Validate full output, tone, actual context and state-available actions. E4/E8 | I §8,20–22 |
| M10 | Handle consent through request lifecycle | Separate AI, follow-up, intensity, reuse and media permission. Avoid global storage overriding live-derived consent; discard stale responses after withdrawal. Sanitization drops `romanceLevel`; fallback ignores it. E8/E14 | I §3,6,10,21 |
| M11 | Implement freshness/interruption state | Local prompt pool is useful, but curated seed defaults to 0; speaking helper doesn't enforce stored dismissal keys/recent intents. Add per-arrival/transition budgets, recent variants and silence when appropriate. E1/E4 | I §5,24 |
| M12 | Coordinate voice | Retain modes; add replay, universal captions, quiet-hour/context gating and suppression during recording/private phases. One output owner should cancel competing speech and honor immediate mute/soften. E1/E18 | F §19; I §19 |
| M13 | Complete accessibility across home dialogs | Rules/ritual/Togetherness/approval lack the companion's full focus/Escape/restore pattern. Verify labels, selected states, touch scrolling and announcements; add optional hidden mood labels and calm reactions. E2/E13/E16/E17 | F §6,19; I §26 |
| M14 | Complete upload/save recovery | Random upload path plus finalize/cleanup is a start. Add durable retry identity, pending/recoverable uploads and uncertain-finalize handling to avoid loss/duplicates. Verify server support. E9 | F §13,21 |
| M15 | Add controlled memory lifecycle | Existing display/delete/export parts don't provide hide/archive/edit, explainable opt-in resurfacing, separate reuse/revoke or separation/closure handling. E9/E13 | F §13,20; I §11 |
| M16 | Integrate timezones and preparation | Ritual accepts timezone props but home doesn't provide them. Add selected-zone dates, DST-safe scheduling, flexible windows, opt-in overlap and accepted-plan reminders. E3/E10 | F §12,17,18 |
| M17 | Correct recovery ordering | Runtime requests gap recovery but immediately applies the newer event; IDs/sequence are recorded before validation. Buffer/reconcile invalid/out-of-order events before claiming recovery. E7 | F §11,21 |
| M18 | Add selected-language/address support | English strings and assumptions about distance/roles remain. Localize intent and reviewed humor, respect chosen forms of address and lower-tone fallback. Later phase if launch is explicitly English-only. E4/E14 | I §18,25 |
| M19 | Add minimal operational metrics | No unified Cupidot fallback/latency/intent reporting found. Use normalized outcomes and anonymous correlations, never content, codes or private downgrade identity. Verify live logging separately. E7/E8 | F §23; I §27 |
| M20 | Test actual connected flows | Exercise hooks/pages and independent identities: unilateral consent, changed approvals, revoked reuse, stale requests, duplicate awards, mute/motion, tab coordination and recovery. Preserve the excluded create/join test unless separately authorized. E19 | F §27; I §28,29,32 |

## 6. Full revamp — specific subsystems

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

### R03 — Memory proposal, approval and ownership

**Evidence:** Home handler sets `both_approved` after one local call. Tested pure helper updates `status` but not `approvalStatus`. Edits are dropped, close means decline, and no active home proposal call site from completed activities was found. Durable saves use a separate flow. E3/E5/E9/E10/E13.

**Replace with:** One versioned proposal, exact preview, identity-bound approvals, invalidation when approved content changes, neutral decline/expiration, idempotent finalization and separate AI reuse consent. Connect save destinations and lifecycle actions.

**Keep:** Preview UI, uploads, durable API clients, display/export components.

**Acceptance:** Only the exact version approved by both becomes a single keepsake; edits survive; decline saves nothing; reuse revocation works. **F §13 / I §10,11.**

### R04 — Consistent multi-activity lifecycle

**Evidence:** Quiz/Draw have real-session branches. Cards/Host/Match/Court/Dare/Photobooth/Passport/Scrapbook select mock transport in inspected pages. Cards fabricates a partner answer; Host/Match allow local input for both partners. Guidance is not enforcement. E6/E7/E11/E20.

**Replace with:** Real invitation/readiness, independent participation, appropriate private/shared phases, lock/reveal, pause/skip/completion/recovery and optional proposals. Declare each activity's actual privacy model: live collaborative Draw must not be described as private sealed drawing without such a mode.

**Keep:** Quiz/Draw foundations, adapters, layouts, media/drawing tools. Keep mock mode as a clearly labelled demo.

**Acceptance:** Cross-device independent participants see only authorized real content; refresh restores correct phase; privacy statements match payloads. **F §9–11,17,21 / I §13.**

### R05 — One behavior and dialogue decision system

**Evidence:** Moments, home helpers, guidance, procedural fallback and voice callers act independently. Policy helpers are largely not in the active pipeline. Fallback infers archetypes, synchronicity and opposites-attract dynamics and offers pressure-oriented options. E1/E4/E8/E11/E14/E18.

**Replace with:** Authorized event → priority/usefulness → effective consent and permitted context → intent → curated/optional AI → validation → one accessible output. Handle private phases, recording, dismissal, quiet, recovery and safety before personality.

**Keep:** Compliant curated lines, moment catalogue, named states and character rendering. Replace the inference-driven fallback itself, not just its title.

**Acceptance:** A date works without AI; hidden answers cannot affect output; no invented knowledge or unapproved tone; no competing responses. **I §2–9,14–16,19–24.**

### R06 — Recommendations and date-night hosting

**Evidence:** Tonight mainly checks room/presence. Surprise randomly chooses four routes, including a camera activity, without permission/time/accessibility intersection. Standalone Host scenarios aren't a durable multi-activity itinerary. E3/E16/E20.

**Replace with:** Resume first, accepted ritual second, then match selected duration/energy/permissions/accessibility and variety. Provide one reasoned suggestion, shared queue, pauses/transitions, recap and peaceful ending.

**Keep:** Start/resume UI, mode definitions and activity registry.

**Acceptance:** No camera-disabled Surprise route; short visits receive suitable options; both clients share the date flow; another suggestion has no penalty. **F §5,9,17 / I §12,13.**

### R07 — Ritual scheduling and notifications

**Evidence:** One local ritual; “create or update” always creates a new ID; reschedule opens creation UI. Separate ritual-entry RPC doesn't provide scheduling. Quiet-hours UI isn't connected; form lets one user toggle A/B reminders. E3/E9/E10/E17.

**Replace with:** Ritual collection, accepted schedule updates, recurrence/flexible windows, stable occurrences, timezone/DST, snooze, personal recipient/category choices, quiet hours, delivery dedupe and neutral missed-window handling.

**Keep:** Ritual ideas, useful form fields, entry API and neutral copy.

**Acceptance:** Editing preserves identity; occurrence rewards are unique; reminders honor each recipient; one partner can't enable another's notifications; missed rituals advance without guilt. Live scheduler/delivery verification required. **F §12,16,18 / I §10,17.**

### R08 — Relationship evaluation and conflict behavior

**Evidence:** Match creates an 88% floor plus synthetic intimacy/banter/future metrics. Fallback interprets relationship dynamics. Court assigns guilt/mandatory sentences from keywords or superficial features without a preceding real-conflict boundary check. Its playful disclaimer doesn't resolve that conflict. E14/E21.

**Replace with:** Round-level matching and curiosity, no evaluation of affection/relationship quality. Make Court explicitly fictional, mutually chosen play with neutral stop/lighter/home paths. Separate any private, region-appropriate, reviewed safety/support flow from shared entertainment.

**Keep:** Harmless game mechanics and optional playful presentation.

**Acceptance:** No fabricated feelings, real-world blame, relationship diagnosis, pressure to disclose/intensify/reconcile, or automatic partner disclosure of safety concerns. High-risk flows need specialist review; this report does not certify them. **F §10,20,23 / I §9,15,16,18,29.**

## 7. Directly reproduced helper mismatches

These probes ran against current helper source in isolation; they were not added to application tests.

| Probe | Actual result | Meaning |
| --- | --- | --- |
| `sanitizeSafePresence(true)` | Object; displays `here`; strict equality false | Confirms S01. |
| Unknown action passed to `awardGrowthSparks` | `awarded: true` | No eligible-action allow-list. Not evidence of a live-server exploit. |
| A proposes, B approves via pure helper | `status: mutually_approved`, `approvalStatus: proposed` | Conflicting approval representations. |
| `refuse_unsafe` while focused | Speaking allowed: `false` | Safety intent suppressed. |
| Allowed `suggest`, but sealed-answer context label, unknown emotion and reveal action | Validator returns `isValid: true` | No actual-context/emotion/state-action validation; helper also isn't active Gemini validation. |

The main suite passes because it does not assert these cases through the real product flows.

## 8. Coverage map — all 59 numbered sections

**Foundation:** useful implementation exists. **Partial:** not complete end to end. **Gap:** no complete implementation found. **Conflict:** behavior contradicts a requirement. **Boundary:** scope/planning/future acceptance, not a completed feature.

### Features & Functionality — 27 sections

| Section | Assessment | Work |
| --- | --- | --- |
| 1. Vision | Partial shared living-home loop | R01/R05 |
| 2. Principles | No pet decay, but control/inference/scoring conflicts | R02/R08 |
| 3. Product roles | Partial; host/ritual/memory roles not connected | R01/R03/R06/R07 |
| 4. Core loop | Partial; local actions aren't authoritative shared outcomes | M03/R01/R03 |
| 5. Home | UI foundation; state/arrangement/ranking incomplete | S01/M01/M04/R06 |
| 6. Mood/wellbeing | Safe definitions/no decay; event/label controls incomplete | M01/M07/M13/R05 |
| 7. Growth | Arithmetic foundation; lifecycle/variety/eligibility gaps | M02/M03/R01 |
| 8. Rewards | Catalogue/shelf foundation; unlock/placement journey partial | M04 |
| 9. Togetherness | Mode choices exist; local prototypes/random routes | M05/M06/R06 |
| 10. Activity integration | Partial/inconsistent privacy and lifecycle | R04/R08 |
| 11. Sealed answers | Quiz real-session foundation; not universal/live-verified | M17/R04 |
| 12. Rituals | Forms/entries exist; scheduling identity/recurrence gaps | S02/S03/S08/R07 |
| 13. Memories | APIs exist; connected mutual approval conflicts | S06/S07/M14/M15/R03 |
| 14. Presence | Provider exists; pet mistakes membership for presence | S01/M01 |
| 15. Interactions | Taps exist; complete long-press and cross-client rate-limited pet reactions missing | S10/M13/R01/R05 |
| 16. Notifications | Gap in inspected Cupidot flow; types/UI don't establish delivery | M08/R07 |
| 17. Date journey | Rooms/actions exist; shared queue/transitions/recap incomplete | M05/R04/R06 |
| 18. Time zones | Account support exists; scheduling and opt-in use incomplete | M16/R07 |
| 19. Accessibility/device | 2D/OS-motion foundation; settings/focus/voice/fallback gaps | S09/M07/M12/M13 |
| 20. Safety/consent | Controls/helpers exist; connected authority and conflict handling incomplete | M08–M10/R02/R03/R08 |
| 21. Recovery | API foundation; ordering, retries and truthful outcomes incomplete | S04/S11/M14/M17 |
| 22. Economy | Boundary: no paid requirement for basic Cupidot care found | Preserve free privacy/accessibility/basic care; review shared purchase preview/private billing if added |
| 23. Measurement | Safe operational scheme missing; relationship metrics conflict | M19/R08 |
| 24. Document boundaries | No anatomy/art-style revamp specified | Retain character assets |
| 25. Local/live boundary | Audit made no backend changes; live behavior unverified | Section 10 |
| 26. Roadmap | Pieces of multiple phases; earlier exit gates incomplete | Section 9 |
| 27. Acceptance | Not met as a whole | M20 and connected feature gates |

### Intelligence & Behavior — 32 sections

| Section | Assessment | Work |
| --- | --- | --- |
| 1. Character idea | New companion fits; evaluation/judgment remains elsewhere | R05/R08 |
| 2. Personality | Partial/inconsistent across surfaces | S15/R05 |
| 3. Romance spectrum | Helpers exist; connected mutual/age/session gating missing | S13/R02 |
| 4. Voice identity | New prompts concise; legacy technical/inferred/long copy remains | S04/S05/S15 |
| 5. Speaking rules | Helper foundation, no central budget/context pipeline | S14/M11/M12/R05 |
| 6. Context | Good minimal outbound client body; reuse/permission model incomplete | M10/R02/R03/R05 |
| 7. Decision engine | Gap as unified runtime | R05 |
| 8. Deterministic/AI | Fallback exists; doesn't fulfill safe pipeline | M09/R05 |
| 9. Romance/chemistry | Legacy inference/pressure conflicts | S12/R08 |
| 10. Consent | Dimensions/independent choices incomplete | M07/M08/M10/R02 |
| 11. Memory | Approval/reuse/resurfacing/lifecycle gaps | M15/R03 |
| 12. Suggestions | Basic resume/random choice, no required ranking | R06 |
| 13. Hosting | Guidance exists; universal authorized lifecycle incomplete | S04/R04/R06 |
| 14. Shared-pet behavior | State helpers aren't home runtime driver | M01/R01/R05 |
| 15. Humor | Good new self-directed humor; problematic legacy targets | S15/R08 |
| 16. Difficult moments | Narrow helper, no connected reviewed private flow | S14/R08 |
| 17. Notifications | Helper rule exists; delivery/surface enforcement unverified | R07 |
| 18. Personalization | Names supported; inferred dynamics/roles conflict | M18/R08 |
| 19. Voice contract | Modes exist; owner/replay/context coordination incomplete | M12 |
| 20. Structured output | Incomplete standalone validator, disconnected from active request | M09 |
| 21. AI construction | Good client boundary; live authority unverified, explicit timeout absent | M09/M10/R02 |
| 22. Injection resistance | Phrase filters aren't end-to-end enforcement | M09/M20/R05 |
| 23. Curated library | Intent/tone variant foundation | S13/S15/M11 |
| 24. Freshness | Local pool avoids repeats; wider history integration missing | M11 |
| 25. Localization | Gap beyond English strings/current voice | M18 |
| 26. Accessibility intelligence | Presentation foundation, central calm/literal output incomplete | M12/M13/R05 |
| 27. Observability | Unified safe operational scheme missing | M19 |
| 28. Evaluation | Helper tests pass; identity/user-flow coverage incomplete | S16/M20 |
| 29. Red-team | Some narrow helper cases; no comprehensive live evidence | M20 |
| 30. Local/live boundary | Respected by audit; live verification remains separate | Section 10 |
| 31. Roadmap | Inconsistent progress across phases | Section 9 |
| 32. Acceptance | Not met as a whole | Resolve gaps and test actual flows |

## 9. Recommended order — step by step

1. **Correct misleading behavior.** S01–S08, S11–S15; remove invented partner replies and relationship/intimacy scores; contain real-conflict judging. Clearly mark or hide controls that don't enforce their claims.
2. **Unify the local model/settings.** Client contracts for R01/R02/R05, real presence, state priority, quiet mode and one output owner. Keep the visuals.
3. **Complete one representative local date.** Start with Quiz/Draw; demonstrate private/reveal/completion/recovery and exact-version proposal/reward behavior with a local transport harness. Test real hooks/UI, not just helper names.
4. **Finish local modes, home and planning.** M04–M06, R06, local R07 UI/contracts, accessibility, timezone handling and functional preferences. Extend activities using the proven pattern.
5. **Implement/verify live authority.** Inspect or implement shared pet records, individual consent, approvals, event ledger, lifecycle, scheduling and AI context directly in live Supabase. Don't assume RPC names prove correctness. Preserve the excluded create/join test unless separately authorized.
6. **Add intelligence/refinement.** Validated AI variation, allowed memory callbacks, freshness, minimal metrics, localization and optional reward collections after deterministic behavior works.

Each step should produce a reviewable result. The report does not recommend rebuilding every page at once.

## 10. Local versus live work

| Area | Local deliverable | Live proof required |
| --- | --- | --- |
| Pet/progression | Typed state, mocks, event-driven UI | Ownership, eligible event ledger, persistent dedupe/concurrency |
| Consent | Individual choices, effective state, withdrawal UI | Identity-bound intersection, eligibility/session gating, private downgrade |
| Memories | Exact preview/version/pending/edit/decline/recovery | Two approvals, finalize once, retention/deletion/separation/reuse revoke |
| Rituals | Recurrence/timezone UI, personal preferences | Authorized schedule, recipient choices, quiet hours/delivery dedupe |
| AI | Curated fallback, bounded lifecycle, defensive rendering | Auth, allowed context, rate limits, timeout, validated output, content-free logs |
| Activities | Appropriate lifecycle/local verification | Membership, reveal, durable events/snapshots, privacy/recovery |

No migration or Edge Function source was created. This is a change plan, not evidence that live capabilities are missing, deployed or safe.

## 11. Evidence index

Links target the reviewed checkout. Function names remain useful if later changes move lines.

- **E1:** [Companion](C:/Users/ayush/Desktop/cool/components/bot/CupidotCompanion.tsx), [moments](C:/Users/ayush/Desktop/cool/lib/cupidot-moments.ts), [browser test](C:/Users/ayush/Desktop/cool/tests/browser/cupidot-companion.spec.ts).
- **E2:** [Pet stage](C:/Users/ayush/Desktop/cool/components/bot/CupidotPetStage.tsx:102), [3D renderer](C:/Users/ayush/Desktop/cool/components/bot/CupidotBot.tsx:128), [2D renderer](C:/Users/ayush/Desktop/cool/components/bot/Cupidot2D.tsx), [motion CSS](C:/Users/ayush/Desktop/cool/app/globals.css:4486).
- **E3:** [Home wiring](C:/Users/ayush/Desktop/cool/components/our-space/CupidotHomeArea.tsx:35), [Our Space route](C:/Users/ayush/Desktop/cool/app/our-space/page.tsx).
- **E4:** [Behavior helpers](C:/Users/ayush/Desktop/cool/lib/cupidot-behavior.ts:49): `computeEffectiveRomanceLevel`, `getCuratedDialogue`, `canCupidotSpeak`, `handleSafetyBoundary`, `validateStructuredAiOutput`.
- **E5:** [State helpers](C:/Users/ayush/Desktop/cool/lib/cupidot-state.ts:58): presence wrapper, sparks, module-local celebration Map, storage and approval functions.
- **E6:** [Quiz real-session branch](C:/Users/ayush/Desktop/cool/app/quiz/page.tsx:41), [Draw branch](C:/Users/ayush/Desktop/cool/app/draw/page.tsx:41).
- **E7:** [Private answers](C:/Users/ayush/Desktop/cool/hooks/usePrivateAnswers.ts:159), [event runtime](C:/Users/ayush/Desktop/cool/lib/runtime/activity-runtime.ts:48), [Supabase transport](C:/Users/ayush/Desktop/cool/lib/runtime/supabase-transport.ts), [mock transport](C:/Users/ayush/Desktop/cool/lib/runtime/mock-transport.ts). Browser mock storage/event sharing is development scaffolding, not an authorization boundary.
- **E8:** [AI requests](C:/Users/ayush/Desktop/cool/lib/gemini.ts:119), [consent hook](C:/Users/ayush/Desktop/cool/lib/ai-consent.ts:8), [consent toggle](C:/Users/ayush/Desktop/cool/components/shared/AiConsentToggle.tsx).
- **E9:** [Account APIs](C:/Users/ayush/Desktop/cool/lib/account.ts:192), [keepsake writer](C:/Users/ayush/Desktop/cool/hooks/useKeepsakeWriter.ts).
- **E10:** [Pet hook](C:/Users/ayush/Desktop/cool/hooks/useCupidotPet.ts:28), [ritual form](C:/Users/ayush/Desktop/cool/components/our-space/CustomRitualModal.tsx:20), [ritual entries](C:/Users/ayush/Desktop/cool/components/our-space/SharedRituals.tsx).
- **E11:** [Activity guidance](C:/Users/ayush/Desktop/cool/components/shared/CupidotActivityGuidance.tsx:100). No route-level `guidanceMode=` argument was found in inspected app pages.
- **E12:** [Capsule workflow](C:/Users/ayush/Desktop/cool/components/our-space/DateNightCapsuleModal.tsx:28).
- **E13:** [Approval modal](C:/Users/ayush/Desktop/cool/components/our-space/KeepsakeApprovalModal.tsx:24), [detail modal](C:/Users/ayush/Desktop/cool/components/our-space/KeepsakeDetailModal.tsx), [types](C:/Users/ayush/Desktop/cool/types/cupidot.ts).
- **E14:** [Procedural fallback/judge](C:/Users/ayush/Desktop/cool/lib/cupidot.ts): `analyzeThemes`, `generateCupidotDilemma`, `judgeCourtCase`.
- **E15:** [Presence provider](C:/Users/ayush/Desktop/cool/contexts/PresenceContext.tsx:30), [membership source](C:/Users/ayush/Desktop/cool/contexts/CoupleSpaceContext.tsx:252).
- **E16:** [Togetherness modes](C:/Users/ayush/Desktop/cool/components/our-space/TogethernessModal.tsx:19): countdown, Quick Spark submission, Surprise routing.
- **E17:** [Rules/settings](C:/Users/ayush/Desktop/cool/components/our-space/YourRoomYourRulesModal.tsx:24): local switches and direct level selection.
- **E18:** [Voice](C:/Users/ayush/Desktop/cool/lib/voice.ts), [sound](C:/Users/ayush/Desktop/cool/lib/sound.ts), [Letter recording](C:/Users/ayush/Desktop/cool/app/letter/page.tsx).
- **E19:** [Pet tests](C:/Users/ayush/Desktop/cool/tests/cupidot-pet.test.ts:246), [behavior tests](C:/Users/ayush/Desktop/cool/tests/cupidot-behavior.test.ts), [QA matrix](C:/Users/ayush/Desktop/cool/docs/qa-manual-matrix.md).
- **E20:** [Cards](C:/Users/ayush/Desktop/cool/app/cards/page.tsx:83), [Host](C:/Users/ayush/Desktop/cool/app/host/page.tsx:64), [Photobooth](C:/Users/ayush/Desktop/cool/app/photobooth/page.tsx:113), [Passport](C:/Users/ayush/Desktop/cool/app/passport/page.tsx:54), [Scrapbook](C:/Users/ayush/Desktop/cool/app/scrapbook/page.tsx:50), [Dare](C:/Users/ayush/Desktop/cool/app/dare/page.tsx:107).
- **E21:** [Match scoring](C:/Users/ayush/Desktop/cool/app/match/page.tsx:125), [Court](C:/Users/ayush/Desktop/cool/app/court/page.tsx:89), plus E14.

## 12. Decisions to preserve

- Keep approved artwork and recent local companion improvements.
- Keep AI optional; finish deterministic behavior first.
- Keep solo/local starters, identify them honestly and don't count them as shared completion.
- No neglect, streak loss, compulsory care, relationship scores or pressure to save/intensify.
- More prompts or prettier UI cannot substitute for consent, ownership and synchronization.
