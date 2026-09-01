import { DatePlan } from '@/types';

export const PREMADE_DATE_PLANS: Record<string, DatePlan> = {
  romantic: {
    name: 'Candlelight & Deep Chemistry',
    duration: '90 mins',
    mood: 'Romantic & Vulnerable',
    activities: [
      { title: 'Honest Cards Deck', desc: 'Break open deep questions you’ve never asked.', href: '/cards', icon: '💌', time: '25 min' },
      { title: 'Synced Photobooth', desc: 'Vintage 1930s Automat style with warm candle lighting.', href: '/photobooth', icon: '📸', time: '15 min' },
      { title: 'Letters to the Future', desc: 'Seal a time-capsule letter to read in 3 years.', href: '/letter', icon: '🕊️', time: '30 min' },
      { title: 'Our Future Vision Board', desc: 'Map out your dream home and honeymoon trip.', href: '/future', icon: '🏡', time: '20 min' },
    ],
    spotifyPlaylist: 'Cozy LDR Acoustic Love',
  },
  playful: {
    name: 'Chaotic Arcade & Runway Duel',
    duration: '60 mins',
    mood: 'Playful & Competitive',
    activities: [
      { title: 'Couples Quiz Duel', desc: 'Who knows who best? 17 packs with zero mercy.', href: '/quiz', icon: '❓', time: '20 min' },
      { title: 'Fashion Show Runway', desc: 'Outrageous styling briefs judged by AI.', href: '/fashion', icon: '👗', time: '20 min' },
      { title: 'Arcade Face Battle', desc: 'Flappy Face and Tetris showdown with real face avatars.', href: '/arcade', icon: '🕹️', time: '20 min' },
    ],
    spotifyPlaylist: 'Upbeat Indie Pop & Laughter',
  },
  chill: {
    name: 'Lazy Sunday Bed-Date',
    duration: '45 mins',
    mood: 'Low-Energy & Cozy',
    activities: [
      { title: 'Draw Together', desc: 'Pass the digital canvas back and forth.', href: '/draw', icon: '🎨', time: '20 min' },
      { title: 'Riddle Night', desc: 'Solve 10 clever brain-teasers side by side.', href: '/riddle', icon: '🧩', time: '15 min' },
      { title: 'Digital Scrapbook', desc: 'Paste recent photos and tape polaroids together.', href: '/scrapbook', icon: '📖', time: '10 min' },
    ],
    spotifyPlaylist: 'Lo-Fi Chillhop Beats for LDR',
  },
};
