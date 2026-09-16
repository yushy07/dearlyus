'use client';

import { usePathname } from 'next/navigation';
import { AudioPlayer } from './AudioPlayer';
import { ReactionBursts } from './ReactionBursts';
import { ClickSpark } from '@/components/ui/ClickSpark';
import { CupidotCompanion } from '@/components/bot/CupidotCompanion';

export function GlobalExperience() {
  const pathname = usePathname();
  const isAuthScreen = pathname === '/login' || pathname.startsWith('/auth/');

  // The booth needs an uncluttered camera workspace, but the music dock is still
  // useful there. Keep the companion and reaction controls out of the frame.
  if (pathname === '/photobooth') return <AudioPlayer />;

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
