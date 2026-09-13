'use client';

import React from 'react';
import { SupabaseSessionProvider } from '@/contexts/SupabaseSessionContext';
import { CoupleSpaceProvider } from '@/contexts/CoupleSpaceContext';
import { ActiveRoomProvider } from '@/contexts/ActiveRoomContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { ActivitySessionProvider } from '@/contexts/ActivitySessionContext';
import { MotionProvider } from '@/components/motion/MotionProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseSessionProvider>
      <CoupleSpaceProvider>
        <ActiveRoomProvider>
          <PresenceProvider>
            <ActivitySessionProvider>
              <MotionProvider>{children}</MotionProvider>
            </ActivitySessionProvider>
          </PresenceProvider>
        </ActiveRoomProvider>
      </CoupleSpaceProvider>
    </SupabaseSessionProvider>
  );
}
