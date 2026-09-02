// Couple Date Passport & Collectible Korean Souvenir Stamps System

export interface PassportStamp {
  id: string;
  title: string;
  koreanTitle: string;
  category: 'Photobooth' | 'Games & Duels' | 'Keepsakes' | 'Milestones';
  icon: string;
  color: string;
  inkColor: string;
  sealShape: 'circle' | 'square' | 'octagon' | 'crest';
  description: string;
  route: string;
  defaultUnlocked?: boolean;
}

export const PASSPORT_STAMPS: PassportStamp[] = [
  {
    id: 'life4cuts',
    title: 'Life4Cuts Master',
    koreanTitle: '인생네컷 인증',
    category: 'Photobooth',
    icon: '📷',
    color: '#FF7BA3',
    inkColor: '#E11D48',
    sealShape: 'circle',
    description: 'Took a synchronized Korean photobooth strip together across different screens.',
    route: '/photobooth',
    defaultUnlocked: true,
  },
  {
    id: 'know_me_quiz',
    title: 'Lore Master',
    koreanTitle: '연인 퀴즈 마스터',
    category: 'Games & Duels',
    icon: '🎯',
    color: '#5FA0FF',
    inkColor: '#2563EB',
    sealShape: 'crest',
    description: 'Scored 80%+ on the How Well Do You Know Me lore showdown.',
    route: '/quiz',
    defaultUnlocked: true,
  },
  {
    id: 'iq_duel',
    title: 'IQ Duel Titan',
    koreanTitle: '두뇌 대결 승리',
    category: 'Games & Duels',
    icon: '🧠',
    color: '#A855F7',
    inkColor: '#7C3AED',
    sealShape: 'octagon',
    description: 'Battled in a high-speed 60-second puzzle duel without hesitation.',
    route: '/iq',
    defaultUnlocked: true,
  },
  {
    id: 'date_host',
    title: 'Midnight Date Night',
    koreanTitle: '심야 데이트 주최',
    category: 'Milestones',
    icon: '🍷',
    color: '#F43F5E',
    inkColor: '#BE123C',
    sealShape: 'circle',
    description: 'Completed a 3-course interactive candlelit date scenario.',
    route: '/host',
    defaultUnlocked: false,
  },
  {
    id: 'time_vault',
    title: 'Time Vault Sealed',
    koreanTitle: '미래 타임캡슐',
    category: 'Keepsakes',
    icon: '💌',
    color: '#D97706',
    inkColor: '#B45309',
    sealShape: 'crest',
    description: 'Sealed a wax-stamped love letter to unlock on your next anniversary.',
    route: '/letter',
    defaultUnlocked: true,
  },
  {
    id: 'fashion_runway',
    title: 'Runway Royalty',
    koreanTitle: '패션쇼 런웨이',
    category: 'Photobooth',
    icon: '👗',
    color: '#EC4899',
    inkColor: '#DB2777',
    sealShape: 'square',
    description: 'Posed in matching streetwear and rated each other on the runway.',
    route: '/fashion',
    defaultUnlocked: false,
  },
  {
    id: 'timezone_reunion',
    title: 'Timezone Defier',
    koreanTitle: '시차 극복 인증',
    category: 'Milestones',
    icon: '🌍',
    color: '#059669',
    inkColor: '#047857',
    sealShape: 'circle',
    description: 'Synced both timezones and locked in a flight countdown.',
    route: '/timezone',
    defaultUnlocked: true,
  },
  {
    id: 'honest_cards',
    title: 'Deep Heart to Heart',
    koreanTitle: '솔직한 대화 카드',
    category: 'Keepsakes',
    icon: '🃏',
    color: '#E11D48',
    inkColor: '#9F1239',
    sealShape: 'octagon',
    description: 'Flipped 10 level-3 vulnerable questions without skipping.',
    route: '/cards',
    defaultUnlocked: false,
  },
  {
    id: 'draw_together',
    title: 'Canvas Picasso',
    koreanTitle: '합작 캔버스 완성',
    category: 'Games & Duels',
    icon: '🎨',
    color: '#8B5CF6',
    inkColor: '#6D28D9',
    sealShape: 'square',
    description: 'Collaborated on a live synchronized digital drawing.',
    route: '/draw',
    defaultUnlocked: false,
  },
  {
    id: 'bucket_list',
    title: '100 Dates Adventurer',
    koreanTitle: '100가지 데이트',
    category: 'Milestones',
    icon: '🗺️',
    color: '#0284C7',
    inkColor: '#0369A1',
    sealShape: 'crest',
    description: 'Checked off 5 real-world bucket list goals to do when reunited.',
    route: '/bucket',
    defaultUnlocked: false,
  },
  {
    id: 'arcade_avatar',
    title: 'Arcade Champion',
    koreanTitle: '아케이드 챔피언',
    category: 'Games & Duels',
    icon: '🕹️',
    color: '#10B981',
    inkColor: '#065F46',
    sealShape: 'circle',
    description: 'Played face-avatar multiplayer mini-games until 2 AM.',
    route: '/arcade',
    defaultUnlocked: false,
  },
  {
    id: 'love_match',
    title: 'Soulmate Chemistry',
    koreanTitle: '궁합 테스트 100%',
    category: 'Milestones',
    icon: '💖',
    color: '#FF7BA3',
    inkColor: '#E11D48',
    sealShape: 'crest',
    description: 'Tested compatibility matrix and scored Soulmate Resonance.',
    route: '/match',
    defaultUnlocked: true,
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
