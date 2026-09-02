import { RoomStyle, PhotoboothLayout, ArFilter, ColorFilter } from '@/types';

export const APP_NAME = 'Angie';
export const APP_TAGLINE = 'Fun dates & synced photobooth for long distance relationships';

export const ROOM_STYLES: RoomStyle[] = [
  { id: 'classic', label: 'Classic White', sub: '인생네컷 clean photo-paper border', bg: '#FFFFFF', color: '#17181C', border: '#E3E5EA', accent: '#FF7BA3' },
  { id: 'vintage', label: '1930s Automat', sub: 'Velvet curtains & automat marquee', bg: '#201715', color: '#F6EDE6', border: '#543E38', accent: '#FFD68A' },
  { id: 'kyoto', label: 'Kyoto Rain Veranda', sub: 'Wooden tea pavilion with raindrops', bg: '#1C2321', color: '#EEF0F2', border: '#4E6151', accent: '#70A9A1' },
  { id: 'vhs', label: '90s VHS Lounge', sub: 'Retro scanlines & analog cassette tape', bg: '#141115', color: '#F2E8CF', border: '#8A1C14', accent: '#FF6B6B' },
  { id: 'subway', label: 'Seoul Subway Car', sub: 'Warm train lighting over Han River', bg: '#232931', color: '#EEEEEE', border: '#4ECCA3', accent: '#4ECCA3' },
  { id: 'rooftop', label: 'Midnight Rooftop', sub: 'Starlit skyline & twinkling city lights', bg: '#0B0C10', color: '#C5C6C7', border: '#45A29E', accent: '#66FCF1' },
  { id: 'sunset', label: 'Sunset Romance', sub: 'Golden hour terrace over Seoul', bg: 'linear-gradient(180deg, #FFE4D6, #FFD6E8)', color: '#23242A', border: '#FFB3C7', accent: '#FF7BA3' },
  { id: 'cyber', label: 'Cyber Blue', sub: 'Neon city lights & futuristic grid', bg: '#101726', color: '#DCEBFF', border: '#5FA0FF', accent: '#5FA0FF' },
  { id: 'laundry', label: 'Retro Laundromat', sub: 'Cozy 90s indie date aesthetic', bg: '#F2EDE4', color: '#3A322D', border: '#D6C8B8', accent: '#E07A5F' },
  { id: 'karaoke', label: 'Tokyo Karaoke', sub: 'Neon disco stage & singing mic', bg: '#1E122C', color: '#F3EEFC', border: '#9D6EE8', accent: '#FF7BA3' },
  { id: 'holo', label: '🌈 Prism Holographic', sub: 'Iridescent spectral rainbow photocard', bg: 'linear-gradient(135deg, #FFD1DC 0%, #FFE4B5 25%, #D4F0FF 50%, #E8D7FF 75%, #FFD1DC 100%)', color: '#2C1B4D', border: '#E9D5FF', accent: '#C084FC', foilEffect: 'holographic' },
  { id: 'chrome', label: '🪞 Y2K Liquid Chrome', sub: 'High-gloss specular metallic mirror border', bg: 'linear-gradient(135deg, #CBD5E1 0%, #FFFFFF 30%, #94A3B8 50%, #FFFFFF 70%, #CBD5E1 100%)', color: '#0F172A', border: '#94A3B8', accent: '#38BDF8', foilEffect: 'chrome' },
  { id: 'velvet-foil', label: '✨ Midnight & Silver Foil', sub: 'Velvet obsidian with hot-stamped silver', bg: '#101216', color: '#FFFFFF', border: '#E2E8F0', accent: '#F8FAFC', foilEffect: 'matte-foil' },
  { id: 'noir', label: 'Midnight Noir', sub: 'Monochrome contrast studio film', bg: '#17181C', color: '#F8F9FB', border: '#33353D', accent: '#FFFFFF' },
  { id: 'vinyl', label: 'Vintage Vinyl Lounge', sub: 'Analog record shelves & amber lamp', bg: '#2B1E17', color: '#FDF0D5', border: '#780000', accent: '#C1121F' },
];

export const PHOTO_LAYOUTS: PhotoboothLayout[] = [
  { id: 'vertical', name: '4-Cut Vertical Strip (인생네컷)', cuts: 4, aspect: '1/3.4', desc: 'Classic 1x4 Korean booth strip' },
  { id: 'polaroid', name: '1-Shot Polaroid Keepsake', cuts: 1, aspect: '1/1.4', desc: 'Single hero frame with signature margin' },
  { id: 'duo', name: '2×1 Duo Frame', cuts: 2, aspect: '1/1.8', desc: 'Side-by-side wide portrait frames' },
  { id: 'grid', name: '2×2 Quad Grid', cuts: 4, aspect: '1/1.2', desc: 'Compact square 4-box layout' },
  { id: 'story', name: '6-Cut Film Story', cuts: 6, aspect: '1/4.2', desc: 'Extended 6-frame cinematic strip' },
  { id: 'stickers', name: '8-Piece Mini Sticker Sheet', cuts: 8, aspect: '1/2.8', desc: '8 mini-stamps on printable 4x6 sheet' },
];

export const AR_FILTERS: ArFilter[] = [
  { id: 'none', label: 'Natural / No AR', emoji: '✨' },
  { id: 'sparkles', label: 'Soft Glow & Sparkles', emoji: '🌟' },
  { id: 'hearts', label: 'Floating Heart Blush', emoji: '💖' },
  { id: 'cat', label: 'Cute Cat Ears & Nose', emoji: '🐱' },
  { id: 'bunny', label: 'Fluffy Bunny Ears', emoji: '🐰' },
  { id: 'halo', label: 'Angel Halo & Wings', emoji: '😇' },
  { id: 'shades', label: 'Retro Heart Sunglasses', emoji: '🕶️' },
];

export const COLOR_FILTERS: ColorFilter[] = [
  { id: 'natural', name: 'Natural', filter: 'none' },
  { id: 'warm35', name: 'Warm 35mm', filter: 'sepia(0.2) saturate(1.2) contrast(1.05)' },
  { id: 'tokyo', name: 'Tokyo Pastel', filter: 'brightness(1.08) saturate(1.15) hue-rotate(-5deg)' },
  { id: 'bw', name: 'B&W Film Grain', filter: 'grayscale(1) contrast(1.2) brightness(0.95)' },
  { id: 'cyber', name: 'Cyber Glow', filter: 'hue-rotate(15deg) saturate(1.3) contrast(1.1)' },
  { id: 'vintage80', name: 'Vintage 1980', filter: 'sepia(0.35) brightness(0.95) contrast(1.1)' },
  { id: 'golden', name: 'Golden Hour', filter: 'saturate(1.4) sepia(0.15) brightness(1.05)' },
  { id: 'emerald', name: 'Emerald Soft', filter: 'hue-rotate(-12deg) saturate(0.95) brightness(1.05)' },
];

export const STICKER_PALETTE: string[] = [
  '💖', '✨', '🫰', '🌸', '👑', '💌', '🎀', '🧸',
  '🌟', '💋', '🍓', '🍒', '🕊️', '💐', '💍', '🎬'
];

export const POSE_PROMPTS = [
  { id: 1, text: 'Shot 1: Big warm smile at each other! 📸', icon: '😊' },
  { id: 2, text: 'Shot 2: Silly cheek pucker or cheeky wink 😉', icon: '😜' },
  { id: 3, text: 'Shot 3: Half-finger heart meeting in the center 🫰', icon: '🫰' },
  { id: 4, text: 'Shot 4: Blow a kiss across the ocean or candle pose 🕯️', icon: '💋' },
  { id: 5, text: 'Bonus Shot: The dramatic gasp & hand on cheek 😱', icon: '🎭' },
  { id: 6, text: 'Bonus Shot: Double finger guns pew pew 🔫', icon: '😎' },
];
