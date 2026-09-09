'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Footer } from '@/components/shared/Footer';
import { ScrollProgress } from '@/components/ui';
import { sounds } from '@/lib/sound';
import { useCoupleProfile } from '@/lib/couple';
import '@/styles/home-editorial.css';
import {
  DearlyCinematicHero,
  CoPresenceBridge,
  InteractivePlayground,
  CuratedJourneyBand,
  RoomCodeJoiner,
  HomeActivitiesGrid,
  PhotoboothDemoStudio,
  HomeFaq,
} from '@/components/home';

export default function HomePage() {
  const homeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = homeRef.current;
    const hero = root?.querySelector('#cinematic-hero');
    if (!root || !hero) return;
    const observer = new IntersectionObserver(([entry]) => {
      root.dataset.belowHero = String(!entry.isIntersecting);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  const {
    partnerA,
    partnerB,
    cityA,
    cityB,
    roomCode: savedRoomCode,
  } = useCoupleProfile();

  const [roomCode, setRoomCode] = useState<string[]>([]);
  const [nickname, setNickname] = useState(partnerA);
  const [partnerName, setPartnerName] = useState(partnerB);

  useEffect(() => {
    setNickname(partnerA);
    setPartnerName(partnerB);
  }, [partnerA, partnerB]);

  useEffect(() => {
    if (savedRoomCode) setRoomCode(savedRoomCode.split(''));
  }, [savedRoomCode]);

  const scrollToPlayground = () => {
    sounds.playPop();
    const target = document.getElementById('interactive-playground');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={homeRef}
      className="slideshow-scroll-root"
      style={{ background: 'var(--paper)', minHeight: '100vh' }}
    >
      <ScrollProgress />

      {/* SLIDE 1: Molded Dearly Us Cinematic Hero */}
      <DearlyCinematicHero
        onExplore={scrollToPlayground}
        partnerA={nickname || 'Me'}
        partnerB={partnerName || 'You'}
        roomCode={roomCode}
      />

      <div className="home-editorial">
        {/* SLIDE 2: Interactive Couple Playground Stage (Globe & Photobooth Machine) */}
        <div id="interactive-playground" className="playground-slideshow-frame">
          {/* Seamless Experience Transition Bridge */}
          <CoPresenceBridge
            onExploreStage={() => {
              const topSec = document.getElementById('top');
              if (topSec) topSec.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Live Co-Presence Stage (Interactive 3D Globe & Photobooth Machine) */}
          <InteractivePlayground
            partnerA={nickname || 'You'}
            partnerB={partnerName || 'Love'}
            cityA={cityA || 'Calgary'}
            cityB={cityB || 'Jakarta'}
            roomCode={roomCode}
          />
        </div>

        {/* Curated Date Night Sanctuary Band */}
        <CuratedJourneyBand />

        {/* Closer Headline, Interactive Code Joiner & Social Proof Stats */}
        <RoomCodeJoiner roomCode={roomCode} setRoomCode={setRoomCode} />

        {/* Activities Hub Directory */}
        <HomeActivitiesGrid />

        {/* Photobooth Live Interactive Showcase & DIY Keepsakes */}
        <PhotoboothDemoStudio
          partnerA={nickname || 'You'}
          partnerB={partnerName || 'Love'}
          cityA={cityA || 'Calgary'}
          cityB={cityB || 'Jakarta'}
          roomCode={roomCode}
        />

        {/* Modern FAQ Studio & Support */}
        <HomeFaq />

        {/* Footer */}
        <Footer brandTone="light" />
      </div>
    </div>
  );
}
