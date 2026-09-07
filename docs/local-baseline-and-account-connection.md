# Dearly Us Local Baseline, Architecture & Delivery Checklist

Snapshot date: 2026-09-05

## 1. Product Routes & Component Inventory

### Account, Auth, and Connection Routes

- `/login` (`app/login/page.tsx`): Google-only Supabase OAuth, destination query parameter preservation (`next=...`), local sessionStorage fallback (`dearly_auth_return_to`), accessible feedback for cancellation and errors.
- `/auth/callback` (`app/auth/callback/page.tsx`): Completes PKCE exchange with Supabase Auth, restores verified return path, handles OAuth error callbacks gracefully.
- `/profile` (`app/profile/page.tsx`): Profile onboarding (display name, city, timezone, Google avatar), My Space / Our Space dashboard, partner identity & presence status, active-room actions, invitation card with QR code, keepsake shelf, relationship constellation preview, shared preferences, planned rituals, AI consent, data export, space separation, and account deletion entry points.
- `/our-space` (`app/our-space/page.tsx`): Canonical couple route; renders the full shared-space experience.
- `/invite/[token]` (`app/invite/[token]/page.tsx`): Authenticated preview and confirmation for single-use invites. Covers all 8 invitation states: `pending`, `accepted`, `expired`, `revoked`, `already_used`, `couple_full`, `self_invite`, and `already_connected`.

### Shared Date Night Room & Lobby

- `/room/[code]` (`app/room/[code]/page.tsx`): Date Night Lobby. Shows both partner avatars joined by the Connection Ribbon, dual local times based on each partner's timezone, Together Pulse presence indicator, ready toggle, mood selection (playful, romantic, deep, cozy, spontaneous), duration selection (15, 30, 45, 60, 90 mins), activity selection with "Surprise us" randomized picker, Cupidot AI consent status, shared ambient sound, synchronized 3-second countdown, resume-session controls, and safe leave-room action.

### Realtime Reference Activities

- `/quiz` (`app/quiz/page.tsx`): Turn-based question rounds, private answers, synchronized reveal, score matching, receipt modal generation, adaptive question queue.
- `/draw` (`app/draw/page.tsx`): Collaborative canvas, line streaming, synchronized clear, throttled broadcast (~40ms), download artwork keepsake.

### Activity Catalog & Date Experiences

- `/activity`, `/arcade`, `/cards`, `/court`, `/dare`, `/debate`, `/host`, `/iq`, `/match`, `/riddle`.
- `/photobooth`, `/passport`, `/scrapbook`, `/letter`, `/date`, `/bucket`, `/timezone`.
- Supporting routes: `/`, `/august`, `/birthday`, `/blog`, `/blog/[slug]`, `/creators`, `/fashion`, `/forecast`, `/future`, `/hunt`, `/lab`, `/privacy`, `/shirts`, `/shop`, `/terms`.

---

## 2. Room Hooks & Realtime Architecture

### Provider Hierarchy

```text
SupabaseSessionProvider
  CoupleSpaceProvider
    ActiveRoomProvider
      PresenceProvider
        ActivitySessionProvider
          Activity page / Lobby
```

### Focused Modules & Custom Hooks

- `useCoupleSpace()`: Access couple profile, membership, partner details, invite controls (regenerate, revoke), preferences, milestones, and keepsakes. Subscribes to realtime Postgres changes for the space.
- `useActiveRoom()`: Room creation, joining, code rotation, ready toggling, leaving, and expiration tracking. **Enforces strict join validation: join failures never fall back to creating a room.**
- `useRoomPresence()`: Manages ephemeral Supabase Presence channel (`room:${roomId}`). Tracks device ID, tab ID, online status, and interaction state (`idle`, `ready`, `choosing`, `writing`, `drawing`).
- `useRealtimeEvents()`: Subscribes to validated, ordered room events with cursors, gap detection, and deduplication.
- `useActivitySession()`: Snapshot management, round progression, transitions, and status updates.
- `usePrivateAnswers()`: Submit and seal private answers (`lock_private_answer`) with server-authorized reveal (`reveal_private_answers`).
- `useSessionRecovery()`: Reconnects client and replays missed events from the last seen sequence cursor.
- `useKeepsakeWriter()`: Staged upload to private storage and metadata persistence.
- `lib/room.ts`: Backward-compatible `useRoomSync` adapter wrapping the modular room and presence architecture.

---

## 3. Shared Activity Registry, Event Names & Error Codes

### Event Names Registry

```ts
export const ACTIVITY_EVENT_NAMES = {
  quiz: ['quiz_pick', 'quiz_reveal', 'quiz_next'],
  draw: ['draw_line', 'draw_clear'],
  shared: ['reaction_sent', 'timer_started', 'music_changed', 'gentle_skip'],
} as const;
```

### Error Codes Registry

```ts
export const ACTIVITY_ERROR_CODES = {
  authRequired: 'AUTH_REQUIRED',
  roomUnavailable: 'ROOM_UNAVAILABLE',
  roomForbidden: 'ROOM_FORBIDDEN',
  sessionUnavailable: 'SESSION_UNAVAILABLE',
  invalidEvent: 'INVALID_EVENT',
  invalidTransition: 'INVALID_TRANSITION',
  revisionConflict: 'REVISION_CONFLICT',
  eventGap: 'EVENT_GAP',
  answerAlreadyLocked: 'ANSWER_ALREADY_LOCKED',
  revealNotReady: 'REVEAL_NOT_READY',
} as const;
```

### TypeScript Contracts

- `RealtimeActivityAdapter<TSnapshot, TEvent>`: Standard contract for defining activity lifecycle, initial snapshot, validation, state reduction, transition guards, summarization, and keepsake drafting.
- `ActivitySession`: Versioned snapshot, status, round number, revision, and sequence markers.
- `ActivityEvent`: Ordered, sequenced, idempotent payload dispatched over Postgres events.
- `PresenceState`: Device, tab, user, interaction status, and timestamps.

---

## 4. Two-Browser Reference Behavior (test script; not yet a recorded test result)

### Quiz

1. Both browsers join the couple's active room via `join_date_room`.
2. Both players see questions; picks are recorded via `quiz_pick`.
3. When both lock in, the reveal action is unlocked (`quiz_reveal`), triggering celebration sounds and score updates.
4. `quiz_next` progresses both screens simultaneously to the next question round.
5. On refresh, the activity session recovery RPC returns the current round state and replays events.

### Draw Together

1. Both browsers join the room and subscribe to the canvas event stream.
2. Pointer movements are rendered locally instantly and throttled to ~40ms broadcasts via `draw_line`.
3. The remote browser renders received line segments; canvas clears (`draw_clear`) are synchronized.
4. Artwork can be saved locally or uploaded to the couple keepsake shelf.

---

## 5. Supabase Surface & Environment Variables

### Browser-Safe Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Public HTTPS endpoint of the Supabase project.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Public anon/publishable API key.

_Zero secrets, service role keys, OAuth secrets, or AI API keys are stored in client bundles or repositories._

### Backend RPC Surface

- Account & Space: `get_my_space`, `create_couple_space`, `get_couple_invite_preview`, `join_couple_by_invite`, `regenerate_couple_invite`, `revoke_couple_invite`.
- Room: `create_date_room`, `join_date_room`, `leave_date_room`, `rotate_date_room_code`, `set_room_ready`.
- Activity & Session: `start_activity`, `append_activity_event`, `get_session_recovery`, `lock_private_answer`, `reveal_private_answers`, `complete_activity`, `set_activity_paused`.
- Preferences & Keepsakes: `get_shared_preferences`, `save_shared_preferences`, `finalize_keepsake`, `delete_keepsake`.

---

## 6. Migration Preservation Decisions

1. **Visual Language & Aesthetic**: Preserve the custom dark/paper aesthetic, Playfair Display typography, warm rose/blue gradients, micro-interactions, and sound effects.
2. **Activity Catalog Continuity**: Existing activities retain their current routes and gameplay while utilizing the modernized room sync and presence infrastructure.
3. **Strict Authorization**: Supabase couple membership governs room authorization; room codes and invite codes serve solely as identifiers. Join failures never fall back to creating a room.
4. **Local QR Generation**: QR codes are generated directly in SVG on the client (`QRCodeSVG`), keeping invite tokens strictly private without third-party exposure.

---

## 7. Delivery Checklist

Status rule: “Implemented locally” means source code exists. “Locally tested” requires a current recorded run. “Deployed” and “Live verified” require the live Supabase phase; local migration or function files do not count as either.

### Required current local test record

- [ ] Quiz: two separate accounts lock, reveal, advance, refresh, and reconnect without exposing an answer in a room event.
- [ ] Draw Together: two separate accounts exchange strokes, clear together, reconnect, and save a keepsake.
- [ ] Account connection: first account creates Our Space; second account accepts an invite after Google sign-in; both see the connected state.
- [ ] Lobby: both accounts see presence, toggle ready, start the same activity, leave, and resume.
- [ ] Accessibility: keyboard-only pass for the lobby, secret answer seal, invite, and separation-request dialogs.

Until these are checked with dates and test accounts, the related “Locally tested” and “Live verified” cells below remain pending despite older wording in this historical snapshot.

| Item                                                                                                             | Implemented locally | Locally tested          | Deployed to live Supabase | Live verified             |
| ---------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------- | ------------------------- | ------------------------- |
| Baseline documentation & contracts                                                                               | Yes                 | Verified                | Reference only            | Local reference           |
| Google OAuth & callback return path                                                                              | Yes                 | Build & type validation | Project configured        | Pending live OAuth run    |
| Profile onboarding (name, city, timezone, Google avatar)                                                         | Yes                 | Build & type validation | Migrations versioned      | Pending live verification |
| Create Our Space & single-use invite flow                                                                        | Yes                 | Build & type validation | Migrations versioned      | Pending live verification |
| Invite states (pending, accepted, expired, revoked, used, full, self, connected)                                 | Yes                 | Build & type validation | Migrations versioned      | Pending live verification |
| Realtime partner connection refresh                                                                              | Yes                 | Build & type validation | Publication source ready  | Pending live verification |
| Upgraded Our Space (presence, timezones, room actions, keepsakes, constellation, export, disconnect)             | Yes                 | Build & type validation | Migrations versioned      | Pending live verification |
| State-aware navigation (signed out, unpaired, paired, inside room)                                               | Yes                 | Build & type validation | N/A (Frontend)            | Verified locally          |
| Date Night Lobby (Connection Ribbon, dual local times, Together Pulse, moods, durations, Surprise us, countdown) | Yes                 | Build & type validation | Migrations versioned      | Verified locally          |
| Together Pulse component (12 accessible states, zero answer leakage)                                             | Yes                 | Build & type validation | N/A (Frontend)            | Verified locally          |
| Provider hierarchy (SupabaseSession, CoupleSpace, ActiveRoom, Presence, ActivitySession)                         | Yes                 | Build & type validation | N/A (Frontend)            | Verified locally          |
| Focused modular hooks (useCoupleSpace, useActiveRoom, useRoomPresence, etc.)                                     | Yes                 | Build & type validation | Migrations versioned      | Verified locally          |
| Removal of auto-create fallback on room join failure                                                             | Yes                 | Build & type validation | RPC enforces join check   | Verified locally          |
| Reference activities preservation (Quiz & Draw Together)                                                         | Yes                 | Build & type validation | Migrations versioned      | Verified locally          |
