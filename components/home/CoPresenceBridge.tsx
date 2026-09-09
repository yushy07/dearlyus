'use client';

import React from 'react';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import styles from './CoPresenceBridge.module.css';

interface CoPresenceBridgeProps {
  onExploreStage?: () => void;
}

export function CoPresenceBridge({ onExploreStage }: CoPresenceBridgeProps) {
  const handleScrollToStage = (e: React.MouseEvent) => {
    e.preventDefault();
    sounds.playPop();
    if (onExploreStage) {
      onExploreStage();
    } else {
      const topSection = document.getElementById('top');
      if (topSection) {
        topSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const marqueeItems = [
    { text: '인생네컷 Life4Cuts Photobooth', highlight: 'pink', icon: '📸' },
    { text: 'Interactive 3D Distance Globe', highlight: 'blue', icon: '🌍' },
    {
      text: '35+ Realtime Couple Duels & Games',
      highlight: 'pink',
      icon: '🎮',
    },
    { text: 'Live Shared Audio & Spotify Sync', highlight: 'blue', icon: '🎵' },
    {
      text: 'Sealed Love Letters & Keepsake Vault',
      highlight: 'pink',
      icon: '💌',
    },
    {
      text: 'Instant Peer-to-Peer Sync · 0 Latency',
      highlight: 'blue',
      icon: '⚡',
    },
    {
      text: '100% In-Browser · No Apps to Install',
      highlight: 'pink',
      icon: '✨',
    },
  ];

  return (
    <section
      className={styles.bridgeContainer}
      aria-label="Dearly Us Feature Bridge"
    >
      <div className={styles.innerWrap}>
        {/* =================================================================== */}
        {/* 1. INFINITE LIVE VALUE-PROP & ROMANCE MARQUEE                       */}
        {/* =================================================================== */}
        <div className={styles.marqueeWrapper} aria-hidden="true">
          <div className={styles.marqueeTrack}>
            {/* Duplicated list for seamless infinite loop */}
            {[...marqueeItems, ...marqueeItems].map((item, idx) => (
              <div key={idx} className={styles.marqueeItem}>
                <span>{item.icon}</span>
                <span
                  className={
                    item.highlight === 'pink'
                      ? styles.highlightPink
                      : styles.highlightBlue
                  }
                >
                  {item.text}
                </span>
                <span className={styles.sparkleDot}>✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. 4-COLUMN SPOTLIGHT ACTIVITY & CAPABILITY CARDS                   */}
        {/* =================================================================== */}
        <div className={styles.cardsGrid}>
          {/* Card 1: Korean Life4Cuts Photobooth */}
          <Link
            href="/photobooth"
            className={styles.spotlightCardLink}
            onClick={() => sounds.playPop()}
            aria-label="Open Korean Life4Cuts Photobooth"
          >
            <div className={`${styles.card} ${styles.cardPink}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconEmblem} ${styles.emblemPink}`}>
                  📸
                </div>
                <span className={`${styles.cardBadge} ${styles.badgePink}`}>
                  Life4Cuts 인생네컷
                </span>
              </div>
              <h3 className={styles.cardTitle}>Dual-Cam Photostrip</h3>
              <p className={styles.cardDesc}>
                Snap 4-cut candid memories side-by-side with live filters,
                vintage frames, and stickers.
              </p>
              <div className={styles.cardFooter}>
                <span>Open Photobooth</span>
                <span className={styles.arrowRight}>↗</span>
              </div>
            </div>
          </Link>

          {/* Card 2: 3D Distance Globe */}
          <a
            href="#top"
            onClick={handleScrollToStage}
            className={styles.spotlightCardLink}
            aria-label="Explore Realtime 3D Globe Stage"
          >
            <div className={`${styles.card} ${styles.cardBlue}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconEmblem} ${styles.emblemBlue}`}>
                  🌍
                </div>
                <span className={`${styles.cardBadge} ${styles.badgeBlue}`}>
                  Live Flight Arc
                </span>
              </div>
              <h3 className={styles.cardTitle}>Distance & Timezone</h3>
              <p className={styles.cardDesc}>
                Spin the interactive 3D globe calculating exact distance between
                Calgary & Jakarta in realtime.
              </p>
              <div className={styles.cardFooter}>
                <span>Spin 3D Globe</span>
                <span className={styles.arrowRight}>↓</span>
              </div>
            </div>
          </a>

          {/* Card 3: 35+ Couple Duels */}
          <Link
            href="/activity"
            className={styles.spotlightCardLink}
            onClick={() => sounds.playPop()}
            aria-label="Browse 35+ Couple Activities"
          >
            <div className={`${styles.card} ${styles.cardPurple}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconEmblem} ${styles.emblemPurple}`}>
                  🎮
                </div>
                <span className={`${styles.cardBadge} ${styles.badgePurple}`}>
                  35+ Activities
                </span>
              </div>
              <h3 className={styles.cardTitle}>Play & Draw Together</h3>
              <p className={styles.cardDesc}>
                Late-night couple trivia, 2-player synchronized drawing, playful
                debates, and co-op duels.
              </p>
              <div className={styles.cardFooter}>
                <span>Pick an Activity</span>
                <span className={styles.arrowRight}>↗</span>
              </div>
            </div>
          </Link>

          {/* Card 4: Date Passport & Keepsakes */}
          <Link
            href="/passport"
            className={styles.spotlightCardLink}
            onClick={() => sounds.playPop()}
            aria-label="Open Couple Date Passport"
          >
            <div className={`${styles.card} ${styles.cardAmber}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconEmblem} ${styles.emblemAmber}`}>
                  💌
                </div>
                <span className={`${styles.cardBadge} ${styles.badgeAmber}`}>
                  Memory Vault
                </span>
              </div>
              <h3 className={styles.cardTitle}>Date Passport & Vault</h3>
              <p className={styles.cardDesc}>
                Preserve relationship milestones with 3D wax-sealed letters,
                digital stamps, and scrapbooks.
              </p>
              <div className={styles.cardFooter}>
                <span>View Passport</span>
                <span className={styles.arrowRight}>↗</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
