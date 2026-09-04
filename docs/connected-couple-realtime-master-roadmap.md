# Dearly Us — Connected Couple & Realtime Rooms Master Roadmap

> Product, experience, architecture, security, delivery, and verification plan for turning Dearly Us into a persistent private world for two people.

**Document status:** Proposed implementation roadmap

**Primary platform:** Responsive web application

**Backend:** Supabase Auth, Postgres, Realtime, Storage, and Edge Functions

**Identity provider:** Google only

**Current environment:** Localhost development with the live Supabase project
**Production-domain work:** Deferred until a real domain is deployed

---

## 1. Executive summary

Dearly Us should not behave like unrelated games that happen to accept the same room code. It should behave like a private, persistent place shared by exactly two authenticated people.

The target system has four connected layers:

```text
Individual Google accounts
          ↓
Permanent private couple space
          ↓
Temporary realtime date-night session
          ↓
Durable memories, progress, rituals, and relationship history
```

The permanent couple space establishes who the two people are. A date-night room establishes when they are together. An activity session establishes what they are doing. Keepsakes preserve only the moments they choose to keep.

The final experience should feel simple:

1. Sign in with Google once.
2. Connect your person once.
3. Return to Our Space from any supported device.
4. Start or resume a date night with one action.
5. See the partner arrive and remain synchronized.
6. Recover automatically from refreshes and temporary disconnections.
7. Save meaningful moments without exposing private data.

The complexity belongs in the backend and shared client infrastructure, not in the user journey.

---

## 2. Product principles

Every decision in this roadmap should satisfy these principles.

### 2.1 Private by default

- Every personal, couple, room, answer, event, and keepsake record is inaccessible unless an authenticated user is explicitly authorized.
- Knowing a room code is not sufficient authorization.
- Invite previews reveal the minimum information necessary.
- AI is opt-in and never receives camera streams, photographs, access tokens, invite codes, or hidden answers.

### 2.2 Designed for exactly two people

- A couple has a maximum of two active members.
- State transitions consider two participants rather than generic multiplayer complexity.
- “Both ready,” “both locked,” and “reveal together” are first-class concepts.
- The interface celebrates connection without exposing one partner’s private choice prematurely.

### 2.3 Server-authoritative, locally responsive

- Supabase owns durable truth.
- The UI may respond optimistically for safe, reversible interactions.
- Important state transitions require a server acknowledgment.
- Timers use server timestamps instead of device clocks.
- Refreshing a tab never becomes a destructive action.

### 2.4 Graceful degradation

- A weak connection should show reconnection—not silently desynchronize the couple.
- AI failure falls back to local prompts.
- Presence failure must not destroy session state.
- Unsupported media features should not block the rest of a date night.

### 2.5 Emotional clarity

- The product should always communicate whether the partner is invited, connected, online, ready, choosing, disconnected, or finished.
- Waiting states should feel intentional and warm.
- Errors should explain the next action without revealing security-sensitive details.

### 2.6 Consent and boundaries

- AI consent is explicit and reversible.
- Dares and intimate prompts include comfort controls.
- A partner can skip or soften a prompt without being shamed.
- Saving a private answer or media artifact is deliberate.

---

## 3. Current-state assessment

### 3.1 Already implemented

- Google-only authentication UI.
- Supabase-backed Google sessions.
- Automatic creation of a profile record after authentication.
- First-time profile onboarding.
- Permanent couple-space creation.
- Expiring couple invitations.
- Joining a couple through a code.
- Maximum-two-membership database direction.
- Shared active room code stored on the couple.
- Basic persistent room events.
- Postgres Realtime subscription foundation.
- Initial realtime wiring in Quiz and Draw.
- Supabase Edge Function for Gemini.
- Hidden Gemini API key.
- Explicit AI consent control.
- Couple-scoped keepsake shelf foundation.
- Privacy disclosure covering Google authentication and AI processing.

### 3.2 Partially implemented

- Room creation and joining exist, but the current client attempts to create a room after a failed join.
- `partnerOnline` is inferred from incoming events rather than real Presence state.
- Realtime behavior is implemented in only part of the activity catalog.
- Event history exists, but ordered replay, sequence enforcement, and snapshot recovery need strengthening.
- Keepsakes can be listed, but activity completion is not consistently connected to keepsake creation.
- The profile page exposes the active room, but it is not yet a full date-night control center.

### 3.3 Missing

- Dedicated invite-acceptance route and confirmation experience.
- Couple-authorized room lifecycle.
- Date Night Lobby.
- Supabase Presence.
- Shared activity-session model.
- Private lock-and-reveal answers.
- Reliable reconnect and resume.
- Universal activity adapters.
- Storage-backed drawings and photostrips.
- Relationship milestones and rituals.
- Production-domain OAuth, CORS, and branding configuration.
- Full two-account, two-device security and synchronization test suite.

---

## 4. Scope

### 4.1 In scope

- Google-only account creation and sign-in.
- Individual profile onboarding and editing.
- One private couple relationship per account.
- Invite, accept, expire, revoke, and regenerate flows.
- Protected date-night rooms owned by a couple.
- Two-person presence, readiness, and activity state.
- Durable event synchronization and recovery.
- Private answers and coordinated reveals.
- Realtime conversion of supported activities.
- Shared keepsakes and milestones.
- Consent-aware Cupidot integration.
- Mobile, tablet, and desktop web behavior.
- Security, privacy, observability, and production rollout.

### 4.2 Explicitly out of scope for the first production version

- Group or friend rooms.
- Anonymous access to private rooms.
- Email/password authentication.
- Live camera-stream transmission.
- Public couple profiles.
- Public searchable rooms.
- Unmoderated partner-to-partner file uploads.
- Native iOS or Android applications.
- End-to-end encrypted messaging.
- Payments or subscriptions.
- Clinical, therapeutic, or relationship-diagnostic advice.

---

## 5. Core domain model

The implementation must keep these concepts separate.

### 5.1 User

An authenticated Google identity represented by Supabase Auth.

Properties:

- Stable Supabase user ID.
- Google-sourced email, display name, and avatar.
- Editable Dearly Us display name, city, and timezone.
- Onboarding status.
- Account lifecycle status.

### 5.2 Couple

A permanent private relationship space owned jointly by exactly two users.

Properties:

- Stable couple ID.
- Display name.
- Creation time.
- Two membership slots.
- Shared preferences.
- Current room reference.
- Relationship and milestone metadata.

### 5.3 Couple invitation

A temporary authorization to claim the second membership slot.

Properties:

- Single-use token.
- Creator.
- Couple.
- Expiration.
- Status.
- Accepted account and acceptance time.
- Revocation time.

### 5.4 Room

A temporary live gathering owned by a couple.

Properties:

- Human-readable room code.
- Couple ownership.
- Open, active, completed, expired, or cancelled status.
- Host and participants.
- Creation, activity, and expiration times.
- Current activity-session reference.

### 5.5 Activity session

The server-authoritative state for one activity played in a room.

Properties:

- Activity type and schema version.
- State machine status.
- Current round.
- Shared state snapshot.
- Revision and event cursor.
- Start, pause, resume, and completion timestamps.
- Result summary.

### 5.6 Event

An ordered record of a meaningful action within an activity session.

Properties:

- Globally unique ID.
- Sequence number.
- Sender.
- Validated event type.
- Safe JSON payload.
- Server timestamp.
- Client timestamp for diagnostic comparison only.

### 5.7 Presence

Ephemeral connection state transmitted through Supabase Realtime Presence.

Presence is not permanent history. It represents what is happening now.

### 5.8 Keepsake

A durable private memory deliberately created from a completed or saved moment.

---

## 6. Target user journeys

### 6.1 First partner creates Our Space

1. User signs in with Google.
2. Supabase creates or updates the matching profile.
3. User completes name, city, and timezone onboarding.
4. User selects **Create Our Space**.
5. Server verifies that the user is not already in a couple.
6. Server creates the couple and owner membership in one transaction.
7. Server creates a single-use invitation.
8. Profile dashboard shows the waiting state.
9. User can copy a private link, code, or QR representation.
10. Invitation status updates when accepted, expired, or revoked.

### 6.2 Second partner accepts an invitation

1. Partner opens `/invite/[token]`.
2. The public preview validates only that the token is structurally valid.
3. If signed out, partner signs in with Google and returns to the exact invitation.
4. Server verifies the invitation after authentication.
5. UI shows inviter name, couple-space name, expiration, and a clear confirmation action.
6. Partner confirms joining.
7. A transaction locks the invite and couple membership rows.
8. Server checks that the invitation is active, not self-authored, and the couple still has one free slot.
9. Server inserts the partner membership and consumes the invitation.
10. Both profiles receive a realtime “connected” update.
11. Both users enter the connected Our Space state.

### 6.3 Couple starts a date night

1. Either partner opens Our Space.
2. They select **Start date night**.
3. Server verifies couple membership.
4. Server returns an active room if a resumable one exists; otherwise it creates a new room.
5. The initiating partner enters the Date Night Lobby.
6. The partner receives the share link or sees the active session on their dashboard.
7. Partner joins and Presence shows both online.
8. Both choose ready.
9. The room owner selects an activity or uses **Surprise us**.
10. Server starts the activity session.
11. Both clients navigate from the same server state.

### 6.4 Interrupted date night

1. One participant loses connectivity.
2. Presence reports the participant missing.
3. The other client shows **Reconnecting your person…** without mutating the activity.
4. The disconnected client reconnects and requests the latest snapshot plus events after its last cursor.
5. Events replay in sequence.
6. The client calculates any timer from the server start time.
7. Both clients return to the same round and state.
8. If the room expired, both receive the same final status and safe exit path.

---

## 7. Things to add

### 7.1 Couple invitation experience

Add:

- `/invite/[token]` route.
- Invitation preview card.
- Signed-out continuation through Google OAuth.
- Post-login return-path persistence.
- Accept confirmation.
- Expired invitation state.
- Already-used state.
- Revoked state.
- Couple-full state.
- Self-invite error.
- Already-connected error.
- Regenerate and revoke controls for the inviter.
- Copy-link and copy-code controls.
- QR code generated locally from the invite URL.
- Realtime invitation acceptance feedback.

### 7.2 Date Night Lobby

Add:

- Both avatars with an animated visual connection.
- Local time under each person.
- Presence state.
- Ready state.
- Mood selector: playful, romantic, deep, cozy, spontaneous.
- Available-time selector: 15, 30, 45, 60, or 90 minutes.
- Activity picker.
- **Surprise us** recommendation.
- AI consent status and explanation.
- Shared ambient sound selection.
- Start control.
- Synchronized countdown.
- Leave-room action.
- Resume previous activity prompt.

### 7.3 Together Pulse

A compact shared status component used across the dashboard, lobby, and activities.

States:

- Waiting for your person.
- Invited.
- Both connected.
- Partner online.
- Partner choosing.
- Partner writing.
- Partner drawing.
- Partner locked in.
- Ready to reveal.
- Reconnecting.
- Session resumed.
- Keepsake saved.

Privacy rule: the pulse may reveal progress, never the partner’s hidden content.

### 7.4 Secret Until Together

A reusable answer interaction:

```text
Draft locally
  → submit privately
  → server seals answer
  → partner sees only “locked”
  → both answers become locked
  → reveal action becomes valid
  → server returns both answers
  → both clients reveal from the same event
```

The database—not the UI—must enforce the reveal rule.

### 7.5 Relationship Constellation

A visual history formed from important shared moments.

Possible stars:

- Couple connected.
- First date night.
- First perfect quiz match.
- First shared drawing.
- First photostrip.
- First letter.
- Ten date nights.
- Thirty-day ritual streak.
- Birthday or anniversary memory.

Each star opens a milestone and, when available, its keepsake.

### 7.6 Timezone Bridge

Add:

- Both local times.
- Date boundaries and day names.
- Overlapping evening-time suggestions.
- “Good morning there / good evening here” copy.
- Duration-aware activity recommendations.
- Optional scheduled date card.
- Optional reminder integration in a later release.

### 7.7 Shared rituals

Add user-created or preset recurring rituals:

- Sunday check-in.
- Daily gratitude.
- One-question bedtime ritual.
- Monthly memory recap.
- Long-distance countdown.
- Anniversary capsule.

Rituals must remain optional and avoid guilt-oriented streak language.

---

## 8. Things to modify

### 8.1 Replace permissive room creation

Current concern:

- The existing client tries `join_room_by_code` and then attempts `create_room` if joining fails.

Target behavior:

- A join failure remains a join failure.
- Only `create_date_room()` may create a room.
- The RPC derives the couple ID from `auth.uid()`.
- The client cannot choose or spoof ownership.
- Room codes are generated on the server.
- Only the two current couple members can join.
- Room status and expiration are checked on every privileged transition.

### 8.2 Replace inferred online status

Current concern:

- Receiving an event marks the partner online but cannot reliably detect disconnects.

Target behavior:

- Supabase Presence owns online state.
- Each participant tracks one presence record per active device.
- Multiple tabs are deduplicated into a user-level status.
- Presence contains only non-sensitive metadata.
- Durable actions remain in Postgres events.

### 8.3 Split the room hook

Replace the broad `useRoomSync` responsibilities with:

- `useCoupleSpace()` — membership and couple profile.
- `useActiveRoom()` — create, resume, leave, and expire room.
- `useRoomPresence()` — connection and ready state.
- `useRealtimeEvents()` — validated subscriptions and event cursors.
- `useActivitySession()` — snapshot and transition state.
- `usePrivateAnswers()` — submit, lock, and reveal.
- `useSessionRecovery()` — reconnect and replay.
- `useKeepsakeWriter()` — intentional memory persistence.

### 8.4 Upgrade the profile page into Our Space

Add dashboard modules for:

- Account and profile details.
- Partner connection state.
- Current local times.
- Active room.
- Continue-session action.
- Start-date-night action.
- Invitation management.
- Recent keepsakes.
- Relationship constellation preview.
- Planned ritual.
- Shared preferences.
- AI consent.
- Export and deletion controls.

### 8.5 Make navigation session-aware

Signed out:

- Sign in with Google.

Signed in and unpaired:

- My Space.
- Connect your person.

Paired but not in a room:

- Our Space.
- Partner status.
- Start date night.

Inside a live room:

- Current activity.
- Partner state.
- Return to lobby.
- Leave activity.

### 8.6 Standardize activity integration

Every realtime activity will implement a shared adapter contract:

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

The exact implementation may differ, but the behavioral contract must remain consistent.

---

## 9. Things to invent for Dearly Us

### 9.1 Connection Ribbon

A persistent visual thread joining both identities across the product.

- Soft pink represents one partner.
- Soft blue represents the other.
- The colors meet when both are connected.
- The ribbon pulses when both become ready.
- It becomes subdued during reconnecting.
- It seals into a keepsake mark when an activity completes.

### 9.2 Reveal Together

A branded synchronized moment rather than a generic result screen.

- Each answer appears sealed.
- Both seals become available only after the server confirms readiness.
- Either partner may initiate the reveal, depending on the activity rules.
- A server event schedules a common reveal timestamp.
- Both clients animate at the same moment.
- Reactions appear after content is visible.

### 9.3 Date Night Capsule

At the end of a session, both partners see a lightweight capsule:

- Activities completed.
- Favourite answer or moment selected by each person.
- Shared drawing or photostrip.
- Warm non-diagnostic Cupidot summary when consented.
- Optional private note.
- Save or discard controls.

### 9.4 Gentle Skip

A signature safety interaction:

- Either person can request a softer or different prompt.
- No reason is required.
- The partner sees a neutral transition rather than who objected.
- The event history records only that the prompt changed.
- Cupidot receives no sensitive explanation.

### 9.5 Memory Weather

A non-competitive visual mood representing recent shared activity:

- Calm, sparkling, cozy, playful, reflective, or adventurous.
- Derived from explicitly selected session moods—not inferred psychology.
- Used only to decorate Our Space and recommend activities.

---

## 10. Proposed Supabase database architecture

### 10.1 `profiles`

Purpose: one application profile per authenticated Google user.

Key columns:

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Primary key and FK to `auth.users` |
| `display_name` | `text` | Required after onboarding |
| `city` | `text` | Optional and user-controlled |
| `timezone` | `text` | IANA timezone identifier |
| `avatar_url` | `text` | Google or approved application avatar |
| `onboarding_completed` | `boolean` | Defaults to false |
| `account_status` | `text` | active, deletion_requested, deleted |
| `created_at` | `timestamptz` | Server-generated |
| `updated_at` | `timestamptz` | Server-generated |

### 10.2 `couples`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Shared display name |
| `created_by` | `uuid` | Original creator |
| `active_room_id` | `uuid` | Nullable current room reference |
| `status` | `text` | active, separation_pending, archived |
| `created_at` | `timestamptz` | Server-generated |
| `updated_at` | `timestamptz` | Server-generated |

### 10.3 `couple_members`

| Column | Type | Rule |
|---|---|---|
| `couple_id` | `uuid` | Couple FK |
| `user_id` | `uuid` | Profile FK and globally unique active membership |
| `role` | `text` | owner or partner for lifecycle purposes only |
| `joined_at` | `timestamptz` | Server-generated |
| `left_at` | `timestamptz` | Nullable lifecycle marker |

Constraints:

- Unique active membership per user.
- Maximum two active members per couple, enforced transactionally.
- A role must never expand data visibility beyond membership.

### 10.4 `couple_invites`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Primary key |
| `couple_id` | `uuid` | Owning couple |
| `token_hash` | `text` | Preferred production storage |
| `display_code` | `text` | Optional readable code |
| `created_by` | `uuid` | Inviter |
| `expires_at` | `timestamptz` | Required |
| `accepted_at` | `timestamptz` | Nullable |
| `accepted_by` | `uuid` | Nullable |
| `revoked_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Server-generated |

Status is derived in this priority order: revoked, accepted, expired, pending.

### 10.5 `rooms`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Primary key |
| `couple_id` | `uuid` | Required owner |
| `code` | `text` | Server-generated and unique among active rooms |
| `status` | `text` | lobby, active, paused, completed, expired, cancelled |
| `created_by` | `uuid` | Couple member |
| `current_session_id` | `uuid` | Nullable |
| `expires_at` | `timestamptz` | Required |
| `last_activity_at` | `timestamptz` | Used for lifecycle cleanup |
| `created_at` | `timestamptz` | Server-generated |
| `completed_at` | `timestamptz` | Nullable |

### 10.6 `room_members`

| Column | Type | Rule |
|---|---|---|
| `room_id` | `uuid` | Room FK |
| `user_id` | `uuid` | Must be a current couple member |
| `joined_at` | `timestamptz` | First join |
| `last_seen_at` | `timestamptz` | Coarse durable recovery aid |
| `ready_at` | `timestamptz` | Nullable lobby readiness |
| `left_at` | `timestamptz` | Nullable |

Actual online state remains in Presence.

### 10.7 `activity_sessions`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Primary key |
| `room_id` | `uuid` | Owning room |
| `activity_type` | `text` | Validated registry value |
| `schema_version` | `integer` | Snapshot/event compatibility |
| `status` | `text` | preparing, active, waiting, revealing, completed, abandoned |
| `round_number` | `integer` | Non-negative |
| `snapshot` | `jsonb` | Validated shared state only |
| `revision` | `bigint` | Optimistic-concurrency version |
| `last_event_sequence` | `bigint` | Replay cursor |
| `started_at` | `timestamptz` | Nullable until started |
| `completed_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Server-generated |

### 10.8 `room_events`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Client-generated idempotency key or server UUID |
| `room_id` | `uuid` | Required |
| `session_id` | `uuid` | Required for activity events |
| `sequence` | `bigint` | Server-assigned and unique per session |
| `sender_id` | `uuid` | Derived from authentication |
| `event_type` | `text` | Allow-listed |
| `payload` | `jsonb` | Size-limited and validated |
| `client_created_at` | `timestamptz` | Diagnostic only |
| `created_at` | `timestamptz` | Authoritative server time |

Indexes:

- Unique `(session_id, sequence)`.
- Unique `(session_id, id)`.
- `(room_id, created_at)`.
- `(session_id, created_at)`.

### 10.9 `private_answers`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Primary key |
| `session_id` | `uuid` | Required |
| `round_number` | `integer` | Required |
| `user_id` | `uuid` | Required |
| `answer` | `jsonb` | Validated by activity type |
| `locked_at` | `timestamptz` | Nullable until sealed |
| `revealed_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Server-generated |

Constraint: unique `(session_id, round_number, user_id)`.

Direct partner reads are forbidden before the server-authorized reveal.

### 10.10 `keepsakes`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | Primary key |
| `couple_id` | `uuid` | Required owner |
| `session_id` | `uuid` | Optional source |
| `kind` | `text` | Allow-listed memory type |
| `title` | `text` | Required |
| `caption` | `text` | Optional |
| `preview_url` | `text` | Optional signed/private asset reference |
| `activity_path` | `text` | Optional safe internal route |
| `metadata` | `jsonb` | Validated and size-limited |
| `created_by` | `uuid` | Required |
| `created_at` | `timestamptz` | Server-generated |

### 10.11 `relationship_milestones`

Stores earned or manually recorded milestones. It must never infer sensitive relationship health.

### 10.12 `shared_preferences`

Stores couple-controlled defaults such as preferred mood, reduced motion, ambient audio opt-in, and keepsake behavior.

---

## 11. Row-level security matrix

The core authorization predicate is:

> The authenticated user must be an active member of the couple that owns the requested resource.

| Resource | Read | Insert | Update | Delete |
|---|---|---|---|---|
| Own profile | Self | Trigger/self | Self | Controlled account flow |
| Partner profile | Connected partner only | Never | Never | Never |
| Couple | Active members | RPC only | RPC only | Controlled lifecycle RPC |
| Couple members | Same couple | RPC only | RPC only | Controlled lifecycle RPC |
| Invites | Inviter/couple members | RPC only | RPC only | Revoke RPC only |
| Rooms | Owning couple members | RPC only | RPC only | Expire/cancel RPC only |
| Room members | Owning couple members | RPC only | RPC only | Leave RPC only |
| Activity sessions | Owning couple members | RPC only | RPC only | Never from client |
| Room events | Owning couple members | RPC or validated insert | Never | Retention job only |
| Private answer | Owner before reveal; both after authorized reveal | RPC only | RPC only before lock | Retention job only |
| Keepsakes | Owning couple members | RPC only | Owning couple members | Controlled delete RPC |
| Storage object | Owning couple members | Scoped upload policy | Scoped update | Scoped delete |

Security requirements:

- All `SECURITY DEFINER` functions set a fixed `search_path`.
- Execute permission is revoked from `public` and `anon`.
- RPCs derive user identity from `auth.uid()`.
- Client parameters never determine ownership.
- Queries do not leak whether another couple, room, invite, or answer exists.
- Rate-sensitive functions record timestamps and enforce server-side limits.

---

## 12. Protected RPC contracts

### 12.1 Couple lifecycle

#### `create_couple_space(space_name text)`

Validates:

- Authenticated user.
- Completed profile.
- No existing active couple membership.

Performs atomically:

- Create couple.
- Create owner membership.
- Create initial invite.
- Return sanitized couple-space view.

#### `regenerate_couple_invite()`

Validates:

- Caller belongs to the couple.
- Second member has not joined.
- Regeneration rate limit.

Performs:

- Revoke or expire prior active invites.
- Create a new single-use invite.
- Return the sanitized invitation.

#### `accept_couple_invite(token text)`

Validates inside a transaction:

- Caller authenticated.
- Invite active and unexpired.
- Caller is not creator.
- Caller has no active couple.
- Couple has one active member.

Performs:

- Lock invite and membership scope.
- Insert partner membership.
- Mark invite accepted.
- Emit couple-connected event.

### 12.2 Room lifecycle

#### `create_date_room(options jsonb)`

- Uses caller’s couple.
- Returns an existing resumable room when allowed.
- Otherwise creates a new server-coded room.
- Inserts both authorized room-member slots or derives access from couple membership.
- Sets an expiration.

#### `join_date_room(room_code text)`

- Verifies couple membership.
- Rejects codes belonging to another couple.
- Rejects expired and completed rooms.
- Records durable join metadata.

#### `leave_date_room(room_id uuid)`

- Marks the participant as left.
- Does not destroy the room for the other partner.
- May pause or expire the room according to lifecycle rules.

#### `rotate_room_code(room_id uuid)`

- Invalidates the previous code immediately.
- Preserves room and session history.
- Returns only the new sanitized room view.

### 12.3 Activity lifecycle

#### `start_activity(room_id uuid, activity_type text, options jsonb)`

- Validates room membership and lobby state.
- Validates the activity registry.
- Creates a versioned initial snapshot.
- Emits `activity_started`.

#### `append_activity_event(session_id uuid, event_id uuid, event_type text, payload jsonb, expected_revision bigint)`

- Validates membership, event type, payload, state transition, and revision.
- Assigns the next sequence.
- Updates the snapshot when appropriate.
- Returns the accepted event and new revision.

#### `lock_private_answer(session_id uuid, round_number integer, answer jsonb)`

- Allows only the caller’s answer.
- Rejects invalid rounds and already-revealed states.
- Applies activity-specific size and shape validation.
- Emits only a non-sensitive lock-status event.

#### `reveal_private_answers(session_id uuid, round_number integer)`

- Requires both answers to be locked.
- Marks both revealed atomically.
- Returns both answers to both authorized members.
- Emits the synchronized reveal event.

#### `complete_activity(session_id uuid)`

- Validates completion state.
- Produces a safe result summary.
- Closes the session.
- Optionally creates a keepsake draft.

---

## 13. Realtime architecture

### 13.1 Channel structure

Recommended channels:

```text
couple:{coupleId}           membership and dashboard updates
room:{roomId}:presence     ephemeral online and ready state
room:{roomId}:events       durable activity event notifications
session:{sessionId}        focused activity updates
```

The channel name is not an authorization mechanism. Database and Realtime policies remain authoritative.

### 13.2 Presence payload

Allowed fields:

```json
{
  "userId": "uuid",
  "deviceId": "ephemeral-id",
  "roomId": "uuid",
  "activityType": "quiz",
  "status": "ready",
  "interaction": "choosing",
  "joinedAt": "server-or-adjusted-time"
}
```

Forbidden fields:

- Email address.
- Access or refresh token.
- Answer content.
- Invite token.
- Precise location.
- Camera or microphone content.

### 13.3 Event delivery lifecycle

1. Client creates an idempotency ID.
2. Client submits an event through a validated RPC.
3. Server checks authorization and state transition.
4. Server assigns sequence and timestamp.
5. Database transaction updates event log and snapshot.
6. Realtime announces the committed row.
7. Clients ignore already-seen IDs.
8. Clients apply only the next valid sequence.
9. A gap triggers catch-up from the last known cursor.
10. Snapshot reload occurs if replay cannot safely close the gap.

### 13.4 Reconnection algorithm

Client stores only non-sensitive recovery identifiers:

- Room ID.
- Session ID.
- Last applied sequence.
- Snapshot revision.

On reconnect:

1. Refresh authentication if necessary.
2. Validate room membership.
3. Fetch latest snapshot metadata.
4. Fetch missing events after the local cursor.
5. Validate continuous sequence.
6. Replay events.
7. Replace with the latest snapshot if the sequence is incomplete.
8. Rejoin Presence.
9. Report synchronized state.

### 13.5 Timer synchronization

- Server stores `starts_at` and optional `duration_ms`.
- Clients calculate remaining time from the server timestamp offset.
- Pausing creates a durable transition.
- Returning clients derive the current timer rather than restarting it.
- The completion transition is accepted once using revision control.

---

## 14. State machines

### 14.1 Invitation

```text
pending ──accept──> accepted
   │
   ├──revoke──────> revoked
   │
   └──time────────> expired
```

Terminal states cannot return to pending.

### 14.2 Room

```text
lobby ──both ready/start──> active
  │                           │
  ├──cancel────────────────> cancelled
  ├──timeout───────────────> expired
  │                           ├──pause──> paused──resume──> active
  │                           ├──finish─> completed
  │                           └──timeout> expired
```

### 14.3 Private-answer round

```text
collecting
   ├──A locked──────────────> waiting_for_B
   ├──B locked──────────────> waiting_for_A
   └──both locked───────────> ready_to_reveal
                                  │
                                  └──reveal──> revealed──> completed
```

### 14.4 Connection state

```text
connecting → synchronized → reconnecting → synchronized
      │              │             │
      └──failed       └──left       └──expired
```

Connection state must never independently change durable activity state.

---

## 15. Activity-by-activity realtime plan

### 15.1 Quiz

Shared state:

- Pack.
- Question ID.
- Round number.
- Match count.
- Reveal status.
- Adaptive queue metadata.

Private state:

- Each selected option before reveal.

Events:

- `quiz_started`
- `quiz_answer_locked`
- `quiz_ready_to_reveal`
- `quiz_answers_revealed`
- `quiz_round_advanced`
- `quiz_completed`

Keepsake:

- Compatibility card with selected highlights and score.

### 15.2 Draw Together

Shared state:

- Canvas dimensions.
- Stroke cursor.
- Tool state where shared.
- Completion state.

Events:

- `draw_stroke_batch`
- `draw_cursor`
- `draw_undo`
- `draw_clear_requested`
- `draw_clear_confirmed`
- `draw_completed`

Reliability:

- Batch points approximately every 40–80 ms.
- Compress coordinates relative to the canvas.
- Save periodic snapshot checkpoints.
- Use transient broadcast for cursor motion and durable events for strokes.

Keepsake:

- Final rendered image plus session metadata.

### 15.3 Cards

Shared state:

- Deck version and deterministic shuffle seed.
- Current card.
- Favourite cards.
- Reveal state.

Private state:

- Written response before reveal.

Keepsake:

- Selected card and mutually saved responses.

### 15.4 Host mode

Shared state:

- Scenario list.
- Current scenario.
- Mood.
- Cupidot commentary after reveal.

Private state:

- Each choice.

AI rule:

- Send only revealed answers after consent.
- Store no Gemini credential or raw provider response in the browser.

### 15.5 Debate and Court

Shared state:

- Topic.
- Assigned sides or roles.
- Phase.
- Server-based timer.
- Evidence cards.
- Verdict.

Keepsake:

- Thermal-style verdict receipt.

### 15.6 Dare

Shared state:

- Dare ID.
- Comfort level.
- Accept, skip, or replace votes.
- Completion state.

Safety:

- Either partner can invoke Gentle Skip.
- No public indication of which partner requested it.
- Never generate coercive or unsafe dares.

### 15.7 Match

Shared state:

- Question sequence.
- Category score.
- Reveal progress.

Private state:

- Each answer before reveal.

Keepsake:

- Match portrait with category highlights.

### 15.8 Photobooth

Shared state:

- Ready state.
- Shot number.
- Countdown timestamp.
- Layout selection.
- Completion state.

Privacy:

- Camera frames remain local.
- Realtime transmits readiness and timing only.
- Each device captures locally.
- Upload occurs only after explicit save.
- A shared strip may combine approved captures only through an explicit workflow.

### 15.9 Passport and Scrapbook

- Couple-owned entries.
- Shared captions.
- Partner reactions.
- Date and milestone stamps.
- References to source keepsakes.
- Conflict-safe editing through revision checks.

### 15.10 Ambient audio and reactions

- Audio preset changes are transient by default.
- Reactions use ephemeral broadcast unless saved as part of a capsule.
- No automatic audio playback before user interaction.
- Reduced-motion and muted preferences remain device-respectful.

---

## 16. Keepsake and Storage design

### 16.1 Buckets

Proposed private buckets:

- `couple-keepsakes`
- `couple-drawings`
- `couple-photostrips`

Custom avatars should use a separate bucket only if Google avatars are no longer sufficient.

### 16.2 Object paths

```text
{coupleId}/{keepsakeId}/preview.webp
{coupleId}/{keepsakeId}/original.png
{coupleId}/{keepsakeId}/metadata.json
```

### 16.3 Upload workflow

1. Client requests a keepsake draft.
2. Server validates couple and session ownership.
3. Server returns a scoped upload target or permitted path.
4. Client uploads size- and type-validated content.
5. Server finalizes the keepsake record.
6. Incomplete uploads expire and are cleaned up.

### 16.4 Media limits

- Prefer WebP previews.
- Cap original image dimensions and file size.
- Reject executable and unsupported content types.
- Strip unnecessary metadata where possible.
- Never expose permanent public object URLs.
- Use signed URLs or authenticated object access.

---

## 17. Cupidot intelligence roadmap

### 17.1 Allowed context

- Names entered by users.
- Explicit session mood.
- Revealed answers.
- Recent non-sensitive question history.
- Activity type.
- User-selected tone.

### 17.2 Forbidden context

- Camera frames or uploaded photographs.
- Hidden answers.
- Access tokens.
- Invite or room codes.
- Email addresses unless explicitly required for account support, which AI does not need.
- Precise location.
- Unrelated account history.

### 17.3 Behavior

Cupidot may:

- Welcome the couple.
- Suggest activities according to selected mood and available time.
- Connect revealed answers into a specific follow-up.
- Notice playful similarities or contrasts.
- Offer a softer prompt.
- Produce an optional end-of-session summary.

Cupidot must not:

- Diagnose the relationship.
- Pressure a person to answer.
- Present inference as fact.
- Shame disagreement.
- Generate unsafe intimate content.
- Block an activity when Gemini is unavailable.

### 17.4 Failure behavior

- Use curated local follow-ups.
- Preserve the session.
- Show no alarming technical error.
- Record only operational error metadata—not question or answer content.

---

## 18. Frontend architecture

### 18.1 Proposed routes

```text
/login
/auth/callback
/profile
/invite/[token]
/our-space
/room/[code]
/room/[code]/lobby
/room/[code]/[activity]
/keepsakes
/keepsakes/[id]
/settings/privacy
```

Existing activity URLs may remain, but room-aware entry should use a consistent routing wrapper.

### 18.2 Provider hierarchy

```text
SupabaseSessionProvider
  CoupleSpaceProvider
    ActiveRoomProvider
      PresenceProvider
        ActivitySessionProvider
          Activity page
```

Providers should expose clear loading, unavailable, unauthorized, reconnecting, and synchronized states.

### 18.3 Shared UI components

- `GoogleSignInButton`
- `ProfileOnboardingCard`
- `PartnerInvitationCard`
- `InviteAcceptanceCard`
- `PartnerIdentityPair`
- `TogetherPulse`
- `DateNightLobby`
- `ReadyControl`
- `RoomConnectionBanner`
- `SecretAnswerSeal`
- `RevealTogether`
- `ReconnectOverlay`
- `SessionCompletionCapsule`
- `KeepsakeCard`
- `RelationshipConstellation`
- `GentleSkipButton`

### 18.4 Accessibility

- Every presence color has equivalent text.
- Countdown changes are announced without excessive screen-reader interruption.
- Ready, lock, reveal, and reconnect states are keyboard accessible.
- Motion-heavy connection effects honor reduced-motion settings.
- Focus moves intentionally after modal confirmation and route transitions.
- QR codes always have the copyable link/code alternative.
- Error copy identifies the recovery action.

---

## 19. Error and edge-case design

### Authentication

- OAuth cancelled.
- Callback expired.
- Session expired during a room.
- Account exists but profile trigger was delayed.
- User opens an invite on another device.

### Couple connection

- Self-invite.
- Expired invitation.
- Revoked invitation.
- Already-used invitation.
- Couple already full.
- User already connected elsewhere.
- Simultaneous acceptance attempts.

### Rooms

- Invalid code.
- Correct code for another couple.
- Expired room.
- Completed room.
- Room code rotated while a stale tab is open.
- Both partners start rooms simultaneously.

### Realtime

- Duplicate event.
- Event gap.
- Out-of-order delivery.
- Multiple tabs for one user.
- Temporary network loss.
- Browser sleep and wake.
- Subscription reconnect without state reload.
- Snapshot revision conflict.

### Media

- Camera denied.
- Unsupported browser.
- Oversized upload.
- Upload interrupted.
- One partner saves while the other discards.

Each case needs an explicit UI state, safe server result, and automated test where practical.

---

## 20. Observability without privacy leakage

Record:

- Operation name.
- Success or normalized error code.
- Duration.
- Anonymous request/session correlation ID.
- Activity type.
- Event sequence gaps.
- Reconnect count.
- Supabase channel status.
- Edge Function model latency and status.

Do not record:

- Raw answers.
- Question history containing personal content.
- Invite or room codes.
- Access tokens.
- Google provider tokens.
- Image contents.
- Precise location.

Operational dashboards:

- Authentication success rate.
- Invite acceptance success rate.
- Room creation/join success rate.
- Realtime disconnect and recovery rate.
- Event gap frequency.
- Activity completion rate.
- Keepsake creation success rate.
- Gemini success/fallback rate.

---

## 21. Data lifecycle

### 21.1 Suggested retention defaults

- Presence: ephemeral only.
- Unfinished room events: short retention after room expiration.
- Completed activity events: compact or delete after a durable snapshot/keepsake is created.
- Private answers: delete after the configured session retention period unless deliberately saved.
- Invite records: retain minimal audit status, remove raw token material.
- Keepsakes: retain until deleted by the couple or account lifecycle flow.

### 21.2 Export

An account export should include:

- User profile.
- Couple membership metadata.
- Shared preferences.
- Keepsake metadata and downloadable owned assets.
- Milestones and rituals.

It should exclude the partner’s private information beyond shared records.

### 21.3 Couple separation and account deletion

This requires a deliberate product policy before implementation.

Questions to resolve:

- Does either partner have unilateral separation rights?
- What happens to jointly created keepsakes?
- Is there a recovery window?
- Can a user delete their account while preserving the partner’s copy of shared memories?
- How are pending exports handled?

No destructive lifecycle RPC should ship until these decisions are encoded and tested.

---

## 22. Delivery phases

### Phase 0 — Baseline and contract freeze

Objectives:

- Document current schema, RPCs, RLS, Realtime publication, and client hooks.
- Capture representative two-browser behavior for Quiz and Draw.
- Define activity registry and event naming conventions.
- Decide session and event retention.

Deliverables:

- Schema inventory.
- Current-state sequence diagram.
- Threat model.
- Event-contract TypeScript definitions.
- Migration ordering plan.

Exit gate:

- Existing behavior is reproducible.
- No undocumented production dependency remains.

### Phase 1 — Secure couple foundation

Backend:

- Strengthen active-member constraints.
- Add invite status and revocation.
- Add safe invite acceptance transaction.
- Restrict RPC execution to authenticated users.
- Add normalized error codes.

Frontend:

- Build `/invite/[token]`.
- Preserve return path through OAuth.
- Add confirmation and terminal invite states.
- Add realtime connected-partner update.

Verification:

- Two-account acceptance.
- Self-invite rejection.
- Reuse rejection.
- Concurrent acceptance protection.
- Cross-couple RLS denial.

Exit gate:

- Exactly two accounts can connect once, and no third account can observe or join the couple.

### Phase 2 — Protected room lifecycle

Backend:

- Couple-owned rooms.
- `create_date_room`, `join_date_room`, `leave_date_room`, and `rotate_room_code`.
- Expiration and resume rules.
- Active-room uniqueness strategy.

Frontend:

- Start and continue controls.
- Room-aware navigation.
- Invalid/expired/unauthorized states.
- Share link and QR.

Migration:

- Preserve compatible existing room history where useful.
- Remove client dependency on arbitrary `create_room` fallback.

Exit gate:

- Only the linked couple can create, discover, join, resume, or rotate its room.

### Phase 3 — Date Night Lobby and Presence

Backend:

- Realtime authorization.
- Presence channel conventions.
- Durable readiness metadata when needed for recovery.

Frontend:

- Lobby UI.
- Both-person identity display.
- Together Pulse.
- Ready controls.
- Mood, duration, activity, audio, and consent controls.
- Multi-tab presence deduplication.

Exit gate:

- Two devices accurately show join, ready, disconnect, and reconnect states.

### Phase 4 — Durable activity framework

Backend:

- `activity_sessions`.
- Ordered `room_events`.
- Revision checks.
- Event append RPC.
- Replay endpoint/RPC.
- Snapshot update strategy.

Frontend:

- Shared hooks and providers.
- Event registry and validators.
- Recovery cursor.
- Reconnect overlay.
- Server-synchronized timer utility.

Exit gate:

- A reference activity survives refresh, offline interruption, duplicate delivery, and out-of-order notification.

### Phase 5 — Secret Until Together

Backend:

- Private-answer table and RLS.
- Lock and reveal RPCs.
- Round-level state transition enforcement.

Frontend:

- Answer seal.
- Partner lock-status indicator.
- Reveal Together animation.
- Gentle Skip.

Exit gate:

- Neither partner can retrieve the other answer before server-authorized reveal.

### Phase 6 — Quiz and Draw reference implementations

Quiz:

- Move all round truth to activity session state.
- Integrate private answer flow.
- Add resume and synchronized reveal.

Draw:

- Add stroke batching and sequence ordering.
- Separate cursor presence from durable strokes.
- Add canvas checkpoint and recovery.
- Save completed work as a keepsake.

Exit gate:

- Both activities pass the complete two-device test matrix.

### Phase 7 — Activity catalog rollout

Order:

1. Cards.
2. Host.
3. Match.
4. Debate and Court.
5. Dare.
6. Photobooth timing.
7. Passport and Scrapbook collaboration.
8. Remaining room-aware activities.

For each activity:

- Define snapshot schema.
- Define event allow list.
- Define private versus shared state.
- Define completion conditions.
- Define reconnect behavior.
- Define keepsake behavior.
- Add two-device tests.

Exit gate:

- Every activity advertised as realtime uses the shared protected architecture.

### Phase 8 — Keepsakes and continuity

Backend:

- Private buckets and storage policies.
- Keepsake creation/finalization RPCs.
- Milestones.
- Session capsule summaries.

Frontend:

- Functional memory shelf.
- Keepsake detail view.
- Date Night Capsule.
- Relationship Constellation.
- Continue previous date night.

Exit gate:

- A completed activity can create a private, retrievable, deletable keepsake visible only to the couple.

### Phase 9 — Rituals and Timezone Bridge

- Shared ritual model.
- Timezone-aware recommendations.
- Optional scheduling metadata.
- Non-coercive streak presentation.
- Dashboard integration.

Exit gate:

- Ritual behavior remains correct across timezones and daylight-saving changes.

### Phase 10 — Cupidot expansion

- Consent-aware session context.
- Revealed-answer filtering.
- Safety prompt and output validation.
- Curated fallback parity.
- Optional capsule summary.
- Operational metrics without content logging.

Exit gate:

- AI consent off results in zero Gemini requests, and AI failure never blocks play.

### Phase 11 — Production readiness

- Deploy production domain.
- Update Supabase site and redirect URLs.
- Update Google JavaScript origins, branding URLs, and audience status.
- Update Edge Function CORS allow list.
- Configure production storage and retention.
- Run adversarial RLS tests.
- Run mobile, accessibility, performance, and poor-network QA.
- Add monitoring and incident playbook.
- Prepare rollback migration and deployment procedure.

Exit gate:

- OAuth, database, storage, realtime, and AI pass an end-to-end production-domain test with two separate accounts and devices.

---

## 23. Test matrix

### 23.1 Authentication

- First Google login creates one profile.
- Returning login reuses the profile.
- OAuth cancellation returns safely.
- Invalid callback shows a recoverable error.
- Signed-out private routes redirect and restore destination.
- Email/password options are absent.

### 23.2 Couple authorization

- User A creates a couple.
- User B accepts.
- User A cannot accept the same invite.
- User C cannot accept after User B.
- Reused, expired, and revoked codes fail.
- User C cannot read couple/profile/invite data.
- User in another couple cannot accept.

### 23.3 Room lifecycle

- Either partner can create when no room exists.
- Simultaneous create resolves to one intended active room.
- Both members can join.
- Stranger cannot join with the correct code.
- Rotation invalidates the old code.
- Refresh resumes the room.
- Expiration closes further transitions.

### 23.4 Realtime delivery

- Events arrive once in normal operation.
- Duplicate notification is ignored.
- Missed event is replayed.
- Out-of-order notification waits for the gap.
- Multiple tabs do not appear as multiple partners.
- Browser sleep and wake recovers.
- Network offline/online recovers.
- Session expiry triggers controlled reauthentication.

### 23.5 Private answers

- A sees only A’s answer before reveal.
- B sees only B’s answer before reveal.
- Direct table query cannot bypass reveal.
- Reveal fails until both lock.
- Reveal succeeds exactly once.
- Refresh preserves lock state.

### 23.6 Keepsakes

- Only couple members can list.
- Upload path cannot target another couple.
- Invalid type and oversized content fail.
- Interrupted upload does not create a broken permanent record.
- Deleting a keepsake removes or schedules removal of associated objects.

### 23.7 AI

- Consent off sends no request.
- Consent on requires authentication.
- Hidden answers are excluded.
- Camera and photo data are excluded.
- Malformed model output uses fallback.
- Rate-limit or provider failure preserves the activity.

### 23.8 Devices and browsers

- Chrome desktop + Chrome desktop.
- Chrome desktop + Android Chrome.
- Android Chrome + Android Chrome.
- Safari/iOS where supported.
- Different networks.
- High latency and intermittent connectivity.
- Narrow mobile viewport and landscape orientation.

---

## 24. Performance budgets

Initial targets:

- Lobby interaction response: immediate local feedback under 100 ms.
- Important server acknowledgment: visibly handled within normal network latency.
- Realtime event-to-render target: under 500 ms on a healthy connection.
- Presence convergence target: under 3 seconds.
- Reconnect recovery target: under 5 seconds for ordinary event histories.
- Initial event replay: capped and paginated.
- Drawing broadcast: batched to avoid per-point database writes.
- Media previews: compressed and lazy-loaded.
- Large activity bundles: route-level or feature-level code splitting.

These are product budgets, not guarantees; telemetry will establish realistic production percentiles.

---

## 25. Migration and backward compatibility

- Use versioned SQL migrations checked into `supabase/migrations`.
- Make migrations idempotent where practical.
- Never silently reinterpret existing room codes as couple invitations.
- Preserve existing authenticated profiles.
- Backfill couple membership only from verified relationships.
- Add new columns with safe defaults before making them required.
- Deploy server support before clients depend on it.
- Maintain event schema versions.
- Reject incompatible clients with a friendly refresh/update message.
- Prepare rollback for code deployments; avoid destructive schema rollback when forward repair is safer.

---

## 26. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Guessable codes treated as authorization | Unauthorized access | Require authenticated couple membership independently of the code |
| RLS policy regression | Private-data exposure | Automated cross-account negative tests in every migration |
| Duplicate/out-of-order events | Divergent screens | Idempotency IDs, server sequence, cursor replay |
| Presence mistaken for durable state | Lost progress | Keep snapshots/events in Postgres |
| Multiple tabs | False partner presence or conflicting actions | Device IDs, user-level presence aggregation, revision checks |
| Drawing event volume | Cost and latency | Batch strokes, transient cursors, periodic checkpoints |
| AI leakage | Privacy failure | Explicit consent, strict payload builder, no raw logging |
| Media storage growth | Cost | Compression, limits, retention, quotas |
| OAuth domain drift | Login failure | Environment checklist and automated redirect validation |
| Partial activity conversion | Misleading realtime promise | Mark only verified activities as realtime |
| Couple separation semantics | Data-loss conflict | Define policy before destructive lifecycle implementation |

---

## 27. Definition of done

The connected-couple and realtime-room system is complete only when all of the following are true:

- Two independent Google accounts can connect through a single-use invitation.
- The database rejects a third member and cross-couple access.
- Either partner can create or resume a couple-owned room.
- A room code alone cannot authorize a stranger.
- Presence accurately reflects both users across disconnect and reconnect.
- The server owns activity state, timing, and critical transitions.
- Missing and duplicate events do not desynchronize clients.
- Private answers cannot be retrieved before reveal.
- Quiz and Draw pass two-device recovery testing.
- Every activity advertised as realtime uses the shared framework.
- Completed activities can produce private keepsakes.
- AI consent off produces zero Gemini traffic.
- No secret appears in the frontend bundle or repository.
- Production Google OAuth, Supabase URLs, CORS, RLS, Storage, and Realtime settings are verified.
- Accessibility, responsive, poor-network, and security checks pass.
- Monitoring detects failures without collecting intimate content.

---

## 28. Recommended implementation order

The practical dependency order is:

```text
Couple security
  → invitation UX
  → protected room lifecycle
  → Date Night Lobby
  → Presence
  → activity-session snapshots
  → ordered events and recovery
  → private answers and Reveal Together
  → Quiz and Draw reference integrations
  → remaining activities
  → keepsakes and constellation
  → rituals and timezone bridge
  → production-domain hardening
```

This order avoids rebuilding each activity around temporary architecture. The shared foundation should be proven with Quiz and Draw before the rest of the catalog is migrated.

---

## 29. Product decisions required before final production launch

These choices do not block the foundation but must be resolved before their associated feature ships:

1. Couple separation and ownership of shared keepsakes.
2. Default retention period for private answers and unfinished events.
3. Whether both partners must approve saving certain shared artifacts.
4. Whether room creation is allowed by either partner or only the current lobby host.
5. How long a resumable room remains active.
6. Whether scheduled rituals generate notifications in the first release.
7. Storage quota per couple.
8. Whether AI summaries are session-only or may become keepsakes.
9. Whether a production Google app stays in Testing initially or proceeds through publishing and verification.

---

## 30. Final experience statement

Dearly Us should feel like opening the same private room from two different places.

The user should see a warm invitation, their person arriving, both sides becoming ready, a shared moment unfolding at the same time, and a memory waiting afterward. They should never need to understand channels, rows, events, revisions, snapshots, OAuth callbacks, or reconnect cursors.

The implementation succeeds when the emotional experience feels effortless while the underlying system remains authenticated, couple-scoped, durable, recoverable, consent-aware, and honest about what is truly realtime.
