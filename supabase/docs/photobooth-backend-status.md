# Photobooth backend status

Verified live on 10 September 2026 in Supabase project `rueuosbacmnpowgcygro`, through the user's Chrome extension. Backend changes were applied directly in Supabase; this document is a handoff record, not a migration.

## Installed

- `photobooth_rooms`: one host and at most one guest, 20-character invitation codes, four-hour expiry, explicit closure, and row-level security. Authenticated clients cannot read or modify the table directly.
- `create_photobooth_room()`: signed-in host; maximum ten creations per hour, serialized per host.
- `join_photobooth_room(invite_code text)`: reserves the second slot atomically; existing members can reconnect; rejects third people, closed rooms and expired invitations.
- `get_photobooth_room(target_room uuid)`: active members only. Returns `id`, `code`, `hostId`, `guestId`, and `expiresAt`.
- `close_photobooth_room(target_room uuid)`: either active member can close the booth.
- `is_photobooth_member(target_room uuid)` and `can_access_photobooth_topic(topic text)`: membership and expiry checks.
- `photobooth_send` and `photobooth_receive`: authenticated broadcast policies for private `photobooth:<room UUID>` channels. Existing activity policies were preserved.
- `get_photobooth_ice_servers(target_room uuid)`: active-member-only ICE discovery. Returns STUN while no relay is configured.
- `get_photobooth_connection_status(target_room uuid)`: reports whether relay configuration exists, independently of photo transfer readiness.

## Future editor work already covered

Capture coordination, photo chunks, crop changes, captions, stickers, drawing strokes, editor ownership and approvals can travel through the same private broadcast channel. Background removal/compositing and PNG/print-sheet rendering run locally. No raw camera photos or editor image data are stored in the room table. Reload recovery of photo pixels still requires the other participant to resend them; the room lookup only restores membership metadata.

The existing private `couple-photostrips` bucket accepts JPEG, PNG and WebP up to 15 MiB, and existing `finalize_keepsake` supports `photostrip`. Saving to Our Space requires an existing couple space. People without a couple space can use the booth and download their result.

## Live checks

Eight rolled-back database checks passed: create contract and host membership; direct table denial; invitation and reconnect behavior; third-person/outsider rejection; member-only ICE and honest relay status; creation limit; closed/expired rejection; anonymous RPC denial.

Three additional checks passed against the actual `realtime.messages` policies under the authenticated role: member INSERT/SELECT allowed, outsider SELECT hidden, outsider INSERT denied. The first attempt encountered absent service-managed message partitions. Connecting an empty private channel through the Realtime inspector initialized the service; the rerun passed. The diagnostic listener was stopped. Fixtures were rolled back, not retained as real accounts or rooms.

## Outstanding external dependency

No TURN relay is configured. The current secure adapter supports coturn-compatible REST authentication using two Vault entries: `photobooth_turn_secret` and `photobooth_turn_urls` (a JSON URL array). It returns temporary HMAC credentials valid for at most one hour and no later than room expiry; it does not expose the permanent secret. A provider using a different credential API, including Cloudflare, needs its corresponding server-side adapter before activation. Do not treat a STUN-only response as proof of reliable cross-network video.

The user was asked whether a Cloudflare account is available. No service was purchased, activated, or configured with invented credentials.

## Local integration and end-to-end checks still needed

- Finish drawing and shared-background tools.
- Use room lookup/closure and connection-status endpoints in the client where appropriate.
- Enforce expiry and close the browser's existing connection: Realtime authorization is evaluated on channel join and JWT refresh, so database closure alone is not an immediate disconnect of an already-open socket.
- Complete two-account camera, synchronization, retry, editing, approval and export tests across separate networks once the relay is configured.

Database checks do not establish that the full browser experience is complete.
