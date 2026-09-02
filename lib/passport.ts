// Couple Date Passport & Collectible Korean Souvenir Stamps System with Romantic Notes

export interface PassportStamp {
  id: string;
  title: string;
  koreanTitle: string;
  category: 'Photobooth' | 'Games & Duels' | 'Keepsakes' | 'Milestones';
  icon: string;
  color: string;
  inkColor: string;
  pastelBg: string;
  sealShape: 'circle' | 'square' | 'octagon' | 'crest' | 'heart';
  description: string;
  sweetQuote: string;
  defaultMemory: string;
  stampAngle: number;
  route: string;
  defaultUnlocked?: boolean;
}

export const PASSPORT_STAMPS: PassportStamp[] = [
  {
    id: 'life4cuts',
    title: 'Life4Cuts Lovers',
    koreanTitle: '인생네컷 영원히 📸',
    category: 'Photobooth',
    icon: '📷',
    color: '#FF7BA3',
    inkColor: '#E11D48',
    pastelBg: '#FFF1F2',
    sealShape: 'heart',
    description: 'Captured synchronized vintage photo strips in your shared Korean photobooth.',
    sweetQuote: '“Two screens, two smiles, one timeless memory.”',
    defaultMemory: 'We took 4 silly poses and couldn’t stop laughing at the sticker props! 🎀',
    stampAngle: -4,
    route: '/photobooth',
    defaultUnlocked: true,
  },
  {
    id: 'love_match',
    title: 'Soulmate Resonance',
    koreanTitle: '운명적 궁합 100% 💖',
    category: 'Milestones',
    icon: '💖',
    color: '#FF7BA3',
    inkColor: '#BE123C',
    pastelBg: '#FFE4E6',
    sealShape: 'circle',
    description: 'Tested your romantic alignment and scored perfect soulmate resonance.',
    sweetQuote: '“Written in the stars, verified on date night.”',
    defaultMemory: 'Our communication and laughter frequencies matched at 99.8%! ✨',
    stampAngle: 3,
    route: '/match',
    defaultUnlocked: true,
  },
  {
    id: 'time_vault',
    title: 'Time Capsule Love',
    koreanTitle: '비밀 타임캡슐 💌',
    category: 'Keepsakes',
    icon: '💌',
    color: '#D97706',
    inkColor: '#B45309',
    pastelBg: '#FEF3C7',
    sealShape: 'crest',
    description: 'Sealed a wax-stamped secret letter to unlock on your upcoming reunion day.',
    sweetQuote: '“Words to keep you warm across oceans and seasons.”',
    defaultMemory: 'Sealed with digital gold wax to open on our 1-year anniversary! 🕊️',
    stampAngle: -6,
    route: '/letter',
    defaultUnlocked: true,
  },
  {
    id: 'know_me_quiz',
    title: 'Couple Lore Champions',
    koreanTitle: '우리 둘만의 퀴즈 🎯',
    category: 'Games & Duels',
    icon: '🎯',
    color: '#5FA0FF',
    inkColor: '#1D4ED8',
    pastelBg: '#EFF6FF',
    sealShape: 'crest',
    description: 'Answered deep lore questions about favorite memories and secret habits.',
    sweetQuote: '“Knowing you is my favorite ongoing study.”',
    defaultMemory: 'You remembered my favorite comfort food and how I drink morning coffee! ☕',
    stampAngle: 5,
    route: '/quiz',
    defaultUnlocked: true,
  },
  {
    id: 'timezone_reunion',
    title: 'Timezone Defiers',
    koreanTitle: '시차를 뛰어넘은 사랑 🌍',
    category: 'Milestones',
    icon: '✈️',
    color: '#059669',
    inkColor: '#047857',
    pastelBg: '#ECFDF5',
    sealShape: 'circle',
    description: 'Bridged miles and time zones to lock in your next reunion flight countdown.',
    sweetQuote: '“No distance can outlast the gravity of our love.”',
    defaultMemory: 'Counting down the exact days until we hold hands at airport gate 4B! 🧳',
    stampAngle: -2,
    route: '/timezone',
    defaultUnlocked: true,
  },
  {
    id: 'iq_duel',
    title: 'Smarty Duo Titans',
    koreanTitle: '두뇌 대결 챔피언 🧠',
    category: 'Games & Duels',
    icon: '🧠',
    color: '#A855F7',
    inkColor: '#7C3AED',
    pastelBg: '#FAF5FF',
    sealShape: 'octagon',
    description: 'Battled head-to-head in speed puzzles without missing a single beat.',
    sweetQuote: '“Best rivals in games, best partners in life.”',
    defaultMemory: 'The photo puzzle round came down to 0.4 seconds! Rematch next week ⚡',
    stampAngle: 4,
    route: '/iq',
    defaultUnlocked: true,
  },
  {
    id: 'date_host',
    title: 'Candlelight Rendezvous',
    koreanTitle: '낭만 심야 데이트 🍷',
    category: 'Milestones',
    icon: '🍷',
    color: '#F43F5E',
    inkColor: '#9F1239',
    pastelBg: '#FFF1F2',
    sealShape: 'circle',
    description: 'Hosted an AI-guided multi-course virtual dinner date by candlelight.',
    sweetQuote: '“Warm food in our hands, warm love in our hearts.”',
    defaultMemory: 'We ordered the same pasta and played Tokyo Cafe jazz in the background 🎷',
    stampAngle: -5,
    route: '/host',
    defaultUnlocked: false,
  },
  {
    id: 'honest_cards',
    title: 'Midnight Heart Talk',
    koreanTitle: '솔직 담백 카드 🃏',
    category: 'Keepsakes',
    icon: '🃏',
    color: '#E11D48',
    inkColor: '#881337',
    pastelBg: '#FFF1F2',
    sealShape: 'heart',
    description: 'Opened up through vulnerability cards and deep conversational prompts.',
    sweetQuote: '“Vulnerability is the purest form of romance.”',
    defaultMemory: 'We talked until 3:00 AM about our biggest childhood dreams 🌙',
    stampAngle: 6,
    route: '/cards',
    defaultUnlocked: false,
  },
  {
    id: 'draw_together',
    title: 'Picasso Sweethearts',
    koreanTitle: '사랑의 합작 캔버스 🎨',
    category: 'Games & Duels',
    icon: '🎨',
    color: '#8B5CF6',
    inkColor: '#5B21B6',
    pastelBg: '#F3E8FF',
    sealShape: 'square',
    description: 'Co-created a synchronized live sketch masterpiece together on one canvas.',
    sweetQuote: '“Painting our future with colors of joy.”',
    defaultMemory: 'You drew our dream little cottage with 2 golden retrievers 🐾',
    stampAngle: -3,
    route: '/draw',
    defaultUnlocked: false,
  },
  {
    id: 'fashion_runway',
    title: 'Runway Royalty',
    koreanTitle: '패션쇼 베스트 드레서 👗',
    category: 'Photobooth',
    icon: '👗',
    color: '#EC4899',
    inkColor: '#BE185D',
    pastelBg: '#FDF2F8',
    sealShape: 'square',
    description: 'Showcased matching couple outfits and walked the virtual fashion runway.',
    sweetQuote: '“Always matching in style and in soul.”',
    defaultMemory: 'That matching beige oversized hoodie outfit was an absolute 10/10! 🧸',
    stampAngle: 3,
    route: '/fashion',
    defaultUnlocked: false,
  },
  {
    id: 'bucket_list',
    title: '100 Dates Dreamers',
    koreanTitle: '100가지 버킷리스트 🎯',
    category: 'Milestones',
    icon: '🗺️',
    color: '#0284C7',
    inkColor: '#075985',
    pastelBg: '#F0F9FF',
    sealShape: 'crest',
    description: 'Checked off 5 real-world bucket list travel destinations to explore.',
    sweetQuote: '“Every destination is home when I’m with you.”',
    defaultMemory: 'Added Kyoto cherry blossom picnic & stargazing in Iceland to our list! 🌸',
    stampAngle: -4,
    route: '/bucket',
    defaultUnlocked: false,
  },
  {
    id: 'arcade_avatar',
    title: 'Arcade Companions',
    koreanTitle: '심쿵 아케이드 파트너 🕹️',
    category: 'Games & Duels',
    icon: '🕹️',
    color: '#10B981',
    inkColor: '#064E3B',
    pastelBg: '#ECFDF5',
    sealShape: 'circle',
    description: 'Teamed up with live webcam avatars in multiplayer mini-game duels.',
    sweetQuote: '“Every game is better in cooperative two-player mode.”',
    defaultMemory: 'You carried us in the bubble pop duel with a 15-combo streak! 🎮',
    stampAngle: 5,
    route: '/arcade',
    defaultUnlocked: false,
  },
];

export function getUnlockedStamps(): string[] {
  if (typeof window === 'undefined') return PASSPORT_STAMPS.filter(s => s.defaultUnlocked).map(s => s.id);
  try {
    const saved = localStorage.getItem('angie_unlocked_stamps');
    if (saved) return JSON.parse(saved);
    const defaults = PASSPORT_STAMPS.filter(s => s.defaultUnlocked).map(s => s.id);
    localStorage.setItem('angie_unlocked_stamps', JSON.stringify(defaults));
    return defaults;
  } catch {
    return PASSPORT_STAMPS.filter(s => s.defaultUnlocked).map(s => s.id);
  }
}

export function unlockPassportStamp(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getUnlockedStamps();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem('angie_unlocked_stamps', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getStampNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem('angie_stamp_notes');
    if (saved) return JSON.parse(saved);
    return {};
  } catch {
    return {};
  }
}

export function saveStampNote(stampId: string, note: string) {
  if (typeof window === 'undefined') return;
  try {
    const notes = getStampNotes();
    notes[stampId] = note;
    localStorage.setItem('angie_stamp_notes', JSON.stringify(notes));
  } catch {}
}
