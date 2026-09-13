'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useGesture } from '@use-gesture/react';
import { useMotionPreferences } from './MotionProvider';
import styles from './DomeGallery.module.css';

export type DomeGalleryImage = { src: string; alt?: string };

type DomeGalleryProps = {
  images: Array<string | DomeGalleryImage>;
  className?: string;
  grayscale?: boolean;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function DomeGallery({
  images,
  className = '',
  grayscale = false,
  maxVerticalRotationDeg = 11,
  dragSensitivity = 18,
}: DomeGalleryProps) {
  const { reducedMotion } = useMotionPreferences();
  const sphereRef = useRef<HTMLDivElement>(null);
  const rotation = useRef({ x: -2, y: 0 });
  const [opened, setOpened] = useState<DomeGalleryImage | null>(null);

  const normalized = useMemo(
    () => images.map((image) => typeof image === 'string' ? { src: image, alt: 'Shared memory' } : image).filter((image) => image.src),
    [images],
  );

  const tiles = useMemo(() => {
    if (!normalized.length) return [];
    return Array.from({ length: 30 }, (_, index) => {
      const row = Math.floor(index / 6);
      const column = index % 6;
      return { image: normalized[index % normalized.length], x: (column - 2.5) * 17, y: (row - 2) * 15 };
    });
  }, [normalized]);

  const applyRotation = useCallback(() => {
    if (sphereRef.current) sphereRef.current.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`;
  }, []);

  useEffect(() => applyRotation(), [applyRotation]);

  const bind = useGesture({
    onDrag: ({ movement: [mx, my] }) => {
      if (reducedMotion || opened) return;
      rotation.current = {
        x: clamp(-2 - my / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg),
        y: mx / dragSensitivity,
      };
      applyRotation();
    },
  }, { drag: { filterTaps: true }, eventOptions: { passive: false } });

  useEffect(() => {
    if (!opened) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpened(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opened]);

  if (!tiles.length) return null;

  return (
    <div className={`${styles.root} ${className}`.trim()} data-grayscale={grayscale || undefined}>
      <div className={styles.instructions}><span>Drag to wander</span><span>Select a memory to hold it close</span></div>
      <div className={styles.viewport} {...bind()} aria-label="Interactive globe of shared memories">
        <div ref={sphereRef} className={styles.sphere}>
          {tiles.map(({ image, x, y }, index) => (
            <button
              type="button"
              className={styles.tile}
              key={`${image.src}-${index}`}
              style={{ '--dome-x': `${x}deg`, '--dome-y': `${y}deg` } as CSSProperties}
              onClick={() => setOpened(image)}
              aria-label={`Open ${image.alt || 'shared memory'}`}
            >
              <img src={image.src} alt="" draggable={false} loading="lazy" />
            </button>
          ))}
        </div>
        <div className={styles.glass} aria-hidden="true" />
      </div>
      {opened && (
        <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={opened.alt || 'Shared memory'} onClick={() => setOpened(null)}>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={opened.src} alt={opened.alt || 'Shared memory'} />
            <figcaption>{opened.alt || 'A moment kept by you two'}</figcaption>
            <button type="button" onClick={() => setOpened(null)} aria-label="Close memory">×</button>
          </figure>
        </div>
      )}
    </div>
  );
}
