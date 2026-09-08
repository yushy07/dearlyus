# Cupidot workflow 4 — Live backend and final verification

**Status:** Not started  
**Prepared:** 8 September 2026  
**Source:** [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md), baseline `fded19081c0b47c5ec982b6491e3b9d203f2cbb4`.  
**Primary task ownership:** M20.

## Outcome

Verify or implement authoritative shared behavior in live Supabase, integrate the verified results and establish the final release evidence.

## Start condition and scope

Start only after files 1–3 local gates and their contract/handoff records are complete. Access, identity, service ownership and any required external approvals must be available. This planning document is not itself permission to publish, delete data or run a previously excluded test.

Begin backend work only after files 1–3 local gates. Inspect live capabilities first; implement only confirmed gaps directly in the live project. Do not create local migrations or Edge Function source. Local client follow-up fixes and verification are allowed when live integration reveals a mismatch.

This is a workflow subdivision of the audit, not a new claim that every live issue is proven. Evidence and requirement references are preserved below. Existing test passes do not mark any task in this file done.

## Work in this order

1. Read the actual live schema/RPC/Storage/Realtime/AI configuration and compare it with the handoff. Label each capability verified existing, incomplete, absent or unverified; avoid blindly rebuilding deployed functionality.
2. Complete the R01/R02 authority work first: membership, individual approvals, effective intersection, session/eligibility, event identity and ownership. Verify negative access and stale/revoked consent cases.
3. Complete R04/R03/M14: authorized activity events, sealed content and reveal, replay/snapshots, exact-version approvals, durable finalization and upload/retry/lifecycle handling.
4. Complete R06/R07: shared date state, accepted schedules, occurrence IDs, recipient consent, quiet-hour/DST enforcement and notification delivery deduplication.
5. Complete R05/M09/M10/M15/M19: minimal authorized AI context, request limits/timeouts, validated output, reuse/revocation and content-free logs. Verify provider failure does not stop the deterministic date.
6. Validate R08: no relationship scoring, real-conflict judgment or unauthorized partner disclosure. Record specialist-review status for any high-risk support flow; do not certify unreviewed behavior.
7. Run M20 through independent identities and connected devices where authorized, including tampered/stale requests, retries, refresh and multi-tab behavior. The excluded two-account create/join test remains excluded unless the user explicitly changes that instruction.
8. Reconcile every task ID and all 59 blueprint sections against evidence. Mark each complete, explicitly deferred, or blocked; unverified is not passed. Deploy/publish only when authorized and record actual deployment verification separately.

## Task details from the audit

These IDs have one primary owner across the four files. Related work can contribute to a larger revamp; it is not a separate duplicate implementation. For files 1–3, checking a task means its **local deliverable** is ready. Any required live acceptance remains open in file 4.

| Local/owned work ready | ID | Change | Original evidence and required result | Blueprint |
| --- | --- | --- | --- | --- |
| [ ] | M20 | Test actual connected flows | Exercise hooks/pages and independent identities: unilateral consent, changed approvals, revoked reuse, stale requests, duplicate awards, mute/motion, tab coordination and recovery. Preserve the excluded create/join test unless separately authorized. E19 | F §27; I §28,29,32 |

## Live acceptance handoff for all eight revamps

These are live completion stages of existing IDs, not eight new tasks or reassigned primary ownership.

| Verified | Original ID | Local owner | Live acceptance to prove |
| --- | --- | --- | --- |
| [ ] | R01 | [Core behavior, state and consent](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/02_Core_Behavior_and_Consent.md) | Same authorized pet/home/progression state across devices; stable event ledger, eligibility, duplicate prevention and concurrency. |
| [ ] | R02 | [Core behavior, state and consent](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/02_Core_Behavior_and_Consent.md) | Private individual consent, effective intersection, age/session eligibility where required, revocation and no unilateral escalation. |
| [ ] | R03 | [Shared features and product polish](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/03_Shared_Features_and_Polish.md) | Exact-version identity-bound mutual approvals; save once; edited/declined/expired proposals; reuse revocation and lifecycle rules. |
| [ ] | R04 | [Shared features and product polish](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/03_Shared_Features_and_Polish.md) | Independent real activity participation, sealed content where applicable, authorized reveal, pause/end and durable replay. |
| [ ] | R05 | [Core behavior, state and consent](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/02_Core_Behavior_and_Consent.md) | Authenticated minimal context, consistent policy/output, server-side validation, bounded AI failure and no hidden-answer influence. |
| [ ] | R06 | [Shared features and product polish](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/03_Shared_Features_and_Polish.md) | Shared resumable date queue, accepted ritual priority and recommendations constrained by verified permitted context. |
| [ ] | R07 | [Shared features and product polish](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/03_Shared_Features_and_Polish.md) | Stable schedule/occurrence identity, personal notification categories, quiet hours/DST, neutral missed windows and delivery dedupe. |
| [ ] | R08 | [Trust and quick fixes](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/01_Trust_and_Quick_Fixes.md) | No fabricated feelings or relationship evaluation; no real-conflict blame or automatic disclosure; required support-flow review recorded. |

## Required evidence record

| Area | Local evidence | Live evidence | Result / remaining limitation |
| --- | --- | --- | --- |
| Consent / access | Pending | Pending | Not verified |
| Activities / reveal / recovery | Pending | Pending | Not verified |
| Pet / rewards / home | Pending | Pending | Not verified |
| Approvals / media / memory reuse | Pending | Pending | Not verified |
| Date queues / rituals / notifications | Pending | Pending | Not verified |
| AI / privacy / logs | Pending | Pending | Not verified |
| Accessibility / voice / motion | Pending | Pending where applicable | Not verified |
| Two-account create/join test | Excluded | Excluded | Do not claim coverage without explicit authorization and evidence |
| Deployment | Pending | Pending | Not requested by this workflow split |

## Completion gate

- [ ] Live ownership and consent checks enforce the expected outcome independently of client-supplied claims.
- [ ] Authorized independent participants converge on activity state, growth, home items, approvals and schedules without duplicated durable outcomes.
- [ ] Hidden drafts, private preferences, revoked/deleted memories and restricted media do not leak through responses, events, notifications or logs.
- [ ] AI failure, disconnect, out-of-order events, uncertain uploads and retries have demonstrated recovery with truthful user feedback.
- [ ] Every relevant check has dated evidence; excluded tests remain explicitly excluded; any resulting assurance limit is stated.
- [ ] Local, live-verified, deferred and deployment status are clearly separated. No scope is silently dropped and no release is called complete while required checks remain unresolved.

## Progress and handoff

| Field | Record |
| --- | --- |
| Last checked code revision | Not recorded yet |
| Completed task IDs | None recorded |
| Tests and browser evidence | Not recorded yet |
| Live dependencies | See acceptance/evidence tables above |
| Deferred scope / reason / approval | None recorded |
| Blockers / next action | Start with the first ordered work item |

Deliver final evidence and residual limitations. Update the progress records in these four files; keep the master audit as the dated finding/evidence reference.

## Source evidence

F/I refer to the two blueprints linked in [Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md). The master retains the complete 59-section coverage map, audit limits and helper-probe results.

- **E19:** [Pet tests](C:/Users/ayush/Desktop/cool/tests/cupidot-pet.test.ts:246), [behavior tests](C:/Users/ayush/Desktop/cool/tests/cupidot-behavior.test.ts), [QA matrix](C:/Users/ayush/Desktop/cool/docs/qa-manual-matrix.md).

## Navigation

Previous: [Shared features and product polish](C:/Users/ayush/Desktop/cool/docs/cupidot-workflow/03_Shared_Features_and_Polish.md).  
[Master audit](C:/Users/ayush/Desktop/cool/docs/Cupidot_Codebase_Gap_Audit_2026-09-08.md).
