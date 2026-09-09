'use client';

import { usePathname } from 'next/navigation';
import { AudioPlayer } from './AudioPlayer';
import { ReactionBursts } from './ReactionBursts';
import { ClickSpark } from '@/components/ui/ClickSpark';
import { CupidotCompanion } from '@/components/bot/CupidotCompanion';

export function GlobalExperience() {
  const pathname = usePathname();
  const isAuthScreen = pathname === '/login' || pathname.startsWith('/auth/');

  // The booth owns its camera, audio and pose controls; keep faces unobstructed.
  if (pathname === '/photobooth') return null;

  if (isAuthScreen) return <ClickSpark />;

  return (
    <>
      <AudioPlayer />
      <ReactionBursts />
      <ClickSpark />
      <CupidotCompanion />
    </>
  );
}
