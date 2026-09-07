# Cupidot — Features & Functionality Blueprint

## Document purpose

This document defines **what Cupidot does inside Dearly Us** and how the shared-pet experience works for a couple.

It covers product features, user journeys, moods, care, progression, rituals, rewards, activities, keepsakes, notifications, privacy controls, accessibility, recovery, and success criteria.

It intentionally does **not** define:

- Cupidot's visual appearance, species, proportions, outfits, expressions, or art production. Those belong in **Cupidot — Character Design**.
- Cupidot's detailed personality, dialogue style, reasoning, memory selection, or AI prompt system. Those belong in **Cupidot — Intelligence & Behavior**.
- Database migrations or Edge Function source inside the local project. Backend implementation belongs only in the live Supabase track.

---

## 1. Product vision

Cupidot is the living heart of Dearly Us: a private shared companion that two partners care for through meaningful time together.

It is not a generic chatbot, productivity streak, relationship score, or judge. It gives the couple a warm reason to return, helps them begin moments together, reacts to shared experiences, and turns selected memories into a home that feels uniquely theirs.

The core promise is:

> **Spend meaningful time together, and your shared little world comes alive.**

Cupidot must still feel valuable when AI is disabled. The essential pet, room, activity, ritual, progression, and keepsake experience is deterministic product functionality; AI only adds optional variety within strict consent and privacy boundaries.

---

## 2. Experience principles

### Shared, not owned by one partner

Cupidot belongs to the couple's Our Space. Both partners have equal access to its shared state, home, unlocked items, milestones, and jointly saved memories.

### Connection creates progress

Progress comes primarily from doing things together: completing a date activity, returning for a ritual, creating a keepsake, celebrating a milestone, or simply spending an intentional quiet moment together.

### No guilt mechanics

Cupidot never becomes sick, sad, hungry, or damaged because the couple was absent. Missing a day never breaks a streak or causes a loss. Return is always welcomed without judgment.

### Privacy before novelty

Cupidot can react to safe shared events and mutually revealed content. It cannot inspect sealed answers, private drafts, camera feeds, precise location, messages outside Dearly Us, or one partner's hidden actions.

### One meaningful suggestion

When guidance is useful, Cupidot presents one clear next action rather than a dashboard of demands.

### Small moments matter

The experience supports ten-minute playful visits, long date nights, quiet shared presence, and memory-making. It should not assume every session must be deep or romantic.

### Both partners remain in control

Suggestions can be skipped, reminders muted, rituals rescheduled, AI disabled, animations reduced, audio muted, and keepsakes declined without penalty.

---

## 3. Cupidot's product roles

| Role                  | Function                                                                           |
| --------------------- | ---------------------------------------------------------------------------------- |
| Shared pet            | Reacts to the couple's safe shared actions and develops through their journey.     |
| Welcome companion     | Makes returning to Our Space feel warm, whether one or both partners are present.  |
| Date-night guide      | Helps the couple choose, begin, pause, resume, and complete activities.            |
| Ritual keeper         | Supports couple-created recurring moments without guilt or pressure.               |
| Memory curator        | Offers to turn completed moments into mutually approved keepsakes.                 |
| Room steward          | Explains presence, readiness, waiting, connection loss, and recovery.              |
| Celebration companion | Recognizes milestones and creates small shared celebrations.                       |
| Consent guardian      | Makes privacy, AI, voice, camera, media, and notification controls understandable. |

---

## 4. The core shared-pet loop

The main experience should be understandable without a tutorial:

```text
Return to Our Space
        ↓
See Cupidot and the shared home
        ↓
Choose one shared moment
        ↓
Play, talk, create, plan, or relax together
        ↓
Cupidot reacts and receives a small growth spark
        ↓
Optionally preserve the moment as a keepsake
        ↓
The shared home gains history, warmth, or a meaningful unlock
```

### A healthy session rhythm

1. **Arrival** — Cupidot welcomes the present partner without commenting negatively on the absent partner.
2. **Together state** — when both are present, Cupidot acknowledges the reunion and offers one context-appropriate choice.
3. **Shared moment** — the couple completes an activity, ritual, planning action, or quiet-together session.
4. **Reaction** — Cupidot gives a brief emotional response appropriate to the moment.
5. **Reward** — progress is expressed through a growth spark, collectible, home change, or memory seed.
6. **Choice** — continue, save the moment, switch activities, or end peacefully.

The loop must not require daily use. Weekly and irregular couples should experience the same warmth and forward movement.

---

## 5. Our Space and Cupidot's home

Our Space becomes Cupidot's shared home and the couple's emotional landing page.

### Home screen priorities

The screen should answer four questions immediately:

1. Is my partner here?
2. What is Cupidot doing or feeling?
3. What can we do together right now?
4. Is there a recent memory or ritual worth revisiting?

### Home zones

- **Cupidot's area** — the interactive companion and its current safe state.
- **Tonight card** — one recommended next action plus alternatives.
- **Partner presence** — Here, Away, Reconnecting, or Ready; never invasive device details.
- **Memory shelf** — a small rotating selection of mutually saved keepsakes.
- **Ritual corner** — upcoming couple-created ritual with reschedule and mute controls.
- **Home collection** — unlocked decorations, comfort objects, activity souvenirs, and seasonal items.
- **Privacy shortcut** — direct access to AI, notifications, audio, motion, media, and keepsake choices.

### Home customization

Both partners can arrange unlocked items. Large changes use a simple shared confirmation or an undo window. Neither partner can permanently delete a jointly earned item without the agreed couple lifecycle rules.

Customization is expressive rather than competitive. There is no public home ranking, rarity leaderboard, or spending-based status.

---

## 6. Mood and wellbeing system

Cupidot has readable momentary states, not a psychological diagnosis of the relationship.

### Recommended mood set

| Mood    | Typical safe trigger                                 | Product purpose                         |
| ------- | ---------------------------------------------------- | --------------------------------------- |
| Cozy    | Quiet time, late evening, returning after a break    | Makes low-energy visits feel valid.     |
| Curious | A new activity or unopened memory is available       | Encourages exploration.                 |
| Playful | Games, reactions, surprise mode                      | Supports light connection.              |
| Excited | Both partners arrive or begin date night             | Marks togetherness.                     |
| Focused | Partners are writing, drawing, or choosing privately | Reduces interruption.                   |
| Proud   | A ritual, milestone, or activity is completed        | Celebrates effort without scoring love. |
| Dreamy  | Memory review, constellation, future planning        | Supports reflection.                    |
| Resting | No current shared action or reduced-motion mode      | Provides a calm default.                |

### Mood rules

- Moods are driven by current product state and safe shared events.
- Cupidot does not infer relationship health, anger, compatibility, or affection.
- One partner's private action cannot silently change a shared emotional label.
- Absence never creates a punishing mood.
- Mood transitions are gradual and readable, not random visual noise.
- Users can disable mood labels while keeping basic activity feedback.

### Shared care without chores

Care actions are optional expressions, not maintenance obligations:

- Give Cupidot a goodnight tap.
- Choose a cozy spot for a quiet session.
- Offer a jointly earned treat after an activity.
- Pick music ambience.
- Decorate the room together.
- Open a memory capsule.

There are no hunger bars, health meters, timers that punish absence, or purchases required to keep Cupidot happy.

---

## 7. Growth and progression

Progression should tell the story of the couple's shared participation without calculating the quality of their relationship.

### Growth model

Cupidot grows through **chapters**, each representing broader capabilities and a richer shared home. Chapters unlock through a mix of varied shared actions rather than raw repetition.

Suggested chapters:

1. **A New Little Home** — onboarding, first room, first activity, first saved moment.
2. **Learning Your Rhythm** — first ritual, first resumed session, first quiet-together moment.
3. **Making Traditions** — repeated rituals, multiple activity types, first planned date.
4. **A Home Full of Stories** — scrapbook, constellation, meaningful milestone collection.
5. **Always Finding Each Other** — long-term continuity, reunions, anniversaries, and seasonal memories.

### Growth sparks

Safe eligible actions provide growth sparks:

- Completing a shared activity.
- Finishing a mutually chosen ritual.
- Creating a keepsake together.
- Planning or completing a date.
- Recording a milestone.
- Trying a new activity category.
- Returning and reconnecting after time away.

Growth sparks are not displayed as a relationship score. A subtle progress path can show “two shared moments until the next home chapter,” but never compare partners or couples.

### Anti-grind rules

- Repeating the shortest action cannot rapidly farm progression.
- Variety matters more than frequency.
- There is a soft cap per session, communicated positively.
- No action is required on consecutive days.
- Purchased cosmetics never advance relationship progression.
- Progress cannot be lost through inactivity.

---

## 8. Rewards and collections

Rewards should create emotional texture and personalization, not an economy that overwhelms the relationship experience.

### Reward categories

- **Home objects** — cushions, lamps, shelves, plants, small activity trophies.
- **Ambient themes** — lighting, weather, seasonal details, and soundscapes.
- **Cupidot interactions** — new greetings, celebration types, cozy poses, and mini reactions.
- **Memory displays** — frames, constellation stars, scrapbook materials, capsule shelves.
- **Activity souvenirs** — paint marks from Draw, cards from games, a photo strip frame, travel stamps.
- **Ritual symbols** — a growing plant, lantern, calendar charm, or shared tradition token.

### Unlock methods

- Chapter milestones.
- First-time activity completions.
- Couple-created traditions.
- Seasonal participation with generous availability windows.
- Optional surprise gifts from one partner to the shared home.
- Accessibility and onboarding defaults available immediately, never locked.

### Reward presentation

Rewards appear after the emotional completion moment, not before it. Cupidot presents one short reveal and lets the couple place or postpone the item. There should always be a “not now” option.

---

## 9. Togetherness modes

Cupidot supports different relationship energies instead of assuming every visit is a game night.

### Quick Spark

- Two to five minutes.
- One playful question, reaction exchange, tiny drawing, or choice.
- Designed for busy days and different time zones.

### Date Night

- A planned or spontaneous multi-activity session.
- Lobby, activity queue, pauses, transitions, shared ambience, and completion recap.
- Cupidot can act as an optional host.

### Quiet Together

- Shared timer, ambience, gentle reactions, and presence.
- No questions or performance required.
- Useful for studying, winding down, or staying connected at a distance.

### Deep Connection

- Slower prompts with clear privacy and skipping controls.
- No automatic saving.
- A pause or exit never implies failure.

### Make Something

- Drawing, scrapbook, letter, photo strip, bucket list, or shared plan.
- Supports drafts and mutually approved final saving.

### Surprise Us

- Selects only from activities both partners allow.
- Respects available time, permissions, accessibility, intensity, and recently played items.
- Shows why an option was chosen in simple terms.

---

## 10. Activity integration framework

Every activity should feel like part of one Cupidot-led system.

### Standard lifecycle

1. **Invitation** — name, tone, expected time, permissions, and privacy notes.
2. **Ready check** — both partners can join without one controlling the other.
3. **Private phase** — choosing, writing, or drawing with no partner leakage.
4. **Locked phase** — readiness is visible; private content remains sealed.
5. **Shared phase** — synchronized reveal, play, discussion, or creation.
6. **Completion** — clear outcome with replay, next activity, rest, and save choices.
7. **Recovery** — refresh or reconnect restores the correct phase.

### Cupidot guidance modes

| Mode   | Behavior                                                                        |
| ------ | ------------------------------------------------------------------------------- |
| Quiet  | Only privacy, synchronization, error, and recovery guidance.                    |
| Gentle | One introduction, important state guidance, and a completion response. Default. |
| Host   | Optional transitions, instructions, narration, and suggestions.                 |

### Activity-specific functions

- **Quiz/Match** — protects answers, coordinates locks and reveal, celebrates matches without shaming differences.
- **Draw Together** — signals active drawing, supports recoverable strokes, presents the combined artwork, offers keepsake saving.
- **Cards/Questions** — manages turn order, skips, intensity settings, and private-to-shared transitions.
- **Court/Debate** — keeps playfulness explicit and prevents real disputes from being framed as winners and losers.
- **Photobooth** — explains camera use, coordinates capture, offers retakes, and requires explicit save approval.
- **Letters** — preserves drafts privately and requires deliberate sending or shared reveal.
- **Date Planner** — handles preferences, shortlist, mutual choice, schedule, and optional ritual follow-up.
- **Bucket List/Passport** — converts ideas into jointly owned plans and celebrates completed experiences.
- **Scrapbook/Constellation** — organizes mutually saved memories without resurfacing sensitive content unexpectedly.

---

## 11. Sealed answers and synchronized reveal

This is a universal trust feature, not a one-off game animation.

### User flow

1. Each partner creates or selects their answer privately.
2. Locking confirms only that the answer is sealed.
3. The partner sees readiness, never content clues.
4. When both answers are locked, Cupidot announces a shared ready state.
5. An authorized reveal produces one common event and timestamp.
6. Both clients display the same revealed state.
7. Refresh restores sealed or revealed status correctly.

### Information that must stay hidden before reveal

- Answer text or image.
- Character count or drawing preview.
- Typing speed or editing history.
- Selected-option hint.
- Sentiment, topic, score, or similarity inference.
- Any AI-generated reaction derived from the answer.

### Failure handling

- If one lock fails, show that partner a retry without changing the other partner's sealed state.
- Duplicate lock and reveal requests are safe.
- Disconnecting does not expose content or reset the round.
- An invalid round returns both users to a clear recoverable state.

---

## 12. Rituals and recurring connection

Rituals are created by the couple and supported by Cupidot.

### Ritual examples

- Weekly date night.
- Goodnight check-in.
- Sunday memory review.
- Monthly photo or letter.
- One-question Wednesday.
- Reunion countdown.
- Time-zone overlap coffee.
- Anniversary tradition.

### Ritual creation

The couple chooses:

- Name and purpose.
- Frequency or flexible window.
- Time zone behavior.
- Reminder timing.
- Which partners receive reminders.
- Suggested activity or open-ended moment.
- Whether completion may create a memory seed.

### Healthy reminder rules

- Reminders say the ritual is available, never that a partner failed.
- Either partner can snooze or propose a new time.
- Missed rituals quietly return to the next window.
- Repeated dismissal offers to reduce or disable reminders.
- Cupidot never tells one partner that the other ignored a notification.

---

## 13. Keepsakes and memories

Cupidot helps preserve chosen moments while keeping creation and ownership explicit.

### Memory seed

After an eligible shared moment, Cupidot may prepare a temporary memory seed containing only safe shared data:

- Activity name and date.
- Mutually revealed result or selected highlight.
- Couple-approved caption.
- Selected artwork or media.
- Optional shared mood chosen by the couple.

A seed is not permanent until the required save approval is complete.

### Save destinations

- Scrapbook page.
- Constellation milestone.
- Photo-strip collection.
- Activity gallery.
- Ritual timeline.
- Private downloadable card.
- This-room-only temporary memory.

### Mutual save flow

For intimate answers or jointly created content:

1. One partner proposes saving.
2. The other partner sees exactly what will be saved.
3. Both approve, edit, or decline.
4. Only the approved version becomes a keepsake.

Declining a keepsake is private and neutral; Cupidot should simply close the proposal without emotional commentary.

### Memory resurfacing

- Use opt-in “On this day” and memory review settings.
- Never surface deleted, separation-restricted, or sensitive memories in notifications.
- Show why a memory appeared.
- Provide hide, archive, export, and controlled-delete actions according to agreed lifecycle policy.

---

## 14. Partner presence and arrival

Presence supports coordination without becoming surveillance.

### Allowed shared states

- Here.
- Ready.
- Choosing.
- Writing.
- Drawing.
- Reconnecting.
- Away.

### Not displayed

- Exact last-seen tracking.
- Device, browser, IP address, or precise location.
- Whether the partner opened a push notification.
- Private screen or draft details.
- Multiple-tab noise.

### Arrival experiences

- One partner present: Cupidot offers solo preparation, browsing, or a calm waiting state.
- Second partner arrives: a brief reunion moment and one shared action.
- Partner reconnects: Cupidot confirms recovery and returns both to the same durable state.
- Both return after a long break: a warm welcome with no absence counter or guilt message.

---

## 15. Reactions and direct pet interaction

The couple can interact with Cupidot without opening a full conversation.

### Quick interactions

- Tap for a small acknowledgement.
- Long press for a compact action menu.
- Send an ephemeral heart, wave, cheer, or comfort reaction.
- Place a jointly unlocked object in the home.
- Invite Cupidot to host the current activity.
- Ask for one suggestion.
- Set Cupidot to quiet, cozy, or celebration mode for the session.

### Interaction limits

- Reactions are rate-limited to prevent visual spam.
- Ephemeral interactions are not stored as relationship analytics.
- Cupidot does not demand taps or care actions.
- Reduced-motion users receive calm visual and text equivalents.

---

## 16. Notifications

Notifications extend the shared-pet experience only when they are useful and consensual.

### Permitted notification types

- A mutually scheduled ritual is ready.
- A partner explicitly invited the user to a room or activity.
- A jointly created keepsake is ready for approval.
- An accepted date plan is approaching.
- An opted-in milestone or memory review is available.
- A security, privacy, or account action requires attention.

### Never send

- “Cupidot misses you.”
- “Your partner is waiting” unless they explicitly sent an invitation.
- Streak-loss warnings.
- Relationship-health scores.
- Sensitive answer or memory previews.
- Manipulative urgency.
- Multiple reminders for the same unfinished action.

### Controls

Each notification category has independent controls. Quiet hours and both partners' time zones are respected. Notification settings are personal; one partner cannot enable notifications on the other's behalf.

---

## 17. Date-night journey

### Before the date

- Cupidot shows the planned time and simple preparation needs.
- Partners can adjust duration, mood, permissions, and activity preferences.
- The room can be created or resumed without duplicate active rooms.

### Arrival

- Each partner joins the couple-owned room.
- Cupidot shows clear partner-level presence.
- A private setup panel covers sound, motion, AI, camera, and microphone.

### During the date

- Cupidot keeps transitions short.
- The couple can pause, skip, switch energy, or enter Quiet Together.
- Reconnection restores the durable state rather than restarting.
- Cupidot reacts to shared events without exposing hidden content.

### Ending

- One completion moment.
- Optional keepsake review.
- One choice: continue, plan the next ritual, or finish.
- Cupidot settles into a calm home state with no pressure to extend the session.

---

## 18. Time zones and long-distance support

- Store each partner's chosen time zone; do not infer or expose precise location.
- Show overlapping comfortable windows only when both opt in.
- Express dates in each partner's local time with clear labels.
- Allow asynchronous preparation but preserve synchronized reveal rules.
- Let a partner leave a small safe gift, home decoration, or explicit invitation.
- Do not reveal when a private draft was started or how long it took.
- Quiet Together and Quick Spark should work especially well for long-distance couples.

---

## 19. Accessibility and device behavior

### Motion

- Reduced motion removes continuous floating, shaking, parallax, particle bursts, and fast transitions.
- Important state changes remain understandable through text, icon, and color-independent signals.

### Audio and voice

- Muted, nonverbal chirps, and spoken-host modes are separate choices.
- Captions are always available.
- Important operations never depend on audio.
- Each partner controls audio locally.

### Input and navigation

- All pet and home actions are keyboard accessible.
- Touch targets remain comfortable on mobile.
- Focus never moves unexpectedly because Cupidot reacts.
- Screen readers hear meaningful state changes, not decorative chatter.

### Performance

- Use a lightweight character presentation appropriate to the device.
- Pause continuous rendering when hidden or off-screen.
- Load activity and home rewards progressively.
- Preserve a clean static fallback on weak or unsupported devices.

---

## 20. Safety, consent, and privacy controls

### Your Room, Your Rules panel

- AI assistance: off or on for the couple.
- Guidance: Quiet, Gentle, or Host.
- Voice/audio: independent personal setting.
- Motion: standard or reduced.
- Camera and microphone: purpose explained before permission.
- Keepsakes: ask every time; never silent auto-save.
- Memory resurfacing: off, manual, or selected categories.
- Ritual reminders: per-user categories and quiet hours.
- Surprise mode: allowed activity types and intensity.

### Hard product boundaries

Cupidot must not:

- Rank relationship quality or compatibility.
- Diagnose mental health or relationship problems.
- Take sides in real conflict.
- Pressure reconciliation, disclosure, intimacy, or forgiveness.
- Expose sealed answers or private drafts.
- Use camera, microphone, location, or media without explicit purpose and permission.
- Save intimate content automatically.
- reveal one partner's private settings to the other.
- Send private content to an AI provider without authorized, server-derived context and consent.

---

## 21. Error and recovery experience

Technical problems should feel like Cupidot is protecting the moment, not blaming the user.

| Situation                | User-facing response                                    | Recovery action                           |
| ------------------------ | ------------------------------------------------------- | ----------------------------------------- |
| Partner disconnects      | “Holding your place while they reconnect.”              | Pause, wait, or leave safely.             |
| Current user disconnects | “Bringing your room back.”                              | Reload snapshot and missing events.       |
| Duplicate action         | No duplicate celebration or content.                    | Confirm the original result.              |
| Out-of-order update      | “Catching up on one moment.”                            | Request and apply the missing sequence.   |
| AI unavailable           | Continue with curated Cupidot content.                  | Retry later without blocking the date.    |
| Media upload interrupted | Keep the upload staged, not saved as a broken keepsake. | Resume or discard.                        |
| Permission denied        | Explain which feature is unavailable.                   | Continue with an alternative.             |
| Room expired/completed   | Explain that the room is closed.                        | Return to Our Space or create a new room. |

Drafts should remain local until durable saving succeeds. Retried operations must not duplicate answers, events, strokes, rewards, notifications, or keepsakes.

---

## 22. Economy and monetization guardrails

If monetization is introduced later:

- Core connection activities, privacy controls, accessibility, and Cupidot's basic home remain usable without payment.
- Payment may unlock cosmetic themes, optional ambience, decorative collections, or expanded creation tools.
- No paid relationship score, better compatibility result, privileged emotional advice, or removal of artificial neglect penalties.
- Cupidot never becomes unhappy because a subscription ended.
- Both partners can preview shared-space purchases before permanent placement.
- Purchases must not reveal one partner's billing details to the other.

---

## 23. Measurement without intimacy surveillance

Measure whether the product works, not whether a relationship is “good.”

### Useful product metrics

- Our Space return rate.
- Percentage of sessions reaching a shared activity.
- Activity completion and voluntary skip rates.
- Recovery success after reconnect.
- Time from arrival to first shared action.
- Keepsake proposal and mutual-save completion rates.
- Ritual opt-in, snooze, reschedule, and mute rates.
- Accessibility-mode usage.
- Notification opt-out and complaint rates.
- Curated fallback success when AI is unavailable.

### Never measure or log

- Raw answers, letters, captions, question history, or media contents.
- Relationship-health, affection, conflict, or compatibility scores.
- Private typing or hesitation behavior.
- Invite codes, room codes, tokens, emails, or precise location.
- Hidden partner comparisons.

---

## 24. Feature boundaries with the other Cupidot documents

### Character Design receives

- The required mood set.
- Interaction and animation state names.
- Home zones and reward categories.
- Reduced-motion and fallback requirements.
- Required presentations: compact companion, full home presence, activity host, celebration, and quiet state.

This file does not decide Cupidot's anatomy, colors, clothes, facial construction, animation technique, or asset format.

### Intelligence & Behavior receives

- The allowed moments for speaking or suggesting.
- Guidance modes and privacy constraints.
- Safe shared event inputs.
- Notification and no-guilt rules.
- Activity transitions, fallback requirements, and user controls.

This file does not define exact lines, personality traits, prompt templates, model selection, memory-ranking logic, or safety response wording in full.

---

## 25. Local and live implementation boundary

### Local project work

- Shared-pet interface and home layout.
- Mood and product-state rendering.
- Activity wrapper and accessible interaction controls.
- Curated fallback content.
- Local device preferences and reduced-motion behavior.
- Client rendering of server-authorized room, reward, ritual, and keepsake state.
- Unit, browser, accessibility, and responsive tests.

### Live Supabase work

- Authoritative couple, room, session, ritual, reward, and keepsake state.
- Membership authorization and RLS.
- Ordered, idempotent activity events and recovery snapshots.
- Sealed-answer and synchronized-reveal operations.
- Private storage and mutual keepsake approval.
- Server-owned AI consent and authorized context.
- Notification scheduling, quotas, retention, and controlled lifecycle actions.

No backend migration or Edge Function source should be introduced into the local project under this plan.

---

## 26. Delivery roadmap

### Phase 1 — Shared-pet foundation

- Replace the mascot-only concept with a single shared Cupidot state model.
- Build the Cupidot home area in Our Space.
- Add safe mood states and arrival/reunion reactions.
- Add Quick Spark, Date Night, and Quiet Together entry points.
- Add Quiet, Gentle, and Host guidance controls.
- Ensure mobile, keyboard, screen-reader, and reduced-motion behavior.

**Exit gate:** Two partners can enter Our Space, understand Cupidot's state, and begin a shared moment without confusion or pressure.

### Phase 2 — Activities and recovery

- Apply the standard lifecycle to all supported activities.
- Standardize ready, private, locked, revealed, paused, completed, and recovering states.
- Complete refresh, duplicate-event, out-of-order, and reconnect recovery behavior.
- Add contextual Cupidot reactions to safe shared events.

**Exit gate:** A reference date-night flow survives refresh and temporary disconnection without exposing content or losing progress.

### Phase 3 — Growth and home

- Introduce growth sparks and the first three chapters.
- Add earnable home objects and activity souvenirs.
- Add home placement with undo and shared ownership rules.
- Add anti-grind caps and no-loss inactivity behavior.

**Exit gate:** Progress feels meaningful after varied shared moments and cannot be farmed or lost through absence.

### Phase 4 — Rituals and memories

- Add couple-created rituals, time-zone handling, reminders, snooze, and reschedule.
- Add memory seeds and mutual keepsake approval.
- Connect scrapbook, constellation, photobooth, and milestone views.
- Finalize separation, deletion, ownership, export, and recovery decisions before destructive operations.

**Exit gate:** A couple can create a ritual and save or decline a shared keepsake with clear consent and ownership.

### Phase 5 — Delight and personalization

- Expand reward collections, ambience, seasons, and pet interactions.
- Add long-distance gifts and invitations.
- Add carefully scoped memory resurfacing.
- Tune notification frequency and recommendation relevance from privacy-safe product signals.

**Exit gate:** Personalization makes the shared home feel distinct without creating pressure, clutter, or surveillance.

---

## 27. Acceptance checklist

### Core experience

- [ ] Cupidot clearly belongs to the couple's Our Space.
- [ ] One and two-partner arrival states are distinct and safe.
- [ ] The home always offers a clear next action.
- [ ] Quick Spark, Date Night, Quiet Together, Deep Connection, and Make Something have coherent entry flows.
- [ ] Returning after a long absence is warm and guilt-free.

### Pet loop

- [ ] Mood reflects safe product state rather than relationship judgment.
- [ ] Care interactions are optional and never prevent progress.
- [ ] Growth rewards variety and shared participation.
- [ ] No inactivity penalty or streak loss exists.
- [ ] Home rewards are meaningful without becoming clutter or competition.

### Activities and trust

- [ ] Activities share the same readiness, privacy, pause, completion, and recovery language.
- [ ] Sealed answers expose no metadata or inference before reveal.
- [ ] Reveal is synchronized and idempotent.
- [ ] Refresh and reconnect restore the correct durable state.
- [ ] AI failure never blocks an activity.

### Rituals and memories

- [ ] Ritual reminders are chosen, reschedulable, and non-judgmental.
- [ ] Sensitive keepsakes require mutual approval.
- [ ] Declining or skipping produces no emotional penalty.
- [ ] Resurfacing is opt-in and explainable.
- [ ] Ownership and deletion behavior is visible before saving.

### Accessibility and privacy

- [ ] Every important state is understandable without motion, color, or audio.
- [ ] Keyboard, touch, and screen-reader flows work.
- [ ] Cupidot never blocks primary mobile controls.
- [ ] Presence reveals no device or precise-location information.
- [ ] Private content, codes, identifiers, and media are excluded from logs.
- [ ] AI, voice, camera, media, and notifications have explicit controls.

---

## Final product test

Cupidot succeeds when both partners feel that they are returning to a small shared world that remembers only what they deliberately preserve, helps them find something meaningful to do together, survives real-life interruptions, and grows warmer through connection without ever judging the relationship.
