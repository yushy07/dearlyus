# Dearly Us — Dual-Client QA Manual Verification Matrix & Test Harness

This document outlines the systematic verification matrix for the **Dearly Us** collaborative date experience. It serves as the authoritative verification protocol for both local mock transport testing and live two-account Supabase deployment.

---

## 1. Operating Rules & Pre-Flight Setup

| Requirement          | Local Verification Mode                       | Live Supabase Mode                                     |
| :------------------- | :-------------------------------------------- | :----------------------------------------------------- |
| **Transport**        | `MockActivityTransport` (in-memory bus)       | `SupabaseActivityTransport` (Postgres Realtime + RPCs) |
| **Auth**             | Anonymous / Local Mock UUIDs                  | Two distinct authenticated Supabase accounts           |
| **Testing Topology** | 2 browser windows (Side-by-Side or Incognito) | 2 physical devices or 2 separate browser profiles      |
| **Data Boundary**    | Ephemeral memory (cleared on restart)         | Strict RLS: partner boundary enforced by `couple_id`   |

---

## 2. Activity Verification Matrix

### 2.1 Date Night Lobby & Presence (`/room/[code]`)

| ID         | Test Scenario          | Steps                                        | Expected Result                                                               | Pass/Fail |
| :--------- | :--------------------- | :------------------------------------------- | :---------------------------------------------------------------------------- | :-------- |
| **LOB-01** | Lobby Entry & Presence | Partner A creates room; Partner B opens link | Both avatars illuminate with green presence indicators.                       | [ ]       |
| **LOB-02** | Ready Synchronization  | Partner A toggles "Ready" button             | Partner B's screen reflects Partner A's ready status within 150ms.            | [ ]       |
| **LOB-03** | Dual Ready Countdown   | Partner B also toggles "Ready"               | 3-second synchronized countdown triggers automatically on both screens.       | [ ]       |
| **LOB-04** | Activity Launch        | Countdown completes                          | Both clients route simultaneously to selected activity URL with `code` query. | [ ]       |

---

### 2.2 Quiz: Secret Until Together (`/quiz`)

| ID        | Test Scenario              | Steps                                                   | Expected Result                                                                                                  | Pass/Fail |
| :-------- | :------------------------- | :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- | :-------- |
| **QZ-01** | Private Answer Isolation   | Partner A picks choice and taps "Lock Answer"           | Partner A sees sealed lock badge; Partner B sees "Partner has locked in", but **no choice or value is visible**. | [ ]       |
| **QZ-02** | Sealed Payload Audit       | Inspect network payload for `answer_locked` event       | Payload contains **only** `{ roundNumber, locked: true }`. Zero answer text or index leaked.                     | [ ]       |
| **QZ-03** | Dual Lock & Reveal Ready   | Partner B locks their answer                            | Both screens show golden "Ready to Reveal" seal with haptic chime sound.                                         | [ ]       |
| **QZ-04** | Synchronized Reveal        | Either partner taps "Reveal Together"                   | Both screens play reveal flip animation; answers display side-by-side with match banner.                         | [ ]       |
| **QZ-05** | Gentle Skip                | Either partner taps "Gentle Skip" on sensitive question | Round marks as skipped without score penalty; both screens advance cleanly to next round.                        | [ ]       |
| **QZ-06** | Quiz Completion & Keepsake | Complete final round                                    | Celebration confetti fires; "Save to Keepsakes" generates activity keepsake draft.                               | [ ]       |

---

### 2.3 Draw Together: Canvas Replay & Transient Presence (`/draw`)

| ID         | Test Scenario               | Steps                                                  | Expected Result                                                                 | Pass/Fail |
| :--------- | :-------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------ | :-------- |
| **DRW-01** | Zero-Latency Local Draw     | Partner A draws continuous stroke                      | Canvas renders stroke immediately with 0ms latency.                             | [ ]       |
| **DRW-02** | Transient Pointer Presence  | Partner A moves cursor across canvas                   | Partner B sees Partner A's named floating cursor without any database writes.   | [ ]       |
| **DRW-03** | Batched Stroke Delivery     | Partner A finishes stroke                              | Partner B's canvas renders identical stroke with matching color and brush size. | [ ]       |
| **DRW-04** | Canvas Wipe Synchronization | Either partner taps "Clear Canvas"                     | Canvas clears simultaneously on both devices with gentle pop sound.             | [ ]       |
| **DRW-05** | Refresh / Recovery Replay   | Draw 10 strokes on Partner A; reload Partner B browser | Partner B fetches session snapshot and replays all 10 strokes accurately.       | [ ]       |
| **DRW-06** | Keepsake Export             | Tap "Save to Keepsakes"                                | Canvas renders PNG blob and records keepsake with title and date metadata.      | [ ]       |

---

### 2.4 Catalog Activities

| ID         | Activity                       | Key Event Sequence                               | Verification Criteria                                                                        | Pass/Fail |
| :--------- | :----------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------- | :-------- |
| **CAT-01** | **Cards** (`/cards`)           | `cards_flip` -> `cards_next`                     | Card flips on both screens; advancing advances both clients; completion sets keepsake draft. | [ ]       |
| **CAT-02** | **Host Mode** (`/host`)        | `host_speaker_switch` -> `host_prompt_change`    | Active speaker badge alternates; prompts advance synchronously.                              | [ ]       |
| **CAT-03** | **Match** (`/match`)           | `match_reveal` -> `match_next`                   | Telepathy score increments when matched; round index increments.                             | [ ]       |
| **CAT-04** | **Court / Debate** (`/court`)  | `court_plea` -> `court_verdict` -> `court_close` | Advances from filing to arguments to verdict; penalty displays on both screens.              | [ ]       |
| **CAT-05** | **Dare** (`/dare`)             | `dare_accept` -> `dare_complete`                 | Dares count increments; reroll updates dare text on both screens.                            | [ ]       |
| **CAT-06** | **Photobooth** (`/photobooth`) | `photo_start_countdown` -> `photo_shutter`       | 3s countdown ticks synchronously; shutter flashes simultaneously.                            | [ ]       |
| **CAT-07** | **Passport** (`/passport`)     | `passport_stamp_add` -> `page_turn`              | Stamp count updates across devices; page turns synchronously.                                | [ ]       |

---

## 3. Reconnect & Network Interruption Resilience

| ID         | Fault Injection                       | Action Under Test                                                       | Expected Recovery Behavior                                                                             | Pass/Fail |
| :--------- | :------------------------------------ | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :-------- |
| **RES-01** | **Browser Refresh During Drafting**   | Partner A refreshes page while typing draft answer                      | Page reloads, reconnects to session bus, restores draft choice from local state.                       | [ ]       |
| **RES-02** | **Browser Refresh After Answer Lock** | Partner A refreshes page after locking answer                           | Page restores locked state, re-establishes subscription, waits for Partner B without re-prompting.     | [ ]       |
| **RES-03** | **Network Drop Before Reveal**        | Disconnect network on Partner B; Partner A reveals; reconnect Partner B | Partner B detects sequence gap, triggers `requestRecovery()`, and retrieves revealed answers.          | [ ]       |
| **RES-04** | **Duplicate Event Delivery**          | Transport dispatches duplicate sequence #3                              | Adapter pure reducer detects already-processed sequence and discards cleanly without state corruption. | [ ]       |

---

## 4. Accessibility (a11y) Audit

- [ ] **Focus Management:** All interactive elements (buttons, inputs, option cards) have visible `:focus-visible` focus rings with minimum 3:1 contrast ratio.
- [ ] **Screen Reader Support:** Screen reader announcements via `aria-live="polite"` when partner locks answer, reveals answers, or advances round.
- [ ] **Keyboard Navigation:** Quiz options selectable via `ArrowUp`/`ArrowDown` and `Enter`/`Space`.
- [ ] **Reduced Motion:** All CSS animations and confetti respect `@media (prefers-reduced-motion: reduce)`.
- [ ] **Contrast Compliance:** All typography satisfies WCAG AA (4.5:1 for normal text, 3:1 for large headers).

---

## 5. Recorded Local Evidence

- [x] Adapter, behavioral, and security unit coverage: `npm test` runs 76 deterministic tests across 6 suites.
- [x] Browser smoke coverage: `npm run test:browser` opens Quiz in two tabs, verifies the Draw canvas, and renders every catalog activity route without a backend.
- [ ] The interactive two-tab matrix above. Each row requires a dated manual result before it may be marked passed.
- [ ] Accessibility audit with keyboard-only and screen-reader evidence.

## 6. Performance Budgets

| Metric                              | Target  | Verification Method                       | Status              |
| :---------------------------------- | :------ | :---------------------------------------- | :------------------ |
| **First Contentful Paint (FCP)**    | < 1.2s  | Chrome DevTools Lighthouse                | Pending measurement |
| **Interaction to Next Paint (INP)** | < 100ms | Performance Profiler during rapid drawing | Pending measurement |
| **Cumulative Layout Shift (CLS)**   | < 0.05  | Layout shift audit on route transitions   | Pending measurement |
| **Mock Test Suite Execution**       | < 1.0s  | `npm test` (20 deterministic tests)       | Verified locally    |
