# Supabase Migrations & Backend Operations Reference

This document maintains the local source of truth for reproducible database schema migrations, Edge Functions, Row-Level Security (RLS) policies, and rollback procedures for Dearly Us.

---

## 1. Migration Sequence & Inventory

All database migrations are version-stamped using standard `YYYYMMDDNNNN_<name>.sql` format:

1. **`202609040001_account_spaces.sql`**
   - Core tables: `profiles`, `couples`, `couple_spaces`, `couple_members`, `couple_invitations`, `keepsakes`, `shared_preferences`, `relationship_milestones`.
   - Primary single-use invitation generation, verification, and space claiming RPCs.
   - Initial RLS policies ensuring exactly two authenticated users can share a space.

2. **`202609050001_realtime_room_foundation.sql`**
   - Ephemeral date-night rooms (`rooms` / `date_rooms`), room participants (`room_members`), activity sessions (`activity_sessions`), sequenced events (`room_events`), and zero-leak private answers vault (`private_answers`).
   - Monotonic revision locking to prevent race conditions during activity transitions (`append_activity_event`, `lock_private_answer`, `reveal_private_answers`, `complete_activity`).
   - Storage buckets configuration (`couple-keepsakes`, `couple-drawings`, `couple-photostrips`).

3. **`202609050002_scope_foundation_completion.sql`**
   - Realtime publication bindings for `rooms`, `room_members`, `activity_sessions`, `room_events`, and `keepsakes`.
   - Security definer RPCs for room entry, rotating room codes, and secure storage uploads.

4. **`202609050003_core_domain_contract.sql`**
   - Formalized `activity_kind` and `keepsake_status` constraints.
   - Soft-delete tracking (`status = 'deleted'`) and permanent storage cleanup RPC (`delete_keepsake`).

5. **`202609050004_repair_couple_identity_columns.sql`**
   - Backward-compatible column resolution for couple identity bindings across older schemas.

6. **`202609050005_relationship_continuity_and_rituals.sql`**
   - Date Night Capsules RPC: `save_date_night_capsule` (bundles activities, favorite moments, explicit mood tag, and private note into a sealed keepsake).
   - Guilt-Free Shared Rituals RPC: `record_ritual_entry` (stores Sunday check-ins, bedtime reflections, daily gratitude, and countdowns without punitive streak counters).
   - Timezone Date Scheduler RPC: `save_scheduled_date` (saves scheduled date night metadata for Golden Hour alignment).

---

## 2. Forward-Repair vs. Rollback Strategy

### Forward Repair (Recommended)
- Never mutate already deployed migrations in production.
- Always apply an additive forward repair script (e.g. `202609050006_repair_...sql`) that uses `if not exists` and `create or replace function`.
- Verify RLS policies with negative test assertions before running in production.

### Safe Rollback Procedures
- **Keepsake Deletion:** Uses `delete_keepsake(target_keepsake_id uuid)`. Soft-deletes the record in `public.keepsakes` (`status = 'deleted'`) and cleans up the associated storage object in `storage.objects` without corrupting couple histories.
- **Couple Separation:** Uses `disconnect_couple_space()`. Revokes space membership while preserving individual account profiles and user auth records.
- **Room Code Invalidation:** Uses `rotate_date_room_code(room_code text)`. Generates a fresh 4-character code, immediately invalidating access from stale tabs or disconnected clients.

---

## 3. RLS & Cross-Account Negative Testing

All tables enforce Row-Level Security:

1. **Cross-Couple Isolation:**
   - Authenticated user A cannot read, insert, or delete keepsakes, activity events, or preferences belonging to couple space B.
   - Enforced by `couple_members.profile_id = auth.uid()` subqueries on all couple-scoped tables.

2. **Single-Use Invitation Protection:**
   - Invitations expire after 48 hours or immediately upon first successful use (`accepted_at is not null`).
   - Once a couple space has 2 members, `join_couple_space` rejects any third member with `'Couple space is already full'`.

3. **Ephemeral Room Privacy:**
   - Active rooms require valid couple membership or host matching. Room rotation immediately disconnects unauthenticated listeners.

---

## 4. Local Edge Functions

### `supabase/functions/gemini`
- Runs in Deno edge runtime with service role or authenticated JWT validation.
- Requires `GEMINI_API_KEY` configured in Supabase Secrets.
- Enforces strict couple consent (`aiConsent === true`) before dispatching requests.
- Strict payload sanitization strips tokens, invite codes, room codes, locations, images, and unrevealed secret answers.
- Automatically falls back to deterministic on-device Cupidot engine in `lib/cupidot.ts` if offline or unconfigured.
