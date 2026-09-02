// Angie Core Platform Type Definitions

export * from './passport';
export * from './sound';

export interface RoomStyle {
  id: string;
  label: string;
  sub: string;
  bg: string;
  color: string;
  border: string;
  accent: string;
  foilEffect?: 'holographic' | 'chrome' | 'matte-foil';
}

export interface PhotoboothLayout {
  id: string;
  name: string;
  cuts: number;
  aspect: string;
  desc: string;
}

export interface ArFilter {
  id: string;
  label: string;
  emoji: string;
}

export interface ColorFilter {
  id: string;
  name: string;
  filter: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  honestAnswerIndex: number;
}

export interface QuizPack {
  id: string;
  name: string;
  badge?: string;
  description: string;
  questions: QuizQuestion[];
}

export interface FashionRound {
  id: number;
  title: string;
  theme: string;
  twist: string;
  colorPalette: string[];
  inspiration: string;
}

export interface DatePlan {
  name: string;
  duration: string;
  mood: string;
  activities: { title: string; desc: string; href: string; icon: string; time: string }[];
  spotifyPlaylist: string;
}

export interface BlogPostData {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  author: string;
  content: string[];
  relatedActivities: { title: string; href: string; icon: string }[];
}

export interface CoupleProfile {
  nickname: string;
  partnerName: string;
  city1: string;
  city2: string;
  roomCode: string;
  anniversaryDate?: string;
}
