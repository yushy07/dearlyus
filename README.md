<div align="center">

  <img src="public/logo.svg" alt="Dearly Us Logo" width="460" />

  <h3>Made for the moments that belong to you two.</h3>

  <p>
    An intimate realtime date night sanctuary for couples separated by distance or sharing screens together.<br/>
    Synchronized Korean Life4Cuts photobooths, 3D interactive memory keepsakes, dual-blind quizzes, and live date games.
  </p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15%2B-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
    <a href="https://webrtc.org/"><img src="https://img.shields.io/badge/WebRTC-P2P_Sync-333333?style=for-the-badge&logo=webrtc" alt="WebRTC" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-FF4E78?style=for-the-badge" alt="License MIT" /></a>
  </p>

  <br/>

  <img src="public/og.png" alt="Dearly Us Couple Date Night Preview" width="100%" style="border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.15);" />

</div>

---

## 🌸 About Dearly Us

Long distance dates often default to muted video calls or passive movie streaming. **Dearly Us** transforms screen-time into genuine connection:

- **Instant 1-Tap Connection**: No passwords, no credit cards, zero sign-up. Just share a private 5-letter room code (e.g., `KX7RM`).
- **Privacy by Design**: Live video feeds run peer-to-peer (WebRTC) between you and your partner. Your videos and photobooth cuts are never stored on cloud servers.
- **Physical & Digital Keepsakes**: Export high-resolution 300 DPI *인생네컷* photostrips, printable thermal receipts of your quiz lore, phone wallpapers, and digital time capsule envelopes.

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
- **Animated Video Strips**: Exports looping animated `.webm` live strips directly from the client canvas.

### 🧠 2. Adaptive Couple Quiz Engine (`/quiz`)
- **Double-Blind Lock-in**: Neither partner can peek at their partner's answer until both have clicked submit.
- **Sub-Second Adaptive AI**: Instant contextual question generation with offline-ready hand-crafted fallback packs.
- **Vintage Thermal Date Lore Receipts**: Renders dot-matrix style thermal receipts summarizing your answers, match %, and couple lore for 1-click download.

### 🌍 3. Interactive 3D Earth Globe & Clock Sync (`/timezone`)
- **Orthographic 3D Projection**: Great-circle geodesic flight arcs between partner cities with concentric heartbeat pulses.
- **Dual Local Time Calculator**: Synchronized timezone slider showing overlapping waking hours.

### 🎵 4. Multi-Track Ambient Soundscape Synthesizer (`/date`, Global Dock)
- **5 Procedural Audio Channels**: *Attic Rain*, *Cozy Fireplace*, *Tokyo Midnight Cafe*, *90s Vinyl Needle*, and *Lo-Fi Chords* with real-time Web Audio API synthesis.

---

## 🎮 Complete 35-Route Directory

| Route | Feature & Activity |
| :--- | :--- |
| **`/`** | Homepage with 3D flight globe, live partner cursors, instant room generator, and photostrip showcase. |
| **`/activity`** | Complete 17+ multiplayer date night activity catalog. |
| **`/photobooth`** | Korean Life4Cuts (*인생네컷*) 4-shot synchronized photobooth studio. |
| **`/timezone`** | Interactive 3D Earth Globe, geodesic flight arc, and couple clock sync. |
| **`/quiz`** | Know Me Quiz with secret lock-in, match scoring & Printable Thermal Receipt. |
| **`/host`** | "Third Wheel" Date Host game mode with playful observational commentary. |
| **`/cards`** | Honest Cards with kinetic swipe deck and 3 intimacy levels. |
| **`/dare`** | Truth or Dare with 20 mini-games and fast-tap duels. |
| **`/date`** | Date Night Planner & Multi-track Ambient Soundscape Mixer. |
| **`/bucket`** | 100 Dates Scratch-Off Checklist with progress bar and confetti. |
| **`/scrapbook`** | Digital Memory Corkboard with 3D polaroids, flight stubs & washi tape. |
| **`/letter`** | Time Capsule Letters with 3D wax seal cracking & unfolding envelope. |
| **`/birthday`** | Custom Birthday Gift Page generator with heart QR code. |
| **`/fashion`** | Couple PvP Fashion Runway with outfit voting. |
| **`/shirts`** | Digital matching outfit designer for date nights. |
| **`/shop`** | 100% Free DIY Printable Keepsakes (4×6 photo sheets, wallpapers, fridge magnets). |
| **`/august`** | Curated 7-step couple date night journey itinerary. |
| **`/match`** | 16-dimension romance personality compatibility test. |
| **`/arcade`** | Face-avatar retro mini-games (*Heart Jump*, *Asteroid Dodge*, *Berry Catch*). |
| **`/draw`** | Real-time dual shared canvas sketchpad. |
| **`/court`** | Playful couples dispute courtroom with AI Judge verdicts. |
| **`/debate`** | 60-second timed debate challenge with video on. |
| **`/lab`** | Co-op study date mode with Pomodoro timer & soundscapes. |
| **`/hunt`** | 60-second home scavenger hunt with camera proof. |
| **`/future`** | 3-year vision board planner with custom milestones. |
| **`/riddle`** | Co-op brain teasers and riddle night puzzles. |
| **`/iq`** | Head-to-head timed logic and spatial pattern duel. |
| **`/profile`** | Couple settings (names, cities, room code `KX7RM`, saved album). |
| **`/creators`** | Creator community & date night video submission showcase. |
| **`/blog`** | Editorial blog with LDR date guides, ideas, and relationship advice. |
| **`/blog/:slug`** | Dynamic editorial article reader with scroll progress. |
| **`/privacy`** | Transparent privacy policy & WebRTC security pledge. |
| **`/terms`** | Terms of service and user conduct guidelines. |
| **`/api/config`** | Realtime room config & status API endpoint. |
| **`/api/stats`** | Live global stats endpoint. |

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
- Node.js `>=20.0.0`
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

### Verification & Production Build

```bash
# Type check the codebase
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 📄 License & Attribution

This project is licensed under the [MIT License](LICENSE).  
Made with 💖 for couples making memories across any distance.
