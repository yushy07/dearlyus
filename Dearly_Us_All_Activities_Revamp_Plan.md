# Dearly Us — Complete Activities Revamp Plan

**Status:** Proposed implementation roadmap  
**Scope:** All 24 activities currently listed in `/activity`  
**Primary target:** Fully refined desktop experience first, followed by responsive adaptation  
**Product direction:** Romantic, tactile, editorial, playful, and clearly made for couples. Avoid neon gradients, generic dashboards, interchangeable cards, and decorative animation without purpose.

---

## 1. Outcome

Every activity should feel like a complete date with a beginning, a shared moment, and something meaningful at the end. A couple should always understand:

1. what they are about to do;
2. whether their partner is present and ready;
3. whose turn it is;
4. what has been saved or synchronized;
5. how to recover after a refresh or disconnect;
6. what keepsake or memory they can take away.

The revamp will preserve the strongest current work, especially the completed photobooth, activity catalogue artwork, Dearly Us logo, Supabase room model, shared runtime, and Our Space keepsakes. Each activity will receive its own visual metaphor, motion language, interaction rhythm, result screen, and replay loop.

---

## 2. Non-negotiable product rules

- The entire project remains free. Do not add paid APIs, paid TURN relays, billing-required trials, or services that automatically become paid.
- Desktop is completed and visually approved before responsive/mobile work begins.
- Use the existing ivory, rose, plum, muted sage, ink, paper, wood, fabric, and warm-shadow language. Animation should feel physical: paper unfolding, a stamp landing, a token moving, a lamp warming, or a card turning.
- Do not use neon colour washes, generic glass dashboards, excessive gradients, random floating blobs, or identical card grids across activities.
- Couple data must use private rooms, row-level security, and private Storage. Local storage may support solo/demo behavior but must not pretend to be shared state.
- AI remains optional and consent-gated. Every AI-assisted activity needs a strong curated offline path.
- A disconnect must never silently erase a round. Restore the last authoritative snapshot and explain what happened in plain language.
- Every competitive activity must use server-authoritative scoring or mutually verifiable events.
- Every creation activity must offer undo, recovery, and a clear save/download path.
- Reduced motion, keyboard use, readable focus states, and meaningful screen-reader updates are part of completion.
- Backend changes are applied and verified directly in the live Supabase project. Do not create local migration or Edge Function source as a substitute for live configuration.
- Work is delivered through small, reviewable commits and pushes between milestones.

---

## 3. Current audit summary

| Activity | Current strength | Main gap to close | Revamp priority |
|---|---|---|---|
| The Photobooth | Most complete paired experience | Real two-device QA and smaller refinements | Stabilize |
| Know Me Quiz | Rich packs, secret answers, receipts | Transport defaults to mock; round ceremony can improve | Flagship |
| Letters to the Future | Strong wax-seal concept and voice recording | Shared authorship, reliable vault state, reveal ceremony | Flagship |
| Truth or Dare | Large content set and several minigames | One coherent shared round system and fair scoring | Flagship |
| Honest Cards | Strong intimate prompt format | Mutual pacing, answer safety, shared reflection keepsake | Flagship |
| Date Host | Useful structured prompts and optional AI | A real host-led evening arc rather than isolated prompts | Major |
| The Arcade | Three playable canvas games | True simultaneous competition, fairness, distinct game feel | Major |
| Digital Scrapbook | Tactile corkboard direction | Collaborative canvas, asset recovery, export fidelity | Flagship |
| Love Match | Existing questions and scoring | Private simultaneous answers and richer result explanation | Major |
| IQ Duel | Clear local puzzle loop | Shared timer, fair lock-in, more puzzle variety | Major |
| Riddle Night | Simple cooperative puzzles | Clue economy, team roles, progressive mystery structure | Major |
| The Lab | Focus timer and ambience | Shared study room, rituals, breaks, session record | Major |
| The Great Debate | Topics, timer, result scorecard | Synchronized turns, evidence cards, fair voting | Major |
| Couples Court | Memorable theme and adapter | Better case-building, mutual consent, verdict keepsake | Flagship |
| Draw Together | Functional canvas and adapter | Robust synchronized strokes, prompts, replay, exports | Flagship |
| Snap Hunt | Camera capture and prompts | Private proof exchange, synchronized rounds, fair judging | Major |
| Our Future | Flexible vision board | Shared editing, timelines, commitments, Our Space link | Flagship |
| Birthday Gift | Focused surprise-page idea | Private drafting, scheduling, reveal and export | Major |
| Fashion Show | Multi-round runway and scorecards | Real partner submissions, blind voting, stronger outfit builder | Major |
| Matching Shirts | Customizer and PNG export | Paired design roles, print accuracy, reusable templates | Improve |
| Love Forecast | Distinct report and story export | Honest inputs, shared daily ritual, less synthetic copy | Improve |
| Timezone & Reunion | Globe, clocks, packing list | Correct time model, shared reunion planning, milestones | Flagship |
| 100 Dates Bucket List | Large checklist and scratch interaction | Shared authoritative progress, proof, planning flow | Major |
| Date Night Planner | Plans, steps, timer and ambience | Collaborative planning, live execution, recovery | Flagship |

---

## 4. Shared foundation before individual page redesigns

### 4.1 One activity shell

Build a reusable desktop activity shell with:

- branded header and a calm route back to the catalogue;
- activity-specific title treatment and physical scene;
- partner presence and connection status;
- room code/invite controls where appropriate;
- stage indicator such as `Invite → Ready → Play → Remember`;
- shared error, reconnect, pause, and restore panels;
- activity guidance from Cupidot that stays secondary to the activity;
- a persistent result/keepsake rail on wide desktop screens;
- a proper solo/demo label when no live room exists.

The shell supplies structure without making every activity look the same. Each activity owns its central stage, props, transitions, and result artwork.

### 4.2 Shared session contract

Move all paired activities onto the existing activity runtime and live Supabase transport. The common contract should support:

- create, join, ready, start, pause, resume, complete, replay, and close;
- monotonically increasing revisions and idempotent event IDs;
- private per-person submissions for blind answers or votes;
- authoritative shared snapshot plus event history;
- host transfer if the original host leaves;
- heartbeat, expiry refresh, reconnect, and stale-edit recovery;
- activity-specific payload validation and size limits;
- explicit solo/demo mode that never claims a partner is synchronized;
- a free fallback for media-heavy activities using private uploads when direct video fails.

### 4.3 Shared result and keepsake contract

Every activity ends in one of four useful outputs:

- **Memory:** a private Our Space keepsake;
- **Artifact:** a PNG/PDF/card/receipt that can be downloaded;
- **Progress:** a saved plan, milestone, list, or timer record;
- **Replay:** a rematch or next-round summary with settings preserved.

The shared result layer will handle mutual approval, direct download for users without an Our Space, private Storage, preview parity, titles/captions, and activity metadata.

### 4.4 Shared safety and accessibility

- Intimacy level controls for Cards, Truth or Dare, Date Host, Quiz, Court, and Debate.
- Always-visible skip, pause, and “not comfortable answering” options with no score penalty.
- Content filters for sensitive topics and session-level consent.
- Captions/transcripts for recorded audio where the browser can provide them locally.
- Keyboard controls and non-drag alternatives for all canvas/board experiences.
- `prefers-reduced-motion` versions of every entrance, reveal, and celebration.
- Colour-independent player identity using names, icons, labels, and patterns.

---

## 5. Individual activity revamps

## 5.1 The Photobooth — `/photobooth`

### Product position

The photobooth is the reference standard for the rest of the catalogue: a complete invite-to-keepsake journey with a recognizable romantic identity.

### Changes

- Preserve the current entrance, paired four-shot countdown, upload fallback, shared-background composition, finishing desk, synchronized drawing, exact approval, PNG, postcard, 4 × 6 export, and Our Space saving.
- Add a compact reconnect tray showing which four local and remote frames are safely received.
- Add session restore wording that explains design state was recovered while lost local image pixels may need to be resent.
- Add an optional contact-sheet review before editing so couples can choose the best four from a larger capture set.
- Add three original Korean/Japanese booth-inspired frame treatments using paper, stamps, handwriting, and date marks rather than AR effects.
- Add a small keepsake history entry after save, with “make another strip” preserving the room and visual theme.
- Complete real two-account validation across separate networks, camera permissions, video failure, reconnect, resend, simultaneous editing, approval, download, and Our Space save.

### Completion gate

Both partners can complete a full session after a refresh or temporary disconnect, receive matching previews, approve the same revision, and save or download the same output.

---

## 5.2 Know Me Quiz — `/quiz`

### New experience

Turn the quiz into a private “answer, seal, reveal” ceremony rather than a normal form. Each question appears on a folded note. Both people write privately, seal their answer, and watch the two notes open together.

### Changes

- Keep the existing themed question packs and consent-gated adaptive question option.
- Replace mock-default paired behavior with the live activity session.
- Add lobby controls for pack, question count, pace, intimacy limit, and whether explanations are included.
- Never reveal either answer until both submissions are locked.
- Let each person add a short “why” after the reveal without changing the original answer.
- Score exact matches only where appropriate; use “same idea,” “surprised me,” and “tell me more” reactions for subjective answers.
- Add a shared score ribbon that separates factual match rate from conversation discoveries.
- Upgrade the receipt into a polished “Couple Lore Receipt” with funniest miss, strongest match, one new discovery, date, and both approvals.
- Restore the current question, locked submissions, reactions, score, and pack after reconnect.

### Completion gate

Two private answers cannot leak before reveal, refresh does not lose a locked answer, both clients see the same round and score, and the receipt matches the final result.

---

## 5.3 Letters to the Future — `/letter`

### New experience

Create a two-person writing desk where each person contributes a private page, optional voice note, and shared promise before sealing one time capsule.

### Changes

- Use a desk scene with two paper stacks, ink progress, a shared envelope, and a physical wax-seal finale.
- Add letter modes: “Open on a date,” “Open after a milestone,” and “Open when we need this.”
- Allow private drafts; the partner sees progress but cannot read content before both choose to share and seal.
- Support one shared cover note plus two private inner letters.
- Keep voice recording optional; show duration, playback, re-record, and whether the recording is uploaded.
- Encrypt or strictly isolate private letter assets through member-only storage and server-authorized open dates.
- Make the seal operation mutual and revision-bound. Any edit breaks the pending seal approval.
- Build a reveal ceremony with envelope opening, page unfolding, optional voice playback, and “remember this day” saving.
- Add timezone-safe unlock dates and clear handling when one partner is offline on opening day.

### Completion gate

Neither partner can access sealed content early, both can recover drafts, the unlock time is consistent across locations, and all approved media reopens reliably.

---

## 5.4 Truth or Dare — `/dare`

### New experience

Rebuild the page as a shared tabletop with one central spinner, two player tokens, and a round tray. Truth, dare, and minigame rounds use one authoritative turn engine.

### Changes

- Group content into Playful, Romantic, Deep, Chaotic, and Spicy-with-mutual-consent decks.
- Add mutual content-level selection before the first card.
- Synchronize spinner result, active player, card, timer, completion, skip, and score.
- Preserve the existing minigames but standardize their rules and results: rapid tap, stop at five seconds, memory sequence, reaction duel, and camera/photo challenge.
- Replace self-awarded points with partner confirmation or measurable server events.
- Add one free skip per round and unlimited comfort skips without shame language.
- Add rematch and “change the energy” controls without resetting the room.
- End with a playful challenge passport showing completed truths, dares, victories, and favourite reactions without storing sensitive answer text by default.

### Completion gate

Both clients always see the same turn and card, scores cannot diverge, timers share one deadline, and skipped sensitive prompts are not retained.

---

## 5.5 Honest Cards — `/cards`

### New experience

Make this a slow conversation ritual built around a physical deck, two private response spaces, and a shared reflection after both are ready.

### Changes

- Keep the scratch-foil reveal, but make it an optional tactile mode rather than the primary mechanic.
- Add deck choices: Everyday Us, Appreciation, Repair, Distance, Dreams, and Intimacy.
- Add a “just listen” response alongside written answers.
- Synchronize card draw, private answer readiness, reveal, reactions, follow-up, and next-card approval.
- Let a partner request “tell me more” or “hold this gently” after reveal.
- Keep optional AI follow-ups consent-gated; curated follow-ups must always work offline.
- Add a shared session bookmark so couples can stop and resume without losing the current card.
- Produce a minimal reflection keepsake containing chosen highlights only after both approve each included excerpt.

### Completion gate

Private drafts stay private, neither partner can force a reveal, both control saved excerpts, and reconnect returns to the same card and phase.

---

## 5.6 Date Host — `/host`

### New experience

Turn the host into a complete guided date with an opening check-in, three acts, optional intermission, and a closing ritual.

### Changes

- Add date moods: Cozy, Playful, Reconnecting, Celebrating, and Low-energy.
- Build an agenda from short activities: opening question, tiny challenge, story prompt, appreciation, and closing plan.
- Give Cupidot a small host podium and cue cards; keep the couple as the focus.
- Let either partner privately signal “change topic,” “lighter,” or “more meaningful.” Apply the gentler shared preference without exposing who selected it.
- Synchronize act, prompt, response readiness, timer, reactions, and skip decisions.
- Preserve optional AI tailoring only when both consent; use the current curated scenario set otherwise.
- End with a date receipt showing the acts completed, shared mood, favourite moment, and optional next-date promise.

### Completion gate

The entire hosted date can run without AI, preference changes stay private, both clients remain in the same act, and the closing receipt reflects only approved content.

---

## 5.7 The Arcade — `/arcade`

### New experience

Present the arcade as a warm miniature date-night cabinet with physical game cartridges, paired score displays, rematch tickets, and distinct audiovisual identity for each game.

### Changes

- Retain Heart Jump, Asteroid Dodge, and Berry Catch; give each clearer rules, tutorial, start countdown, pause, result, and replay.
- Add simultaneous play where suitable and alternating attempts where deterministic fairness is easier.
- Synchronize round seeds, start deadline, inputs/events, scores, pause, and finish.
- Validate scores from game events rather than accepting a final client number.
- Add latency-tolerant rendering: local movement stays immediate while verified scores synchronize.
- Add keyboard and touch controls, reduced particles, mute, and colour-independent hazards.
- Replace browser-only high scores with private couple records and per-game history.
- Produce a small arcade ticket after a best-of-three match.

### Completion gate

The same seeded round produces comparable conditions, verified scores match on both devices, pausing is fair, and reconnect cannot create duplicate results.

---

## 5.8 Digital Scrapbook — `/scrapbook`

### New experience

Create a shared tabletop with a large cork/fabric canvas, two live cursors, a side drawer of memories, and tactile layers such as photo paper, tape, stamps, notes, tickets, and pressed flowers.

### Changes

- Replace mock-only collaboration with live object synchronization and revision checks.
- Support photo upload, crop, rotate, resize, layer order, lock, duplicate, caption, and delete with undo/redo.
- Add distinct partner cursors and object ownership while dragging to prevent collisions.
- Save normalized geometry so layouts match across screens and exports.
- Add templates: Our Month, Trip Memory, Firsts, Distance Map, and Anniversary.
- Let users import approved Our Space keepsakes without making them public.
- Add autosave, offline draft recovery, asset upload state, and missing-asset repair.
- Export high-resolution landscape PNG and printable PDF; save the editable board snapshot separately from the rendered keepsake.

### Completion gate

Two people can edit different objects simultaneously, reconnect restores every layer and asset, undo remains predictable, and exported composition matches the shared canvas.

---

## 5.9 Love Match — `/match`

### New experience

Frame this as a personality constellation rather than a generic compatibility percentage. Each answer lights one relationship dimension and the final result shows where the couple naturally meets and where they complement each other.

### Changes

- Expand dimensions to affection, conflict repair, planning, spontaneity, communication, social energy, reassurance, routines, adventure, and future pace.
- Use private simultaneous answers and reveal each pair together.
- Remove judgmental “good/bad compatibility” wording. Explain matches, complements, and useful conversations.
- Let couples mark an answer as situational or discuss it before continuing.
- Synchronize questions, locks, reveals, reactions, and result calculation.
- Add a visual constellation result with three strongest alignments, two complementary differences, and one suggested date.
- Save results only with mutual approval and allow retaking after a meaningful interval.

### Completion gate

Answers remain blind until both lock, result calculation is deterministic, both screens show identical dimensions, and copy never presents a score as relationship diagnosis.

---

## 5.10 IQ Duel — `/iq`

### New experience

Build a compact “two desks, one puzzle clock” duel with simultaneous answers, fair deadlines, round categories, and satisfying solution reveals.

### Changes

- Expand beyond the current small puzzle set into logic, sequences, spatial rotation, estimation, memory, and lateral thinking.
- Generate a shared round seed and server deadline.
- Lock each answer privately; reveal both answer, response time, and explanation together.
- Score accuracy first and time second with a latency-safe grace window.
- Add best-of-five, cooperative, and no-timer modes.
- Include accessible non-visual alternatives for spatial questions.
- End with a desk-card score summary and rematch using different categories.

### Completion gate

Question order, deadline, answers, explanations, and score remain identical after refresh; network latency cannot determine the winner unfairly.

---

## 5.11 Riddle Night — `/riddle`

### New experience

Transform isolated riddles into a cooperative mystery envelope containing connected clues, physical evidence cards, and a final answer lock.

### Changes

- Offer 10-minute, 25-minute, and full mystery cases.
- Give partners complementary clue cards so talking is required, while keeping all clues accessible if playing solo.
- Add a shared notebook, answer proposals, clue pinning, and an agreed final submission.
- Use a limited hint ladder: nudge, stronger clue, and explanation, with transparent impact on the result.
- Synchronize case seed, clue ownership, notebook, hints, submissions, and completion.
- Add atmosphere without obscuring text: desk lamp, envelope opening, evidence string, and stamp reveal.
- Export a solved-case card with time, hints, and both detective names.

### Completion gate

No clue is permanently inaccessible, both partners can recover the case state, the final answer requires clear agreement, and hints work with keyboard/screen readers.

---

## 5.12 The Lab — `/lab`

### New experience

Reframe the existing timer as a calm shared focus room for study or remote work, with two desks, presence lamps, synchronized focus blocks, quiet check-ins, and a closing tea-break record.

### Changes

- Add presets for 25/5, 45/10, 60/15, and a custom session.
- Synchronize start, pause, resume, skip break, and end using one server deadline.
- Show each person’s presence, focus status, optional task label, and “back soon” state.
- Keep ambience local per person so volume and sound choices are never forced on the partner.
- Add low-pressure check-ins at start and end: intention, energy, and what was completed.
- Restore timers accurately from server time after sleeping tabs or reconnect.
- Add a shared focus log and private Our Space study-date keepsake without productivity guilt or streak decay.

### Completion gate

Both timers stay within one second after reconnect, background tabs recover from the authoritative deadline, local audio controls remain independent, and the session log is accurate.

---

## 5.13 The Great Debate — `/debate`

### New experience

Create a playful debate chamber with topic draw, side selection, preparation cards, timed statements, rebuttal, closing, and a jointly controlled verdict.

### Changes

- Add topic packs: Silly, Relationship Habits, Pop Culture, Food, Travel, and Big Questions.
- Let players choose sides or receive a fair random assignment from the server.
- Synchronize preparation, speaker, countdown, overtime, rebuttal, and finish.
- Add private evidence-note cards during preparation.
- Use peer voting on argument, creativity, and charm; do not fabricate an authoritative AI judgment.
- Optional AI may summarize revealed arguments only after consent and must be labelled as playful commentary.
- Add draw outcomes and “agree to disagree beautifully.”
- Export a newspaper-style debate clipping with the topic, best lines selected by each partner, and verdict.

### Completion gate

Turns and timers cannot overlap incorrectly, private notes remain private until shared, voting is mutual, and the result never presents AI opinion as fact.

---

## 5.14 Couples Court — `/court`

### New experience

Keep the courtroom theme but make it a safe, humorous structure for harmless disputes. The experience should encourage understanding, not declare one person objectively wrong.

### Changes

- Add a pre-case boundary confirming the issue is low-stakes and both want to play.
- Structure the case into complaint, response, evidence cards, cross-question, repair proposal, and mutual ruling.
- Allow preset harmless cases or a custom title with sensitive-content guidance.
- Synchronize every phase and keep unrevealed statements private.
- Replace “winner/loser” with outcomes such as One-time Exception, New House Rule, Alternate Turns, Tiny Apology, or Case Dismissed With Kisses.
- Let each partner veto or edit a proposed ruling before it becomes final.
- Produce a stamped ruling card and optionally add the agreed house rule to Our Space.
- Keep optional AI wording assistance consent-gated and never use it for high-stakes relationship advice.

### Completion gate

Either person can stop the case, no ruling is saved without both approvals, private drafts stay protected, and the final keepsake matches the mutually accepted wording.

---

## 5.15 Draw Together — `/draw`

### New experience

Build a proper two-person art table with a large shared paper surface, live partner cursor, clear brush feedback, prompt cards, and a replayable drawing history.

### Changes

- Move from mock-default transport to live synchronized strokes.
- Normalize points, smooth paths, limit payload size, batch events, and deduplicate stroke IDs.
- Add pen, marker, pencil, eraser, shape stamps, colour palettes, width, undo/redo, clear approval, and layer ownership.
- Support collaborative mode, split-canvas reveal, draw-and-guess, and finish-each-other’s-drawing.
- Add prompt decks and a mutually selected custom prompt.
- Show reconnect state and replay missing strokes from the authoritative snapshot.
- Export exact canvas PNG and a framed Our Space keepsake with prompt, date, and artist names.
- Add keyboard-accessible stamps and line/shape tools for users who cannot freehand draw.

### Completion gate

Fast simultaneous strokes remain smooth and ordered, both canvases converge after reconnect, destructive clear requires confirmation from both, and export matches the shared drawing.

---

## 5.16 Snap Hunt — `/hunt`

### New experience

Turn the current local camera prompt into synchronized remote scavenger rounds with private proof exchange, a common deadline, and playful partner judging.

### Changes

- Add hunt packs: Around Me, Colour Hunt, Memory Hunt, Tiny Treasure, Outside Walk, and Reunion Edition.
- Synchronize prompt reveal and server deadline.
- Each player captures or uploads one proof privately; reveal together when both submit or time expires.
- Use private Storage with automatic expiry for unsaved hunt photos.
- Let partners award creativity, speed, and “made me smile” reactions instead of self-awarded points.
- Add retake limits, camera-denied upload fallback, and honest transfer status.
- End with a contact-sheet keepsake containing only mutually approved photos.

### Completion gate

Both receive the same prompt and deadline, proof remains private until reveal, camera and upload paths both work, scores are agreed, and unapproved temporary photos expire.

---

## 5.17 Our Future — `/future`

### New experience

Create a shared planning wall where dreams become cards that move from “Someday” to “Exploring,” “Planning,” and “We did it.” Keep it hopeful and flexible rather than turning love into project management.

### Changes

- Replace local-only board state with couple-owned live data and optimistic revision checks.
- Add dreams for travel, home, work, family, pets, traditions, finances, creativity, and closing the distance.
- Let each person privately propose a dream, then reveal or pin it when ready.
- Add optional target season/date, first tiny step, location, photo, and note.
- Support drag, keyboard movement, filtering, archive, and undo.
- Add a gentle overlap view showing independently proposed dreams that match.
- Link completed dreams to Our Space milestones and related keepsakes.
- Export a tasteful yearly vision sheet without exposing private drafts.

### Completion gate

Concurrent edits do not overwrite each other, private proposals stay private, dates are timezone-safe, board state restores correctly, and completed dreams create one deduplicated milestone.

---

## 5.18 Birthday Gift — `/birthday`

### New experience

Build a private surprise workshop where one partner creates a polished birthday page from a letter, photos, voice note, coupons, and a final reveal moment.

### Changes

- Add gift templates with distinct physical metaphors: Wrapped Parcel, Memory Album, Birthday Newspaper, and Room of Little Things.
- Provide a section-based editor with live preview, reorder, hide, and autosave.
- Support private photo/audio uploads, compression, progress, and recovery.
- Add scheduled reveal with recipient timezone preview and a manual “reveal now” fallback.
- Generate a revocable private link available only to the intended recipient.
- Add a reveal sequence that respects reduced motion and never delays access unnecessarily.
- Allow download of a static keepsake after reveal and saving into Our Space.
- Clearly separate draft, scheduled, opened, and archived states.

### Completion gate

The recipient cannot see the draft early, scheduled time is correct in both timezones, missing media cannot publish silently, and the creator can revoke access.

---

## 5.19 Fashion Show — `/fashion`

### New experience

Create a remote runway challenge where both partners build a look from the same brief, lock submissions, reveal models together, and vote blindly before the scorecard opens.

### Changes

- Keep the three-round concept but replace fixed scores and placeholder opponent state with live submissions.
- Add an outfit builder using tops, bottoms, outerwear, shoes, accessories, palette, and optional uploaded wardrobe photo.
- Use original illustrated clothing assets with a paper-doll wardrobe feel.
- Synchronize brief, deadline, locked look, reveal, blind votes, reactions, and round score.
- Judge theme fit, creativity, and “would wear on our date”; prevent self-voting.
- Include relaxed untimed mode and cooperative “style one look together.”
- End with a runway programme keepsake containing both looks and the chosen next-date outfit.

### Completion gate

Submissions stay hidden until both lock, votes cannot be changed after reveal, scores match, uploaded wardrobe images remain private, and the keepsake uses the actual final looks.

---

## 5.20 Matching Shirts — `/shirts`

### New experience

Upgrade the single mockup editor into a paired mini design studio where each person controls one side of a matching set while shared elements remain linked.

### Changes

- Add front/back views, two shirt cuts, print-safe zones, and paired previews side by side.
- Provide original motifs: coordinates, connected line, split phrase, date stamp, tiny icons, and distance map.
- Let one partner edit the shared motif while each controls their shirt colour and fit.
- Add font choices that match the brand and proper text length/contrast checks.
- Synchronize design state and show who is editing each area.
- Export individual transparent print files plus one paired presentation mockup.
- Add a clear note that the files are DIY artwork and do not place merchandise orders.
- Save approved designs into Our Space for later re-download.

### Completion gate

Both shirt previews remain linked correctly, print exports have exact dimensions and transparent backgrounds, text stays inside the safe area, and no purchase flow is implied.

---

## 5.21 Love Forecast — `/forecast`

### New experience

Keep the romantic weather-bureau identity while grounding the report in the couple’s own check-ins rather than presenting invented readings as real data.

### Changes

- Ask each person for private energy, affection, stress, and availability check-ins.
- Reveal a shared “forecast” only after both submit, clearly framing it as a playful interpretation.
- Add conditions such as Soft Morning, Busy With Clear Skies, Reassurance Rain, Playful Front, and Rest Needed.
- Generate the prescription from transparent rules; optional AI can rewrite tone after mutual consent.
- Add local narration controls and accessible written equivalents.
- Synchronize one daily forecast per couple and prevent duplicate saves.
- Redesign the story card using the ivory/rose/plum editorial system and both local dates/cities.
- Add a seven-day private history focused on patterns without judgment or streak pressure.

### Completion gate

Inputs remain private, the result explains its playful basis, both partners see the same daily forecast, narration can be stopped, and exported text matches the visible card.

---

## 5.22 Timezone & Reunion — `/timezone`

### New experience

Combine the globe, dual clocks, shared-hours finder, reunion countdown, and packing list into one calm distance dashboard that feels like a travel desk rather than a utility screen.

### Changes

- Use IANA timezone identifiers instead of manually assumed hour offsets, including daylight-saving changes.
- Show a 24-hour overlap ribbon with sleep, work, free, and preferred call windows selected by each partner.
- Keep the 3D globe but reduce ornamental clutter and make city selection/search accessible.
- Add a reunion card with exact departure/arrival timezone display, flight-note fields, countdown, and calendar-file export.
- Move the packing list from local-only storage into shared couple state with per-item ownership and offline recovery.
- Add travel documents checklist without collecting passport or sensitive identity numbers.
- Link reunion dates to Our Space milestones and allow one approved airport/reunion keepsake.
- Add reduced-motion globe behavior and a fully usable text/list alternative.

### Completion gate

Times remain correct through daylight-saving boundaries, both partners see the same reunion date and packing state, and every globe action has a non-canvas alternative.

---

## 5.23 100 Dates Bucket List — `/bucket`

### New experience

Turn the checklist into a shared deck of date tickets. Couples can dream, shortlist, schedule, complete, and remember dates instead of merely toggling checkboxes.

### Changes

- Keep 100 curated ideas but organize them by At Home, Online, Outside, Creative, Food, Travel, Reunion, Free, and Low Energy.
- Replace local-only completion with authoritative couple state.
- Add Wishlist, Planned, Done, and Favourite states.
- Let either partner propose a date and the other accept, adjust, or save for later.
- Add budget, energy, weather, distance, and duration filters without promoting paid services.
- Preserve scratch-off delight for discovery, with a non-scratch accessible reveal button.
- On completion, attach an optional date, note, and approved keepsake.
- Add progress views based on memories and variety, avoiding pressure or streak language.

### Completion gate

Both clients show the same list state, simultaneous changes merge safely, scratch interaction is accessible, and completing a date creates at most one shared memory.

---

## 5.24 Date Night Planner — `/date`

### New experience

Make the planner the orchestration layer for the whole site: couples choose their energy and available time, build an evening together, and then run it as a synchronized itinerary.

### Changes

- Add private preference cards for time, mood, energy, conversation depth, camera comfort, and activity types.
- Reveal overlaps and offer three curated plans using only current Dearly Us activities and free at-home ideas.
- Let both partners add, remove, reorder, and approve itinerary steps.
- Save one authoritative plan with total time, optional break, and local start time for each city.
- During the date, synchronize the active step, timer, pause, skip, and completion.
- Deep-link into each activity with the same room/session and return to the next itinerary step afterward.
- Preserve progress after refresh and allow the date to continue on another device.
- End with a Date Night Receipt containing completed steps, favourite moment, and one next-date suggestion.

### Completion gate

Planning changes merge safely, both approve the same itinerary, activity transitions retain the room, timers recover correctly, and the final receipt contains only completed steps.

---

## 6. Activity catalogue and discovery improvements

The current `/activity` collection has unique illustrations and a strong physical-card direction. Improve discovery without replacing that identity:

- Add useful metadata to every activity: duration, energy, camera requirement, live/solo support, keepsake type, and conversation depth.
- Add filters for `10 minutes`, `no camera`, `low energy`, `make something`, `competitive`, `deep talk`, and `works solo`.
- Show “continue” for recoverable active sessions and “new” only for genuinely new experiences.
- Add a compact preview on hover/focus showing the real interaction rather than a generic promotional sentence.
- Ensure every illustration remains unique and tied to the activity’s central prop.
- Add curated sequences such as Quiet Night, Chaotic Rematch, Reconnect After a Hard Week, and Make a Keepsake.
- Keep the desktop gallery editorial and spacious. Do responsive restructuring only after desktop approval.

---

## 7. Supabase work required

Use a small set of reusable live backend contracts instead of a unique improvised table for every page:

1. **Activity sessions:** membership, host, status, activity type, current phase, revision, expiry, and timestamps.
2. **Activity participants:** side/role, ready state, heartbeat, last acknowledged revision, and reconnect metadata.
3. **Activity snapshots:** validated activity-specific JSON with strict size limits and optimistic revision checks.
4. **Private submissions:** server-isolated answers, votes, letters, or proofs that reveal only when the activity rules permit it.
5. **Activity events:** idempotent event IDs for ordered replay and diagnostics.
6. **Temporary assets:** private bucket paths, ownership, expiry, approval state, and cleanup rules.
7. **Keepsakes:** existing couple-scoped save and approval flow, extended with editable-source metadata where needed.
8. **Plans and milestones:** couple-owned structured records for Future, Timezone, Bucket List, and Date Planner.

For every live change, verify authenticated member access, outsider denial, anonymous denial, stale writes, payload limits, expiry, closure, reconnect, and cleanup. Keep media out of snapshots; store only metadata and private Storage paths.

---

## 8. Implementation sequence

### Phase 0 — Baseline and visual contract

- Capture desktop screenshots and interaction notes for all 24 activities.
- Record current functional paths, test coverage, runtime usage, persistence, and known broken states.
- Finalize shared activity-shell tokens and page-specific visual metaphors.
- Freeze the completed photobooth as the first reference baseline.

**Exit gate:** Every page has a before-state, target-state, user journey, data needs, and acceptance checklist.

### Phase 1 — Shared live foundation

- Complete the common Supabase session, participant, snapshot, private-submission, event, and recovery contracts.
- Upgrade `useActivityRuntime` to select live transport in a real room and mock transport only in explicit demo/solo mode.
- Add common ready, presence, reconnect, stale revision, expiry, pause, resume, close, and host-transfer UI.
- Add shared result/keepsake and temporary asset handling.

**Exit gate:** A reference test activity passes create/join, two clients, refresh, reconnect, stale write, close, and outsider-denial tests.

### Phase 2 — Flagship conversation activities

1. Know Me Quiz
2. Honest Cards
3. Truth or Dare
4. Date Host
5. Couples Court

These reuse private submissions, mutual reveal, turn state, consent, reactions, and receipt generation.

**Exit gate:** All five operate live with two accounts, no early answer leakage, deterministic recovery, and approved keepsakes.

### Phase 3 — Creative keepsake activities

1. Draw Together
2. Digital Scrapbook
3. Letters to the Future
4. Our Future
5. Birthday Gift
6. Matching Shirts

These reuse private asset upload, collaborative revisions, canvas normalization, undo/recovery, approval, and export.

**Exit gate:** Each artifact survives reconnect, matches its export, and respects private ownership and mutual approval.

### Phase 4 — Competitive and timed activities

1. The Arcade
2. IQ Duel
3. The Great Debate
4. Fashion Show
5. Snap Hunt
6. Riddle Night

These reuse server deadlines, seeded rounds, verifiable scoring, blind submissions, and rematch state.

**Exit gate:** Scores and timers match across separate networks, refresh cannot alter results, and latency does not decide outcomes unfairly.

### Phase 5 — Distance, planning, and rituals

1. Timezone & Reunion
2. Date Night Planner
3. 100 Dates Bucket List
4. Love Forecast
5. The Lab
6. Love Match

These reuse couple-owned plans, date/time handling, daily records, milestones, and long-lived shared state.

**Exit gate:** Dates and timezones are correct, concurrent edits merge, daily records do not duplicate, and completed plans connect to Our Space.

### Phase 6 — Photobooth stabilization and catalogue integration

- Run final two-device photobooth QA.
- Add the catalogue metadata, recovery entry points, preview interactions, and curated sequences.
- Align activity completion signals, Cupidot reactions, Our Space keepsakes, and passport achievements.

**Exit gate:** Every activity launches, completes, saves or downloads its result, and returns cleanly to the catalogue/date itinerary.

### Phase 7 — Responsive and accessibility pass

- Adapt approved desktop layouts to tablet and phone.
- Replace drag-only controls with touch and keyboard alternatives.
- Test reduced motion, zoom, screen readers, focus order, colour contrast, and camera/upload permissions.

**Exit gate:** Core journeys work at desktop, tablet, and phone widths without changing the approved desktop identity.

---

## 9. Validation matrix for every activity

Each activity is complete only after the relevant checks pass:

- solo/demo launch is labelled honestly;
- two signed-in people can create and join;
- ready/start cannot race;
- private input remains private until permitted;
- simultaneous actions converge;
- refresh restores the current phase;
- temporary disconnect recovers without duplicate events;
- stale edits produce a clear recoverable message;
- expired and deliberately closed rooms are distinct;
- timers use a shared deadline;
- scores/results are deterministic;
- media denial has a usable upload or non-media path;
- temporary media is private and expires;
- result preview matches download;
- direct download works without Our Space;
- Our Space save works with correct ownership;
- repeated save does not create duplicates;
- keyboard and reduced-motion paths work;
- production build, type check, lint, focused tests, and relevant browser tests pass.

---

## 10. Commit and delivery strategy

Do not hold all work for one final push. Use small checkpoints such as:

1. shared session contract and live policies;
2. shared activity shell and recovery UI;
3. one activity’s complete live state flow;
4. that activity’s final desktop design;
5. its keepsake/export and tests;
6. two-account verification fixes;
7. next activity family.

Every checkpoint report must state:

- what behavior changed;
- which live Supabase changes were applied;
- tests and browser paths actually run;
- commit hash and pushed remote branch;
- anything that still requires a second account, separate network, camera, microphone, download manager, or production deployment.

---

## 11. Recommended first implementation milestone

Start with the shared live foundation and **Know Me Quiz** as the reference migration because it exercises the most reusable pieces: private submissions, mutual reveal, scoring, revision recovery, receipts, consent, and Our Space saving. After Quiz is proven with two accounts, apply the same foundation to Honest Cards, Truth or Dare, Date Host, and Couples Court before moving to canvas, media, and planning activities.

The Photobooth should remain stable during this foundation work except for confirmed bugs and the outstanding real two-device validation. Its completed visual and lifecycle structure becomes the quality bar for every later activity.
