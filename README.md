# OurSpace ♡ (Angie Recreation)

> **Realtime online photobooth studio, multiplayer games, and dates for couples separated by distance.**  
> A faithful, pixel-perfect recreation of [getangie.com](https://getangie.com/).

[![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features & Pages

### 📸 Online Photobooth Studio (`/photobooth`)
- **Real Webcam & Simulated Duo Feed**: Switch seamlessly between live camera (`getUserMedia`) and dual-city couple simulation (Calgary & Jakarta).
- **6 Korean Frame Themes (*인생네컷*)**: Classic Clean White, Sunset Romance, Vintage Sepia Film, Cyber Neon, Soft Lavender, and Midnight Noir.
- **Synchronized 4-Shot Guided Session**: 3-2-1 countdown, flash animation, and romantic pose prompts.
- **Sticker Customizer & HD PNG Downloader**: Add stickers (💖, 🌸, 🫰, 👑), couple names, and export high-res photo strips directly to your camera roll.

### ❓ Know Me Quiz (`/quiz`)
- **17 Curated Question Packs**: Cute Starter, Deep & Intimate, Spicy & Wild (18+), Long Distance Life, Food & Dates, and more.
- **Dual Secret Lock-In & Synchronized Reveal**: Private answering interface preventing peeking until both partners click submit.
- **Compatibility Meter**: Live scoring, match gauge, and celebration confetti.

### 🎮 Activities Hub (`/activity` & Mini-Games)
- **Love Match (`/match`)**: 16-dimension personality compatibility test.
- **Truth or Dare (`/dare`)**: 20 minigames selector with fast-tap duel and penalty cards.
- **Honest Cards (`/cards`)**: 3D flipping card tiers with private reflection.
- **Our Future (`/future`)**: Interactive joint vision board creator with custom milestones.
- **Riddle Night (`/riddle`)**: Co-op brain teasers with hint system.
- **IQ Duel (`/iq`)**: Head-to-head timed logic and spatial pattern puzzles.
- **The Lab (`/lab`)**: Study date mode with Pomodoro timer and ambient soundscapes (rain, cafe, lofi).
- **Draw Together (`/draw`)**: Real-time dual sketchpad with brush and color tools.
- **Couples Court (`/court`)**: Playful dispute resolver with AI Judge Angie verdicts.
- **Couples Debate (`/debate`)**: 60-second timed argument rounds with camera on.
- **Snap Hunt (`/hunt`)**: 60-second home scavenger hunt with camera proof.
- **Arcade (`/arcade`)**: Retro face mini games (*Heart Jump*, *Asteroid Dodge*, *Berry Catch*).
- **Digital Scrapbook (`/scrapbook`)**: Washi-taped photo strips and journal notes.
- **Letters to the Future (`/letter`)**: Sealed time-capsule letters.
- **Birthday Gift Page (`/birthday`)**: Gift page generator with heart QR code.

### 🛍️ Print Shop (`/shop`)
- **Product Catalog**: Die-cut fridge magnets ($12), framed prints ($34), iPhone cases ($37), matching couple shirts ($42).
- **Split Dual-Address Shipping**: One order ships twin packs simultaneously to both partner addresses worldwide.
- **Interactive Checkout Flow**: Working checkout with order confirmation.

### 🎬 Creators, Blog & Campaigns
- **Creator Program (`/creators`)**: Lifetime pass submission form for TikTok/Instagram creators.
- **The Angie Blog (`/blog`)**: Complete editorial articles on long distance date ideas and tutorials.
- **Girlfriends Day (`/august`)**: Couples Day Date 7-step itinerary campaign.
- **Profile & Album (`/profile`)**: Manage partner names, cities, room code `KX7RM`, and saved photostrips album.
- **Legal (`/privacy`, `/terms`)**: Privacy policy & terms of service.

---

## 🎨 Design System & Aesthetics

- **Color Tokens**:
  - Paper: `#F8F9FB`
  - Ink: `#17181C`
  - Pink: `#FF7BA3`
  - Blue: `#5FA0FF`
  - Cream: `#FFFBF6`
  - Line: `#E7E9EE`
- **Typography**: Pretendard, Space Mono, and Playfair Display serif fonts.
- **Animations**: Live floating presence cursors, orthographic world map with pulsing Calgary-Jakarta arcs, progressive photobooth frame development (`lit`), and synchronized 9-second quiz timeline.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>=22.13.0`
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yushy07/ourspace.git
cd ourspace

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

---

## 👥 Contributors

- **Ayush** ([@yushy07](https://github.com/yushy07)) — Lead Developer & Creator
- **Angie Team** — Design & Product Inspiration

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
