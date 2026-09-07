<div align="center">

  <img src="public/logo.svg" alt="Dearly Us Logo" width="460" />

  <h3><span style="color: #437EEB;">Made for the moments that belong to you two.</span></h3>

  <p>
    An intimate realtime date night sanctuary for couples separated by distance or sharing screens together.<br/>
    Synchronized Korean Life4Cuts photobooths, 3D interactive memory keepsakes, dual-blind quizzes, daily love forecast, and live date games.
  </p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15%2B_%2F_Vinext-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
    <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Vitest-5.0-FCC72B?style=for-the-badge&logo=vitest" alt="Vitest" /></a>
    <a href="https://playwright.dev/"><img src="https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright" alt="Playwright" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-437EEB?style=for-the-badge&logo=apache" alt="License Apache 2.0" /></a>
  </p>

  <br/>

  <img src="public/og.png" alt="Dearly Us Couple Date Night Preview" width="100%" style="border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.15);" />

</div>

---

## 🌸 About Dearly Us

Long distance dates often default to muted video calls or passive movie streaming. **Dearly Us** transforms screen-time into genuine connection:

- **Shared Rooms with Google Sign-In**: Create a profile, connect exactly one partner, and meet in a couple-authorized date-night lobby from any supported device.
- **Privacy by Design**: Camera feeds stay on the device. Shared activity events and deliberately saved keepsakes are protected by Supabase row-level security and private Storage policies.
- **Physical & Digital Keepsakes**: Export high-resolution 300 DPI *인생네컷* photostrips, printable thermal receipts of your quiz lore, 9:16 vertical Instagram Story cards, phone wallpapers, and digital time capsule envelopes.
- **Zero-Guilt Architecture**: No punishment streaks, no decay counters, and decay-free relationship milestones designed to bring comfort, not stress.

---

## 📸 Experience & Visual Gallery

<div align="center">
  <table>
    <tr>
      <td width="50%" align="center">
        <img src="public/photos/dearly-strip.jpg" alt="Physical Life4Cuts Photostrip" width="100%" style="border-radius: 12px;" />
        <br/><b>Korean Life4Cuts Physical Keepsakes</b>
      </td>
      <td width="50%" align="center">
        <img src="public/photos/quiz-duo.webp" alt="Know Me Couple Quiz Dual Screen" width="100%" style="border-radius: 12px;" />
        <br/><b>Know Me Double-Blind Couple Quiz</b>
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <img src="public/august/gate.webp" alt="Sanctuary Garden Gate" width="100%" style="border-radius: 12px;" />
        <br/><b>Curated Couple Night Sanctuary Journey</b>
      </td>
      <td width="50%" align="center">
        <img src="public/photos/magnet-fridge.webp" alt="Fridge Magnet Keepsakes" width="100%" style="border-radius: 12px;" />
        <br/><b>DIY Fridge Magnet &amp; Printables Studio</b>
      </td>
    </tr>
  </table>
</div>

---

## 🌟 Key Architecture & Capabilities

### 📸 1. Synchronized Photobooth 3.0 (`/photobooth`)
- **Realtime Flash & Countdown**: Synchronized 3..2..1 photo countdown across both screens with camera flash simulation.
- **Bespoke Frames**: Choose from *Dearly Us Rose & Alabaster*, *Retro Vintage Vinyl*, *Tokyo Midnight Cafe*, *Pastel Sakura*, and *Korean Minimalist*.
- **Animated Video Strips**: Exports looping animated `.webm` live strips directly from client canvas capture.

### 🧠 2. Adaptive Couple Quiz Engine (`/quiz`)
- **Double-Blind Lock-in**: Neither partner can peek at their partner's answer until both have clicked submit.
- **Adaptive AI with Consent**: Contextual question generation is only enabled after explicit in-product consent.
- **Vintage Thermal Date Lore Receipts**: Renders dot-matrix style thermal receipts summarizing your answers, match %, and couple lore for 1-click download.

### 🌍 3. Interactive 3D Earth Globe & Clock Sync (`/timezone`)
- **Orthographic 3D Projection**: Great-circle geodesic flight arcs between partner cities with concentric heartbeat pulses.
- **Dual Local Time Calculator**: Synchronized timezone slider showing overlapping waking hours.

### 🎵 4. Multi-Track Ambient Soundscape Synthesizer (`/date`, Global Dock)
- **5 Procedural Audio Channels**: *Attic Rain*, *Cozy Fireplace*, *Tokyo Midnight Cafe*, *90s Vinyl Needle*, and *Lo-Fi Chords* with real-time Web Audio API synthesis.

### 🕊️ 5. Cupidot: Shared Relationship Companion & Behavioral Brain (`/our-space`, `/profile`, Global Dock)
- **Draggable Floating Companion Dock**: Persists on-screen across routes with custom position storage (`useDraggableFixed`), voice mode toggle (*Chirp*, *TTS*, *Silent*), and keyboard-accessible modal dialogs.
- **Companion Moments System (`lib/cupidot-moments.ts`)**: 3 curated conversational moods (*Playful*, *Tender*, *Quiet*) with low-friction multiple-choice questions, witty bot reactions, and a no-repeat randomized draw pool.
- **Shared Pet Sanctuary in Our Space (`/our-space`)**: A decay-free relationship pet with 5 growth chapters, zero-punishment growth sparks, cozy decor items, custom rituals, relationship constellation, and memory weather.
- **Dual Presentation Engine**: 3D Three.js WebGL companion model with soft lighting alongside a lightweight, accessible 2D animated stage with walk cycles, reduced-motion support, and screen-reader announcements.
- **The Romance Spectrum & Safety Blueprint (`lib/cupidot-behavior.ts`)**: 6 intensity tiers (*Quiet*, *Warm*, *Romantic*, *Cheeky*, *Flirty*, *Spicy*) governed by a mutual consent ceiling (`min(levelA, levelB)`), session-scoped adult verification for sensitive tiers, and anonymous private intensity downgrades (*"Keeping things lighter."*).
- **Romantic Emergency Modal**: Immediate de-escalation tools, timeout breathers, and structured repair prompts.

### ⛅ 6. Daily Love Forecast & Story Keepsakes (`/forecast`)
- **Cross-City Synoptic Weather Report**: Live synthesized romantic weather forecast comparing partner cities, affection indices, severe romantic alerts, and daily relationship advice.
- **Web Speech Narration**: Built-in speech synthesis read-aloud featuring Cupidot's animated speaking states.
- **1-Click Story Card Exporter**: Generates high-resolution 1080×1920 (9:16) vertical story graphics with couple stamps and confetti animations for Instagram Stories or lock screens.

### 🏡 7. Our Space Sanctuary & Rituals Hub (`/our-space`, `/profile`)
- **Couple Rituals Engine**: Track daily morning & bedtime rituals, custom check-ins, and anniversary countdowns.
- **Relationship Constellation**: Visual map of milestones, keepsakes, and shared memories plotted across your journey.
- **Date Night Capsules**: Sealed time capsules and shared notes unlocked on custom anniversary dates.
- **Keepsake Approval Queue**: Mutual review workflow ensuring keepsakes are agreed upon before being saved to the permanent sanctuary album.

### ⚡ 8. Pluggable Activity Runtime & Multiplayer Adapters (`lib/activity-adapters/`, `lib/runtime/`)
- **Transport Abstraction**: Unified activity session runtime supporting real-time Supabase Broadcast/Presence channels with fallback to offline/mock adapters for rapid local development and automated testing.
- **Modular Game Adapters**: Standardized lifecycle interfaces (`onConnect`, `onEvent`, `onStateChange`) powering `/draw`, `/quiz`, `/dare`, and multiplayer minigames.

---

## 🎮 Application Route Directory

| Route | Feature & Activity |
| :--- | :--- |
| **`/`** | Homepage with 3D flight globe, live partner cursors, instant room generator, and photostrip showcase. |
| **`/activity`** | Complete 17+ multiplayer date night activity catalog. |
| **`/arcade`** | Face-avatar retro mini-games (*Heart Jump*, *Asteroid Dodge*, *Berry Catch*). |
| **`/august`** | Curated 7-step couple date night journey itinerary. |
| **`/birthday`** | Custom Birthday Gift Page generator with heart QR code. |
| **`/blog`** | Editorial blog with LDR date guides, ideas, and relationship advice. |
| **`/blog/:slug`** | Dynamic editorial article reader with scroll progress. |
| **`/bucket`** | 100 Dates Scratch-Off Checklist with progress bar and confetti. |
| **`/cards`** | Honest Cards with kinetic swipe deck and 3 intimacy levels. |
| **`/court`** | Playful couples dispute courtroom with AI Judge verdicts. |
| **`/creators`** | Creator community & date night video submission showcase. |
| **`/dare`** | Truth or Dare with 20 mini-games and fast-tap duels. |
| **`/date`** | Date Night Planner & Multi-track Ambient Soundscape Mixer. |
| **`/debate`** | 60-second timed debate challenge with video on. |
| **`/draw`** | Real-time dual shared canvas sketchpad. |
| **`/fashion`** | Couple PvP Fashion Runway with outfit voting. |
| **`/forecast`** | Daily Love Forecast with cross-city weather sync, read-aloud & 9:16 Instagram Story card exporter. |
| **`/future`** | 3-year vision board planner with custom milestones. |
| **`/host`** | "Third Wheel" Date Host game mode with playful observational commentary. |
| **`/hunt`** | 60-second home scavenger hunt with camera proof. |
| **`/invite/:token`** | Minimal invite preview, confirmation, and protected couple connection. |
| **`/iq`** | Head-to-head timed logic and spatial pattern duel. |
| **`/lab`** | Co-op study date mode with Pomodoro timer & soundscapes. |
| **`/letter`** | Time Capsule Letters with 3D wax seal cracking & unfolding envelope. |
| **`/login`** | Google-only sign-in with safe return-path handling. |
| **`/match`** | 16-dimension romance personality compatibility test. |
| **`/our-space`** | **Our Space Sanctuary**: Cupidot home area, decor shelf, shared rituals, relationship constellation, date night capsules & memory weather. |
| **`/passport`** | Official Love Passport with souvenir stamps and dual-city boarding pass. |
| **`/photobooth`** | Korean Life4Cuts (*인생네컷*) 4-shot synchronized photobooth studio. |
| **`/privacy`** | Transparent privacy policy and shared-room data disclosure. |
| **`/profile`** | Partner settings, romance spectrum consent controls, voice preferences & private room code. |
| **`/quiz`** | Know Me Quiz with secret lock-in, match scoring & Printable Thermal Receipt. |
| **`/riddle`** | Co-op brain teasers and riddle night puzzles. |
| **`/room/:code`** | Couple-authorized date-night lobby with Presence and readiness. |
| **`/scrapbook`** | Digital Memory Corkboard with 3D polaroids, flight stubs & washi tape. |
| **`/shirts`** | Digital matching outfit designer for date nights. |
| **`/shop`** | 100% Free DIY Printable Keepsakes (4×6 photo sheets, wallpapers, fridge magnets). |
| **`/terms`** | Terms of service and user conduct guidelines. |
| **`/timezone`** | Interactive 3D Earth Globe, geodesic flight arc, and couple clock sync. |
| **`/auth/callback`** | Supabase OAuth callback and automatic profile bootstrap. |
| **`/api/config`** | Realtime room config & status API endpoint. |
| **`/api/stats`** | Live global stats endpoint. |

---

## 🗂️ Project Structure

```
dearlyus/
├── app/                          # Next.js / Vinext application routes and pages
│   ├── (activities)/             # Interactive couple date games (photobooth, quiz, draw, court...)
│   ├── forecast/                 # Daily cross-city love weather forecast & story card export
│   ├── our-space/                # Canonical sanctuary hub & Cupidot home area
│   ├── profile/                  # Account settings, romance spectrum & room code
│   └── api/                      # Backend endpoints for stats, room configuration & callbacks
├── components/
│   ├── bot/                      # Cupidot companion, 2D/3D stages, moments dialog & emergency modal
│   ├── our-space/                # Sanctuary widgets: rituals, constellation, capsules, weather
│   ├── shared/                   # Reusable bars, ambient audio player, reaction bursts & confetti
│   └── ui/                       # Accessible UI components (buttons, badges, dialogs, tabs)
├── lib/
│   ├── activity-adapters/        # Standardized multiplayer activity adapters (quiz, draw, catalog)
│   ├── runtime/                  # Transport abstraction layer (Supabase vs Mock)
│   ├── cupidot-behavior.ts       # Romance spectrum rules, intent matching & consent bounds
│   ├── cupidot-moments.ts        # Conversational prompt deck across playful, tender & quiet moods
│   ├── voice.ts                  # Web Speech API engine & procedural chirp synthesizer
│   ├── use-draggable-fixed.ts    # Persistent viewport drag hook for the companion dock
│   ├── receipt-canvas.ts         # Thermal dot-matrix receipt canvas renderer
│   ├── couple.ts                 # Local & cloud couple state management
│   └── supabase.ts               # Supabase client & real-time connection helpers
├── data/                         # Curated local prompts, questions, and content packs
├── db/                           # Drizzle ORM schemas and database definitions
├── supabase/                     # Supabase migrations, storage policies & edge functions
├── tests/
│   ├── browser/                  # Playwright browser end-to-end specifications
│   ├── cupidot-moments.test.ts   # Companion moments deck & shuffle tests
│   ├── cupidot-behavior.test.ts  # Romance spectrum, intent dialogue & consent safety tests
│   ├── cupidot-pet.test.ts       # Growth chapter & spark progression tests
│   └── activity-adapters.test.ts # Multiplayer activity adapter contract tests
├── public/                       # 3D models, SVG assets, sound files, photo samples & fonts
└── docs/                         # Architecture guides, roadmaps, and feature specifications
```

---

## 🎨 Design System & Palette

Dearly Us utilizes a curated candlelight alabaster and plum-obsidian palette:

| Token | Hex Value | Role |
| :--- | :--- | :--- |
| `--paper` | `#FAF8F5` | Warm Candlelight Alabaster background |
| `--paper-subtle` | `#F3EFEA` | Soft linen contrast surface |
| `--ink` | `#1C1924` | Velvety Deep Plum-Obsidian typography |
| `--ink-soft` | `#6A6576` | Muted twilight body copy |
| `--line` | `#E8E2D9` | Delicate linen border hairline |
| `--pink` | `#FF4E78` | Rose Coral partner presence accent |
| `--blue` | `#437EEB` | Twilight Dusk Cerulean partner presence accent |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js `>=22.13.0`
- npm, pnpm, or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yushy07/dearlyus.git
cd dearlyus

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing & Verification
 
```bash
# Run unit & behavior tests (Vitest)
npm test

# Run browser end-to-end tests (Playwright)
npm run test:browser

# Run fast static linter (Oxlint)
npm run lint

# Format code (Oxfmt)
npm run format

# Type check the codebase
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 📄 License & Attribution

Licensed under the [Apache License, Version 2.0](LICENSE).  
Copyright © 2026 **Ayush Kant**. All rights reserved.

Designed & engineered with 💖 for couples making memories across any distance.
