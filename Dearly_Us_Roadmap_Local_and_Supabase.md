# Dearly Us — Implementation Roadmap

This roadmap separates the work into two clear tracks:

1. **Part 1 — Local project work:** product experience, frontend, shared client architecture, activity integrations, local tests, and version-controlled Supabase source files.
2. **Part 2 — Supabase work:** live authentication, database, security, RPCs, Realtime, Storage, Edge Functions, deployment, and live verification.

The two tracks should be completed in the order shown in the final delivery plan. A migration or Edge Function saved locally is only source code; Supabase work is complete only after it is deployed to the live project and verified there.

---

# Part 1 — Local Project Work

## 1. Establish the local baseline

### Work

- Document the current routes, components, room hooks, activity state, Supabase calls, and environment variables.
- Record the current two-browser behavior for Quiz and Draw Together.
- Define a shared activity registry, event names, error codes, and TypeScript contracts.
- Decide which current room and activity behavior can be preserved during migration.
- Add a local checklist that distinguishes implemented, locally tested, deployed, and live-verified work.

### Exit gate

- The current app behavior can be reproduced locally.
- All existing frontend dependencies on the old room system are known.
- No secret is stored in the frontend bundle or repository.

## 2. Build the account and couple-connection experience

### Routes and screens

- Add `/login`, `/auth/callback`, `/profile`, `/invite/[token]`, and `/our-space`.
- Keep Google as the sign-in method.
- Build profile onboarding for display name, city, timezone, and avatar.
- Build **Create Our Space** for the first partner.
- Build an invitation card with copy-link, copy-code, locally generated QR code, regenerate, and revoke controls.
- Preserve the exact invite destination through Google sign-in.
- Build invitation states for pending, accepted, expired, revoked, already used, couple full, self-invite, and already connected.
- Show a realtime connected state after the second partner accepts.

### User journey

1. The first partner signs in and completes onboarding.
2. They create Our Space and receive a private single-use invitation.
3. The second partner opens the invitation and signs in if needed.
4. They see the inviter, space name, expiration, and confirmation action.
5. After acceptance, both partners enter the connected Our Space state.

### Exit gate

- The complete journey works locally with two separate test accounts against the configured backend.
- Every failed invite state has clear recovery copy.

## 3. Upgrade the profile page into Our Space

Build a shared dashboard containing:

- Both partner identities and local times.
- Partner connection and presence state.
- Active-room and continue-session actions.
- **Start date night**.
- Invitation management while waiting for a partner.
- Recent keepsakes and Relationship Constellation preview.
- Shared preferences, planned rituals, and AI consent.
- Privacy, export, separation, and deletion entry points.

Make navigation state-aware:

- Signed out: sign in with Google.
- Signed in but unpaired: My Space and Connect your person.
- Paired but outside a room: Our Space, partner status, and Start date night.
- Inside a live room: current activity, partner state, lobby, and leave controls.

## 4. Build the Date Night Lobby

### Interface

- Show both avatars joined by the Connection Ribbon.
- Show both local times and presence states.
- Add ready controls.
- Add mood choices: playful, romantic, deep, cozy, and spontaneous.
- Add duration choices: 15, 30, 45, 60, and 90 minutes.
- Add activity selection and **Surprise us**.
- Explain Cupidot consent and show its current status.
- Add optional shared ambient sound.
- Add synchronized countdown, leave-room, and resume-session controls.

### Together Pulse

Create a reusable component for:

- Waiting for your person.
- Invited.
- Both connected.
- Partner online, choosing, writing, drawing, or locked in.
- Ready to reveal.
- Reconnecting or session resumed.
- Keepsake saved.

The component may show progress but must never expose a partner's hidden content.

### Exit gate

- Two browser sessions accurately show join, ready, disconnect, reconnect, and resume states.
- All state colors have equivalent text and keyboard-accessible controls.

## 5. Refactor local room and realtime architecture

Replace the broad room hook with focused modules:

- `useCoupleSpace()` — membership and couple profile.
- `useActiveRoom()` — create, resume, leave, and expire.
- `useRoomPresence()` — connection and ready state.
- `useRealtimeEvents()` — subscriptions, validation, and event cursors.
- `useActivitySession()` — snapshot and transitions.
- `usePrivateAnswers()` — submit, lock, and reveal.
- `useSessionRecovery()` — reconnect and replay.
- `useKeepsakeWriter()` — intentional memory persistence.

Use this provider hierarchy:

```text
SupabaseSessionProvider
  CoupleSpaceProvider
    ActiveRoomProvider
      PresenceProvider
        ActivitySessionProvider
          Activity page
```

Remove the client fallback that creates a room after a join failure. A join failure must remain a join failure; only the protected create-room operation may create a room.

## 6. Standardize activity integration

Every realtime activity should implement one common contract:

```ts
interface RealtimeActivityAdapter<TSnapshot, TEvent> {
  activityType: string;
  schemaVersion: number;
  createInitialSnapshot(input: StartActivityInput): TSnapshot;
  validateEvent(event: TEvent): ValidationResult;
  reduce(snapshot: TSnapshot, event: TEvent): TSnapshot;
  canTransition(snapshot: TSnapshot, action: string, userId: string): boolean;
  summarize(snapshot: TSnapshot): ActivityResult;
  buildKeepsake?(result: ActivityResult): KeepsakeDraft | null;
}
```

The client must:

- Treat the server snapshot as shared truth.
- Use server sequence numbers and idempotency IDs.
- Detect event gaps and request replay.
- Ignore duplicate delivery.
- Calculate timers from server timestamps.
- Reload the latest snapshot after browser sleep or reconnection.
- Keep transient cursor or pointer data out of durable database events.

## 7. Build Secret Until Together

Implement this interaction:

```text
Draft locally
  → submit privately
  → server seals answer
  → partner sees only “locked”
  → both answers become locked
  → reveal becomes valid
  → server returns both answers
  → both clients reveal from the same server event
```

Add:

- `SecretAnswerSeal`.
- Partner lock-status indicator.
- Branded **Reveal Together** animation.
- Reactions after reveal.
- **Gentle Skip**, requiring no reason and showing a neutral transition to both people.

The UI should never be relied on to enforce hidden-answer privacy.

## 8. Convert activities in dependency order

### Reference activities

1. **Quiz**
   - Move round truth into the shared activity snapshot.
   - Use private answer lock and reveal.
   - Support refresh, replay, and synchronized reveal.

2. **Draw Together**
   - Batch strokes and order them by sequence.
   - Keep cursors transient.
   - Add canvas checkpoints and recovery.
   - Save completed artwork as an optional keepsake.

### Remaining catalog

Convert only after Quiz and Draw pass the two-device test matrix:

1. Cards.
2. Host mode.
3. Match.
4. Debate and Court.
5. Dare.
6. Photobooth timing.
7. Passport and Scrapbook collaboration.
8. Remaining room-aware activities.

For every activity, define its snapshot, event allow-list, private/shared data, completion rules, reconnect behavior, and keepsake output.

## 9. Build keepsakes and relationship continuity

### Features

- Functional memory shelf and keepsake detail view.
- Date Night Capsule with completed activities, selected favorite moments, artwork or photostrip, optional Cupidot summary, private note, and save/discard controls.
- Relationship Constellation for milestones such as first connection, first date night, first quiz match, first drawing, first photostrip, first letter, and date-night totals.
- Continue-previous-date-night prompt.
- Memory Weather based only on explicitly selected moods, never inferred relationship health.

### Exit gate

- A completed activity can create a private, retrievable, and deletable keepsake.
- Discarding an artifact does not leave a broken permanent record.

## 10. Add rituals, timezone features, and Cupidot UX

### Timezone Bridge

- Show both local times, dates, and day names.
- Suggest overlapping evening times and duration-appropriate activities.
- Add warm time-aware copy.
- Support optional scheduled-date metadata.

### Shared rituals

- Sunday check-in.
- Daily gratitude.
- Bedtime question.
- Monthly memory recap.
- Long-distance countdown.
- Anniversary capsule.

Rituals must stay optional and avoid guilt-oriented streak language.

### Cupidot

- Explain consent before any AI request.
- Send only allowed, revealed, non-sensitive session context.
- Never send hidden answers, images, invite codes, room codes, tokens, precise location, or unrelated account history.
- Provide curated local fallbacks so an AI failure never blocks play.
- Never diagnose, shame, pressure, or present an inference as fact.

## 11. Local accessibility, error, and device QA

Cover:

- OAuth cancellation, expired callbacks, expired sessions, and delayed profiles.
- Self, expired, revoked, reused, full, and concurrent invitation cases.
- Invalid, cross-couple, rotated, expired, completed, and simultaneously created rooms.
- Duplicate, missing, and out-of-order events.
- Multiple tabs, browser sleep, temporary offline state, and reconnect.
- Camera denial, unsupported browser, oversized media, and interrupted uploads.
- Desktop Chrome, Android Chrome, narrow mobile layouts, landscape orientation, and Safari/iOS where supported.
- Keyboard flows, focus management, readable status text, screen-reader announcements, and reduced motion.

Initial performance targets:

- Local interaction feedback under 100 ms.
- Realtime event-to-render under 500 ms on a healthy connection.
- Presence convergence under 3 seconds.
- Ordinary reconnect recovery under 5 seconds.
- Paginated event replay and batched drawing updates.
- Compressed, lazy-loaded media and route-level code splitting.

## 12. Maintain local Supabase source records

Keep all backend changes reproducible in the repository:

- Versioned SQL files under `supabase/migrations`.
- Edge Function source under `supabase/functions`.
- Local database types and generated client types.
- Seed or fixture data containing no real private information.
- RLS and cross-account negative tests.
- Migration ordering, forward-repair, and rollback notes.
- Environment-variable examples containing placeholders only.

These files are required, but they do not prove that Supabase has been deployed.

---

# Part 2 — Supabase Work

## 1. Configure authentication in the live Supabase project

- Enable Google OAuth only for the intended application flow.
- Configure local, preview, and production site URLs and callback URLs.
- Confirm profile creation/update behavior for new and returning users.
- Verify signed-out private routes return users to the intended destination after authentication.
- Confirm no provider token or application secret reaches the browser bundle or logs.

### Live verification

- A new Google user creates exactly one profile.
- A returning Google user reuses the same profile.
- Cancelled and expired authentication flows fail safely.
- Invite continuation works across sign-in and on another device.

## 2. Deploy the core database model

Create and migrate these tables:

- `profiles` — one record per authenticated user.
- `couples` — one shared space and its lifecycle.
- `couple_members` — maximum two active members and one active couple per user.
- `couple_invites` — hashed, single-use, expiring, revocable invitations.
- `rooms` — couple-owned date-night rooms with server-generated codes and expiration.
- `room_members` — durable join, ready, leave, and recovery metadata.
- `activity_sessions` — versioned snapshot, revision, status, round, and replay cursor.
- `room_events` — validated, ordered, idempotent activity events.
- `private_answers` — per-user sealed answers with server-authorized reveal.
- `keepsakes` — private shared memories and safe metadata.
- `relationship_milestones` — earned or manually recorded milestones.
- `shared_preferences` — couple-controlled defaults, motion, audio, and consent settings.
- Ritual and scheduling tables when that phase begins.

### Required constraints

- One active couple membership per user.
- No more than two active members per couple, enforced transactionally.
- One answer per user, activity session, and round.
- Unique event sequence and idempotency key per activity session.
- Active-room uniqueness according to the selected resume policy.
- Server-generated timestamps and ownership fields.

## 3. Deploy and test row-level security

Use this core rule:

> An authenticated user may access a resource only when they are an active member of the couple that owns it.

Requirements:

- Users can update only their own profile.
- A connected partner receives only the approved partner profile fields.
- Couple, member, invite, room, activity, event, answer, keepsake, and storage writes use protected operations where appropriate.
- Private answers are readable only by their owner before authorized reveal.
- Storage paths are scoped to the owning couple.
- Queries do not reveal whether another couple, invite, room, answer, or asset exists.
- Anonymous and public execution permissions are revoked from privileged functions.
- Every `SECURITY DEFINER` function uses a fixed `search_path`.
- Identity and ownership are derived from `auth.uid()`, never trusted client parameters.

### Live verification

Run positive tests with two connected accounts and negative tests with a third account and a member of another couple. Direct table and storage requests must not bypass the intended rules.

## 4. Deploy protected couple lifecycle operations

### `create_couple_space(space_name text)`

- Require authentication and completed onboarding.
- Reject an existing active membership.
- Atomically create the couple, owner membership, and first invite.
- Return only the sanitized couple-space view.

### `regenerate_couple_invite()`

- Require active couple membership and an open partner slot.
- Rate-limit regeneration.
- Revoke prior active invitations and create one new single-use invitation.

### `accept_couple_invite(token text)`

- Lock the invitation and membership scope in one transaction.
- Reject expired, revoked, used, self-authored, full-couple, and already-connected cases.
- Insert the second membership, consume the invitation, and emit the connected event.

### Exit gate

- Exactly two accounts can connect once.
- Simultaneous acceptance attempts cannot create a third membership.
- No third account can discover or join the couple.

## 5. Deploy protected room lifecycle operations

### Operations

- `create_date_room(options jsonb)` — derive the caller's couple, return a resumable room or create one with a server-generated code.
- `join_date_room(room_code text)` — allow only a current member of the owning couple.
- `leave_date_room(room_id uuid)` — mark the participant as left without destroying the partner's state.
- `rotate_room_code(room_id uuid)` — invalidate the old code while preserving room and activity history.

Every operation must validate membership, status, expiration, and allowed transition. A room code is a locator, never authorization.

### Live verification

- Either partner can create or resume the intended active room.
- Simultaneous creation follows one deterministic result.
- A stranger with the correct code is denied.
- Rotation invalidates the old code immediately.
- Expired and completed rooms reject further privileged transitions.

## 6. Configure Realtime and Presence

- Authorize channels using couple and room membership.
- Use Presence only for ephemeral state such as online, ready, choosing, writing, drawing, and device identity.
- Deduplicate multiple tabs into one user-level status.
- Keep hidden answers and sensitive data out of Presence and broadcasts.
- Keep durable actions in Postgres snapshots and events.
- Publish only the tables and changes required by the application.
- Define reconnect behavior: load snapshot, request events after the last cursor, apply in sequence, and resubscribe.

### Live verification

- Two devices converge on the same room and activity state.
- Disconnect is detected and recovery replays missed events.
- Duplicate notifications do not duplicate actions.
- Out-of-order delivery waits for or requests the missing sequence.
- Browser sleep and subscription reconnect do not lose progress.

## 7. Deploy the durable activity framework

### Operations

- `start_activity(...)` validates membership, lobby state, and activity type, then creates the versioned initial snapshot.
- `append_activity_event(...)` validates the event, payload, transition, and expected revision; assigns the next sequence; and updates the snapshot.
- Add snapshot/replay retrieval for reconnecting clients.
- `complete_activity(...)` validates completion, finalizes the result, and optionally prepares a keepsake.

### Exit gate

- The reference activity survives refresh, temporary offline use, duplicate delivery, out-of-order notification, and reconnect.
- Timers are based on server time rather than independent client countdowns.

## 8. Deploy private answer and synchronized reveal operations

- `lock_private_answer(...)` validates and stores only the caller's answer.
- Prevent direct partner reads before reveal.
- `reveal_private_answers(...)` succeeds only after both answers are locked and the round is valid.
- Emit one common reveal event or timestamp for both clients.
- Make reveal idempotent so retries cannot create inconsistent state.

### Live verification

- Partner A can see only A's answer before reveal.
- Partner B can see only B's answer before reveal.
- Direct queries cannot bypass the rule.
- Reveal fails before both lock and succeeds exactly once afterward.
- Refresh preserves sealed and revealed state correctly.

## 9. Configure private Storage and keepsake operations

- Create private buckets for activity and keepsake media.
- Scope object paths to couple, session, and asset IDs.
- Use signed URLs or authenticated retrieval.
- Validate file type, file size, image dimensions, ownership, and quota.
- Use a staged upload/finalization flow so interrupted uploads do not create permanent broken records.
- Add controlled delete behavior for records and associated objects.

### Live verification

- Only the connected couple can list or retrieve its keepsakes.
- Upload paths cannot target another couple.
- Invalid or oversized uploads fail safely.
- Delete removes or schedules removal of the associated private object.

## 10. Deploy Cupidot Edge Function safely

- Require authentication and verify couple/room/session membership.
- Check current AI consent before every request.
- Build the model payload on the server from an allow-list.
- Exclude hidden answers, images, emails, tokens, precise location, invite codes, and room codes.
- Validate outputs and fall back to curated content on malformed, unsafe, rate-limited, or unavailable responses.
- Restrict CORS to approved local, preview, and production origins.
- Store secrets only in Supabase project secrets.
- Log operational status and latency, never intimate content.

### Live verification

- Consent off produces zero Gemini requests.
- Consent on works only for authenticated authorized members.
- Provider failure does not interrupt the activity.
- No forbidden data appears in request logs or error logs.

## 11. Configure lifecycle, privacy, and observability

### Retention

- Presence remains ephemeral.
- Expired unfinished events use short retention.
- Completed event streams are compacted or removed after durable snapshot/keepsake creation.
- Private answers follow the chosen session retention policy unless deliberately saved.
- Raw invite token material is removed; minimal audit status may remain.
- Keepsakes remain until controlled deletion or account lifecycle processing.

### Observability

Record only operation name, normalized result, duration, anonymous correlation ID, activity type, event gaps, reconnect count, channel status, and Edge Function latency/status.

Do not record raw answers, personal question history, codes, tokens, emails, image contents, or precise location.

### Product decisions required before destructive lifecycle work

- Unilateral or mutual couple separation.
- Ownership of jointly created keepsakes.
- Recovery window after separation or deletion.
- Partner access to shared records after one account is deleted.
- Export behavior and pending export handling.

Do not deploy destructive separation or deletion operations until these decisions are encoded and tested.

## 12. Production configuration and final live verification

- Deploy all migrations and Edge Functions to the live Supabase project.
- Configure the production domain in Supabase site URLs and redirect URLs.
- Configure Google JavaScript origins, redirect URIs, branding URLs, and audience status.
- Restrict Edge Function CORS to approved origins.
- Confirm Realtime publication, channel authorization, Storage policies, secrets, quotas, retention jobs, and scheduled cleanup.
- Run adversarial RLS tests and a complete two-account, two-device production journey.
- Verify poor-network recovery, mobile behavior, accessibility, and monitoring.
- Prepare a forward-repair plan and safe application rollback procedure.

### Supabase completion evidence

For every backend phase, record:

- Migration version deployed.
- Edge Function version deployed, when applicable.
- Live project/environment tested.
- Positive test accounts used.
- Cross-account negative tests passed.
- Any remaining dashboard, OAuth, Storage, or provider configuration.

The Supabase track is not complete until the live environment passes these checks.

---

# Combined Delivery Order

Follow this sequence so frontend work and live backend work stay aligned:

1. **Local baseline and contracts**
2. **Local invite and Our Space UI**
3. **Supabase authentication, core tables, and RLS**
4. **Supabase couple lifecycle RPCs**
5. **Connect and verify the two-account invitation journey**
6. **Local room/lobby architecture**
7. **Supabase protected room lifecycle and Realtime authorization**
8. **Verify two-device lobby, Presence, disconnect, and reconnect**
9. **Local shared activity adapters and recovery hooks**
10. **Supabase snapshots, ordered events, revisions, and replay**
11. **Local Secret Until Together UI**
12. **Supabase private-answer and reveal enforcement**
13. **Convert and verify Quiz**
14. **Convert and verify Draw Together**
15. **Convert the remaining activity catalog**
16. **Local keepsake, capsule, and constellation UI**
17. **Supabase private Storage and keepsake lifecycle**
18. **Local rituals, Timezone Bridge, and Cupidot UX**
19. **Supabase Cupidot Edge Function, consent, CORS, and secrets**
20. **Production configuration and full live verification**

---

# Definition of Done

The connected-couple and realtime-room system is complete only when:

- Two independent Google accounts connect through one single-use invitation.
- The database rejects a third member and all cross-couple access.
- Either partner can create or resume a couple-owned room.
- A room code alone cannot authorize a stranger.
- Presence accurately represents both users across disconnect and reconnect.
- The server owns shared state, timing, ordering, and critical transitions.
- Missing, duplicate, or out-of-order events do not desynchronize clients.
- A partner cannot retrieve the other person's private answer before reveal.
- Quiz and Draw pass the full two-device recovery matrix.
- Every activity advertised as realtime uses the shared protected framework.
- Completed activities can create private, retrievable, deletable keepsakes.
- AI consent off produces zero Gemini traffic.
- No secret appears in the frontend bundle, repository, or content logs.
- Production OAuth, Supabase URLs, CORS, RLS, Storage, Realtime, and Edge Functions are deployed and verified.
- Accessibility, responsive layouts, poor-network behavior, privacy, and security checks pass.

The final experience should feel simple: both partners open the same private space, see each other arrive, become ready, share the same moment, recover smoothly from interruptions, and choose whether to keep the memory afterward.
