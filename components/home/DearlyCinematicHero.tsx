'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { FoldText } from '@/components/ui';
import { ShinyText } from '@/components/ui';
import { sounds } from '@/lib/sound';
import styles from './DearlyCinematicHero.module.css';

interface DearlyCinematicHeroProps {
  onExplore?: () => void;
  partnerA?: string;
  partnerB?: string;
  roomCode?: string[];
}

export function RevealMask({
  children,
  delay = 0,
  className = '',
  fade = false,
  active,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  fade?: boolean;
  active: boolean;
}) {
  return (
    <span className={`reveal-mask ${className}`}>
      <span
        className={`reveal-inner ${fade ? 'opacity-reveal' : ''} ${active ? 'revealed' : ''}`}
        style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
      >
        {children}
      </span>
    </span>
  );
}

export function ArrowDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 4V18M12 18L17 13M12 18L7 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DearlyCinematicHero({
  onExplore,
  partnerA = 'Me',
  partnerB = 'You',
}: DearlyCinematicHeroProps) {
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  // Animated cursor refs
  const blueCursorRef = useRef<HTMLDivElement>(null);
  const pinkCursorRef = useRef<HTMLDivElement>(null);

  // Start entrance animation on video ready or fallback
  useEffect(() => {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setActive(true);
    };

    const fallbackTimer = setTimeout(start, 900);
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', start, { once: true });
    }

    return () => {
      clearTimeout(fallbackTimer);
      if (video) video.removeEventListener('loadeddata', start);
    };
  }, []);

  // Floating Presence Cursors Wandering Motion
  useEffect(() => {
    let animId: number;
    let t = 0;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (width <= 600) return;

    let bX = width * 0.7;
    let bY = 220;
    let pX = width * 0.28;
    let pY = 320;

    let targetBX = bX;
    let targetBY = bY;
    let targetPX = pX;
    let targetPY = pY;

    const interval = setInterval(() => {
      t += 1;
      const w = window.innerWidth;
      targetBX = w * (0.42 + 0.36 * Math.sin(t * 0.65));
      targetBY = 140 + 220 * Math.abs(Math.cos(t * 0.48));
      targetPX = w * (0.16 + 0.35 * Math.cos(t * 0.58));
      targetPY = 180 + 200 * Math.abs(Math.sin(t * 0.72));
    }, 2400);

    const loop = () => {
      bX += (targetBX - bX) * 0.024;
      bY += (targetBY - bY) * 0.024;
      pX += (targetPX - pX) * 0.024;
      pY += (targetPY - pY) * 0.024;

      if (blueCursorRef.current) {
        blueCursorRef.current.style.transform = `translate3d(${bX}px, ${bY}px, 0)`;
      }
      if (pinkCursorRef.current) {
        pinkCursorRef.current.style.transform = `translate3d(${pX}px, ${pY}px, 0)`;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleStartExploring = () => {
    sounds.playPop();
    if (onExplore) {
      onExplore();
    } else {
      const playground = document.getElementById('interactive-playground');
      if (playground) {
        playground.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const wrapperCls = active ? styles.revealed : '';

  return (
    <>
      <Navbar variant="hero" />

      {/* ========================================================================= */}
      {/* 2. CINEMATIC HERO VIEWPORT (SLIDE 1)                                      */}
      {/* ========================================================================= */}
      <section
        ref={sectionRef}
        id="cinematic-hero"
        className={`${styles.heroSection} ${wrapperCls}`}
        aria-label="Dearly Us Cinematic Hero"
      >
        {/* Looping Ambient Video Window */}
        <video
          ref={videoRef}
          className={styles.videoBg}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/laoro/design.png"
        >
          <source src="/laoro/hero.mp4" type="video/mp4" />
          <source
            src="https://pub-59a4354e0fed40cd808b1a033087eafd.r2.dev/free/Laoro/hero.mp4"
            type="video/mp4"
          />
        </video>

        {/* Atmospheric & Romantic Gradients */}
        <div className={styles.overlayTop} />
        <div className={styles.overlayBottom} />
        <div className={styles.romanticGlow} />

        {/* Live Floating Couple Presence Cursors */}
        <div className={styles.cursorLayer} aria-hidden="true">
          <div
            className={`${styles.cursor} ${styles.cursorBlue}`}
            ref={blueCursorRef}
            style={{ opacity: active ? 1 : 0 }}
          >
            <svg width="26" height="30" viewBox="0 0 30 34" fill="none">
              <path
                d="M3 2 L3 28 L10 21 L15 31 L19 29 L14 19 L24 19 Z"
                fill="#60A5FA"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.cursorTag}>{partnerA}</span>
          </div>

          <div
            className={`${styles.cursor} ${styles.cursorPink}`}
            ref={pinkCursorRef}
            style={{ opacity: active ? 1 : 0 }}
          >
            <svg width="26" height="30" viewBox="0 0 30 34" fill="none">
              <path
                d="M3 2 L3 28 L10 21 L15 31 L19 29 L14 19 L24 19 Z"
                fill="#F472B6"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.cursorTag}>{partnerB}</span>
          </div>
        </div>

        {/* Main Hero Content */}
        <div className={styles.contentLayer}>
          <div className={styles.heroBottom}>
            {/* Eyebrow and shared-presence pill */}
            <div className={styles.eyebrowRow}>
              <RevealMask active={active} delay={400}>
                <span className={styles.eyebrowBadge}>
                  MADE FOR TWO · <ShinyText text="17 REALTIME ACTIVITIES" />
                </span>
              </RevealMask>

              <RevealMask active={active} delay={480}>
                <span className={styles.presencePill}>
                  Two places · one little world
                </span>
              </RevealMask>
            </div>

            {/* Headline and Narrative Copy */}
            <div className={styles.headlineRow}>
              <h1 ref={headlineRef} className={styles.headline}>
                <FoldText text={'Moments that\nbelong to you two.'} splitBy="line" trigger="mount" hinge="top" duration={0.72} stagger={0.12} perspective={850} creaseShading={0.38} />
              </h1>

              <p className={styles.narrativeCopy}>
                <RevealMask active={active} delay={850}>
                  A realtime sanctuary for couples bridging distance with 35+
                  interactive games, authentic Korean Life4Cuts photostrips, 3D
                  memory vaults, and intimate keepsakes.
                </RevealMask>
              </p>
            </div>

            {/* Glassmorphic Action Buttons */}
            <div className={styles.actionsRow}>
              <RevealMask active={active} delay={950} fade>
                <button
                  onClick={handleStartExploring}
                  id="hero-start-exploring-btn"
                  className={styles.glassBtnPrimary}
                  aria-label="Start Exploring Dearly Us"
                >
                  <span>Start Exploring</span>
                  <ArrowDownIcon className={styles.arrowIcon} />
                </button>
              </RevealMask>

              <RevealMask active={active} delay={1050} fade>
                <Link href="/activity" className={styles.glassBtnPink}>
                  Browse 17 Activities ▷
                </Link>
              </RevealMask>

              <RevealMask active={active} delay={1150} fade>
                <Link href="/photobooth" className={styles.glassBtnBlue}>
                  Open Photobooth 📸
                </Link>
              </RevealMask>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
