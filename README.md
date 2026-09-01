# OurSpace ♡ (Angie)

> **The ultimate realtime online photobooth studio, 3D multiplayer games, and date night sanctuary for couples separated by distance.**  
> A pixel-perfect, feature-expanded recreation and enhancement of [getangie.com](https://getangie.com/).

[![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 What's New & Core Capabilities

### 🧠 1. Ultra-Fast Adaptive Question Engine & Zero-Delay Local Fallback
- **Sub-Second Dynamic AI**: Powered by Gemini Flash with strict 1.2s timeout race + hand-crafted localized fallback packs. Zero latency, zero user-facing errors.
- **Background Pre-Fetching**: Invisible latency hiding during reveal animations across **Know Me Quiz** (`/quiz`), **Honest Cards** (`/cards`), and the **Third Wheel Date Host** (`/host`).

### 🧾 2. "Our Date Lore" Printable Vintage Thermal Receipts (`/quiz`, `/host`)
- **Thermal Canvas Renderer**: Custom dot-matrix monospace typography, jagged tear edges, itemized Q&A breakdown, sync %, `100% LOVE` subtotal, and 1-click high-res PNG download.

### 📸 3. Photobooth 3.0 Animated Live Strip Exporter (`/photobooth`)
- **Client-Side GIF & Video Sequencer**: Pure Canvas `captureStream` + `MediaRecorder` engine exporting looping `.webm` animated photostrips with 60ms camera flash transitions and Korean *인생네컷* frames.

### 🌍 4. Interactive 3D Earth Globe & Geodesic Reunion Flight Arc (`/timezone`)
- **3D Orthographic Projection**: Great-circle distance calculations (`11,420 km`), interactive mouse drag rotation, glowing city pins, and concentric heartbeat waves traveling between Calgary and Jakarta.

### 🎵 5. Multi-Track Ambient Soundscape Mixer 2.0 (`/date`, Global Dock)
- **5 Procedural Web Audio Synthesizers**: *Rain on Attic*, *Cozy Fireplace*, *Tokyo Midnight Cafe*, *90s Vinyl Needle Crackle*, and *Lo-Fi Piano Chords* with individual volume sliders and atmospheric presets.

### 🪄 6. Fluid Motion & Tactile Physics Suite
- **View Transitions API**: Seamless cross-page morphing between the Activity Directory and game rooms.
- **Kinetic Touch SwipeDeck**: Drag-and-swipe physics for card decks with angular tilt (`rotate(${deltaX * 0.08}deg)`).
- **Web Audio Micro-Haptics**: Real-time synthesized bubble pops, wooden ticks, and chime chords.
- **3D Wax Seal Envelope**: 3D embossed red wax stamp that fractures and unfolds in 3D perspective to reveal time capsule letters (`/letter`).

### 🌈 7. React Bits & MotionSites.ai Kinetic UI
- **Animated Border-Mask Badges (`GlowBadge`)**: 1px rotating radial gradient border mask with shimmering text.
- **Kinetic Bento Cards (`KineticCard`)**: Diagonal shimmer sweep beams (`animate-shimmer`) on hover.
- **ClickSpark**: 60fps canvas particle sparks on every pointer tap across the site.
- **SpotlightCard & TiltedCard**: Cursor-following radial glows and 3D parallax mouse tilt.

---

## 🎮 Complete 35-Route Inventory

| Route | Feature Description |
| :--- | :--- |
| **`/`** | Homepage with Aurora background, live couple cursors, spotlight activities & demo booth. |
| **`/activity`** | Activity Directory with 17 realtime multiplayer dates. |
| **`/photobooth`** | Korean Life4Cuts (*인생네컷*) 4-shot synchronized photobooth studio. |
| **`/timezone`** | Interactive 3D Earth Globe, geodesic flight path, and live couple clock sync. |
| **`/quiz`** | Know Me Quiz with secret lock-in, match scoring & Printable Thermal Receipt. |
| **`/host`** | "Third Wheel" Date Host game mode with observational AI commentary. |
| **`/cards`** | Honest Cards with kinetic swipe deck and 3 intimacy levels. |
| **`/dare`** | Truth or Dare with 20 mini-games and fast-tap duels. |
| **`/date`** | Date Night Planner & Ambient Soundscape Mixer. |
| **`/bucket`** | 100 Dates Scratch-Off Checklist with progress bar and confetti. |
| **`/scrapbook`** | Digital Memory Corkboard with 3D polaroids, flight stubs & washi tape. |
| **`/letter`** | Time Capsule Letters with 3D wax seal cracking & unfolding envelope. |
| **`/birthday`** | Custom Birthday Gift Page generator with heart QR code. |
| **`/fashion`** | Couple PvP Fashion Runway with outfit voting. |
| **`/shirts`** | Digital matching outfit designer for date nights. |
| **`/shop`** | 100% Free DIY Printable Keepsakes (4×6 photo sheets, wallpapers, fridge magnets). |
| **`/august`** | Curated 7-step Girlfriends Day couples date itinerary. |
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
| **`/creators`** | Creator program for TikTok / Instagram creators (Free Lifetime Pass). |
| **`/blog`** | Editorial blog with LDR date guides, ideas, and relationship advice. |
| **`/blog/:slug`** | Dynamic editorial article reader with scroll progress. |
| **`/privacy`** | Privacy policy. |
| **`/terms`** | Terms of service. |
| **`/api/config`** | Realtime room config & status API endpoint. |
| **`/api/questions/generate`** | Low-latency adaptive question generation endpoint with 1.2s timeout race. |
| **`/api/stats`** | Live global stats endpoint. |

---

## 🎨 Design Tokens

- **Paper Background**: `#F8F9FB`
- **Ink Primary**: `#17181C`
- **Couple Pink**: `#FF7BA3`
- **Couple Blue**: `#5FA0FF`
- **Warm Gold**: `#FFD68A`
- **Success Mint**: `#4ECCA3`
- **Cream Tint**: `#FFFBF6`
- **Line Border**: `#E7E9EE`

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>=22.13.0`
- npm or pnpm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yushy07/ourspace.git
cd ourspace

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

---

## 🤝 Contributors

Please see [CONTRIBUTORS.md](CONTRIBUTORS.md) for the list of maintainers and contributors.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
