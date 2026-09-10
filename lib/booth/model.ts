export type Side = 'left' | 'right';
export type Crop = { x: number; y: number; zoom: number; mirror: boolean };
export const DEFAULT_CROP: Crop = { x: 0, y: 0, zoom: 1, mirror: false };
export type Photo = {
  id: string;
  shotId: string;
  side: Side;
  src: string;
  crop: Crop;
};
export type Shot = { id: string; left?: Photo; right?: Photo };
export type Decoration = {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};
export type DrawPoint = { x: number; y: number };
export type DrawingStroke = {
  id: string;
  color: string;
  width: number;
  points: DrawPoint[];
};
export type BoothDesign = {
  layout: 'strip' | 'grid';
  theme: 'ivory' | 'rose' | 'ink' | 'sage';
  filter: 'natural' | 'mono' | 'film' | 'pastel';
  caption: string;
  date: string;
  composition: 'split' | 'backdrop';
  backdrop?: 'linen' | 'rose' | 'sage' | 'midnight';
  stickers: Decoration[];
  strokes: DrawingStroke[];
};
export const INITIAL_DESIGN: BoothDesign = {
  layout: 'strip',
  theme: 'ivory',
  filter: 'natural',
  caption: 'a little closer.',
  date: '',
  composition: 'split',
  stickers: [],
  strokes: [],
};
export const THEMES = {
  ivory: { paper: '#fff8eb', ink: '#493039' },
  rose: { paper: '#e9c2c5', ink: '#613d48' },
  ink: { paper: '#352a31', ink: '#fff2df' },
  sage: { paper: '#dce3d1', ink: '#475547' },
};
export const BACKDROPS = {
  linen: '#e8ded0',
  rose: '#d9b8ba',
  sage: '#bac6b5',
  midnight: '#464350',
};
export const FILTERS = {
  natural: 'none',
  mono: 'grayscale(1) contrast(1.08)',
  film: 'sepia(.18) saturate(.88) contrast(1.04)',
  pastel: 'saturate(.85) brightness(1.06)',
};
export const POSES = [
  'Lean towards the middle. Say hello.',
  'Make a heart that meets in the middle.',
  'Your most unserious face. Go.',
  'One last smile, just for them.',
];
export function completeShot(shot: Shot, solo = false) {
  return Boolean(shot.left && (solo || shot.right));
}
/** Approval belongs to the exact photos, crops and decorations being reviewed. */
export function approvalKey(shots: Shot[], design: BoothDesign) {
  return JSON.stringify({
    shots: shots.map((shot) => ({
      id: shot.id,
      photos: [shot.left, shot.right].map((photo) =>
        photo ? { id: photo.id, crop: clampCrop(photo.crop) } : null,
      ),
    })),
    design,
  });
}
export function putPhoto(shots: Shot[], photo: Photo): Shot[] {
  return shots.map((shot) =>
    shot.id === photo.shotId ? { ...shot, [photo.side]: photo } : shot,
  );
}
export function clampCrop(crop: Crop): Crop {
  return {
    x: Math.max(-1, Math.min(1, Number(crop.x) || 0)),
    y: Math.max(-1, Math.min(1, Number(crop.y) || 0)),
    zoom: Math.max(1, Math.min(2.5, Number(crop.zoom) || 1)),
    mirror: Boolean(crop.mirror),
  };
}
export function simplifyStroke(points: DrawPoint[], maxPoints = 72) {
  const clean = points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point) => ({
      x: Math.max(0, Math.min(1, point.x)),
      y: Math.max(0, Math.min(1, point.y)),
    }));
  if (clean.length <= maxPoints) return clean;
  const step = (clean.length - 1) / (maxPoints - 1);
  return Array.from(
    { length: maxPoints },
    (_, index) => clean[Math.round(index * step)],
  );
}
export function frameRects(layout: BoothDesign['layout']) {
  return layout === 'strip'
    ? Array.from({ length: 4 }, (_, i) => ({
        x: 30,
        y: 105 + i * 392,
        w: 540,
        h: 360,
      }))
    : Array.from({ length: 4 }, (_, i) => ({
        x: 30 + (i % 2) * 585,
        y: 95 + Math.floor(i / 2) * 357,
        w: 555,
        h: 325,
      }));
}
export function logicalSize(layout: BoothDesign['layout']) {
  return layout === 'strip'
    ? { width: 600, height: 1800 }
    : { width: 1200, height: 900 };
}
export function coverCrop(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  crop: Crop,
) {
  const c = clampCrop(crop),
    scale = Math.max(dw / sw, dh / sh) * c.zoom;
  const w = dw / scale,
    h = dh / scale;
  return { x: ((sw - w) * (c.x + 1)) / 2, y: ((sh - h) * (c.y + 1)) / 2, w, h };
}
