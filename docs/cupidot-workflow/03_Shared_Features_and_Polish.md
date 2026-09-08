# Cupidot workflow 3 — Shared features and product polish

**Status:** Not started  
**Prepared:** 8 September 2026  
**Source:** [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md), baseline `fded19081c0b47c5ec982b6491e3b9d203f2cbb4`.  
**Primary task ownership:** M03, M04, M05, M06, M08, M13, M14, M15, M16, M18, M19, R03, R04, R06, R07.

## Outcome

Complete the local end-to-end pet/date/memory/ritual experience using the consistent contracts from file 2, then prepare the live implementation handoff.

## Start condition and scope

Start only after files 1 and 2 pass their local completion gates. Start with one representative Quiz/Draw flow and reuse its lifecycle pattern rather than redesigning every activity independently.

Local UI, client state machines, transport integration and deterministic simulations. Complete locally before file 4 backend changes. Existing APIs may be consumed, but do not equate their names with verified approval/ownership semantics.

This is a workflow subdivision of the audit, not a new claim that every live issue is proven. Evidence and requirement references are preserved below. Existing test passes do not mark any task in this file done.

## Work in this order

1. Implement local R04 for Quiz/Draw first, then Cards/Host/Match/Court/Dare/Photobooth/Passport/Scrapbook as applicable: actual privacy model, independent participation, readiness, reveal, pause/skip/end and recovery.
2. Implement R03 with M14/M15: exact-version memory preview, independent approvals, edit invalidation, decline/expiry, finalize-once contract, uncertain-upload/save handling and separate reuse/revoke controls.
3. Complete M03/M04: confirmed eligible outcome IDs, variety/cap/session behavior, placed home items, unlock validation and undo. Local solo clicks never count as shared completion.
4. Complete M05/M06: common-deadline Quiet Together and independent Quick Spark/Deep Connection flows, with honest local/live labels and neutral exit.
5. Implement R06: resume → accepted ritual → allowed time/energy/permissions/accessibility/variety, one clear reason, shared queue and peaceful recap/end.
6. Implement local R07 with M08/M16: stable ritual/occurrence identity, recurrence, flexible windows, chosen timezones/DST, private recipient controls, quiet hours and accepted schedule changes.
7. Complete M13 accessibility; M18 language/address support as scoped; M19 content-free operational outcomes. If localization is deferred for an explicitly agreed English-only launch, record it as deferred, not completed.
8. Prepare a consolidated local verification record and the server contracts needed for file 4. Test features through actual components/hooks, not merely helper names.

## Task details from the audit

These IDs have one primary owner across the four files. Related work can contribute to a larger revamp; it is not a separate duplicate implementation. For files 1–3, checking a task means its **local deliverable** is ready. Any required live acceptance remains open in file 4.

| Local/owned work ready | ID | Change | Original evidence and required result | Blueprint |
| --- | --- | --- | --- | --- |
| [ ] | M03 | Award only eligible shared outcomes | Wire activity, ritual, date, milestone and approved-save events; use stable IDs and variety rules. Current call sites mostly award local Togetherness actions and local seeds; unknown action types are accepted. E3/E5/E10 | F §4,7,8 |
| [ ] | M04 | Turn collection into a shared home | Current placement is IDs/highlighted catalogue buttons. Render and arrange items, validate unlocks, support undo, activity souvenirs and optional seasonal/interaction rewards with “not now.” E3/E5 | F §5,8 |
| [ ] | M05 | Make Quiet Together shared | Replace local countdown with a common session/deadline, independent joining, pause/end/recovery and valid completion. Stop ambience on natural completion too. E16 | F §9,17,18 |
| [ ] | M06 | Finish Quick Spark/Deep Connection | Add independent participation, private drafting, appropriate reveal, skip/exit and optional approved save. A local answer click must not stand in for shared completion. E16 | F §9–11 |
| [ ] | M08 | Replace decorative privacy controls | Ask-before-save/quiet-hours toggles are local dialog state. Add functional personal categories, resurfacing and Surprise allow-lists; don't present guaranteed consent as a switch that can disable it. E17 | F §16,20 |
| [ ] | M13 | Complete accessibility across home dialogs | Rules/ritual/Togetherness/approval lack the companion's full focus/Escape/restore pattern. Verify labels, selected states, touch scrolling and announcements; add optional hidden mood labels and calm reactions. E2/E13/E16/E17 | F §6,19; I §26 |
| [ ] | M14 | Complete upload/save recovery | Random upload path plus finalize/cleanup is a start. Add durable retry identity, pending/recoverable uploads and uncertain-finalize handling to avoid loss/duplicates. Verify server support. E9 | F §13,21 |
| [ ] | M15 | Add controlled memory lifecycle | Existing display/delete/export parts don't provide hide/archive/edit, explainable opt-in resurfacing, separate reuse/revoke or separation/closure handling. E9/E13 | F §13,20; I §11 |
| [ ] | M16 | Integrate timezones and preparation | Ritual accepts timezone props but home doesn't provide them. Add selected-zone dates, DST-safe scheduling, flexible windows, opt-in overlap and accepted-plan reminders. E3/E10 | F §12,17,18 |
| [ ] | M18 | Add selected-language/address support | English strings and assumptions about distance/roles remain. Localize intent and reviewed humor, respect chosen forms of address and lower-tone fallback. Later phase if launch is explicitly English-only. E4/E14 | I §18,25 |
| [ ] | M19 | Add minimal operational metrics | No unified Cupidot fallback/latency/intent reporting found. Use normalized outcomes and anonymous correlations, never content, codes or private downgrade identity. Verify live logging separately. E7/E8 | F §23; I §27 |

## Subsystem redesigns owned here

The original acceptance criteria include the final connected outcome. Files 1–3 implement their local portion; file 4 verifies live authority before global completion.

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

## Completion gate

- [ ] A complete local date demonstrates entry, independent interaction, correct reveal, completion, memory proposal, eligible growth and return home.
- [ ] All relevant activity routes use the consistent contract or are explicitly labelled local demos; no fabricated partner content remains.
- [ ] Memory edits invalidate approvals as needed; decline saves nothing; reuse is separate from saving; failed/uncertain uploads are recoverable in the demonstrated flow.
- [ ] Home rewards, mode sessions, recommendation filters and ritual occurrence logic work under local duplicate/reconnect/timezone scenarios.
- [ ] Keyboard, focus, captions, reduced motion, quiet mode, mobile layout and meaningful errors are checked across affected features.
- [ ] Every remaining backend requirement, explicitly deferred feature and required live acceptance scenario is listed for file 4.

## Progress and handoff

| Field | Record |
| --- | --- |
| Last checked code revision | Not recorded yet |
| Completed task IDs | None recorded |
| Tests and browser evidence | Not recorded yet |
| Live dependencies | Record for file 4; not assumed verified |
| Deferred scope / reason / approval | None recorded |
| Blockers / next action | Start with the first ordered work item |

All locally implementable work from the four-file plan is now ready. File 4 is responsible for checking existing live behavior, implementing missing authority directly in live Supabase, and verifying the real connected result.

## Source evidence

F/I refer to the two blueprints linked in [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md). The master retains the complete 59-section coverage map, audit limits and helper-probe results.

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
- **E13:** [Approval modal](C:/Users/ayush/Desktop/cool/components/our-space/KeepsakeApprovalModal.tsx:24), [detail modal](C:/Users/ayush/Desktop/cool/components/our-space/KeepsakeDetailModal.tsx), [types](C:/Users/ayush/Desktop/cool/types/cupidot.ts).
- **E14:** [Procedural fallback/judge](C:/Users/ayush/Desktop/cool/lib/cupidot.ts): `analyzeThemes`, `generateCupidotDilemma`, `judgeCourtCase`.
- **E16:** [Togetherness modes](C:/Users/ayush/Desktop/cool/components/our-space/TogethernessModal.tsx:19): countdown, Quick Spark submission, Surprise routing.
- **E17:** [Rules/settings](C:/Users/ayush/Desktop/cool/components/our-space/YourRoomYourRulesModal.tsx:24): local switches and direct level selection.
- **E20:** [Cards](C:/Users/ayush/Desktop/cool/app/cards/page.tsx:83), [Host](C:/Users/ayush/Desktop/cool/app/host/page.tsx:64), [Photobooth](C:/Users/ayush/Desktop/cool/app/photobooth/page.tsx:113), [Passport](C:/Users/ayush/Desktop/cool/app/passport/page.tsx:54), [Scrapbook](C:/Users/ayush/Desktop/cool/app/scrapbook/page.tsx:50), [Dare](C:/Users/ayush/Desktop/cool/app/dare/page.tsx:107).

## Navigation

Previous: [Core behavior, state and consent](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/02_Core_Behavior_and_Consent.md).  
Next: [Live backend and final verification](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/04_Live_Backend_and_Final_Verification.md).  
[Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md).
