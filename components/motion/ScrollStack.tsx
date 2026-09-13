'use client';

import Lenis from 'lenis';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useMotionPreferences } from './MotionProvider';
import styles from './ScrollStack.module.css';

type ScrollStackItemProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  itemClassName?: string;
  as?: 'article' | 'div' | 'li';
};

export function ScrollStackItem({
  children,
  itemClassName = '',
  className = '',
  as: Element = 'article',
  ...props
}: ScrollStackItemProps) {
  return (
    <Element className={`${styles.card} ${itemClassName} ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}

export type ScrollStackProps = {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string | number;
  scaleEndPosition?: string | number;
  baseScale?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
};

type TransformState = { y: number; scale: number; rotation: number; blur: number };

export default function ScrollStack({
  children,
  className = '',
  itemDistance = 84,
  itemScale = 0.025,
  itemStackDistance = 24,
  stackPosition = '18%',
  scaleEndPosition = '9%',
  baseScale = 0.9,
  rotationAmount = 0.35,
  blurAmount = 0,
  useWindowScroll = true,
  onStackComplete,
}: ScrollStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lastRef = useRef(new Map<number, TransformState>());
  const completedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const { reducedMotion, pageVisible } = useMotionPreferences();

  const parsePosition = useCallback((value: string | number, height: number) => {
    if (typeof value === 'number') return value;
    return value.includes('%') ? (Number.parseFloat(value) / 100) * height : Number.parseFloat(value);
  }, []);

  const getLayoutTop = useCallback((element: HTMLElement) => {
    let top = 0;
    let current: HTMLElement | null = element;
    while (current) {
      top += current.offsetTop;
      current = current.offsetParent as HTMLElement | null;
    }
    return top;
  }, []);

  const update = useCallback(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || !pageVisible || window.innerWidth <= 760) return;
    const scroller = useWindowScroll ? document.documentElement : root;
    const scrollTop = useWindowScroll ? window.scrollY : root.scrollTop;
    const height = useWindowScroll ? window.innerHeight : root.clientHeight;
    const stackAt = parsePosition(stackPosition, height);
    const scaleEndsAt = parsePosition(scaleEndPosition, height);
    const end = root.querySelector<HTMLElement>(`.${styles.end}`);
    const rootTop = useWindowScroll ? 0 : getLayoutTop(root);
    const endTop = end ? getLayoutTop(end) - rootTop : scroller.scrollHeight;
    const pinEnd = endTop - height * 0.52;
    let topIndex = 0;

    cardsRef.current.forEach((card, index) => {
      const top = getLayoutTop(card) - rootTop;
      if (scrollTop >= top - stackAt - itemStackDistance * index) topIndex = index;
    });

    cardsRef.current.forEach((card, index) => {
      const top = getLayoutTop(card) - rootTop;
      const start = top - stackAt - itemStackDistance * index;
      const endScale = Math.max(start + 1, top - scaleEndsAt);
      const progress = Math.min(1, Math.max(0, (scrollTop - start) / (endScale - start)));
      const scale = 1 - progress * (1 - (baseScale + index * itemScale));
      const y = scrollTop >= start ? Math.min(scrollTop - top + stackAt + itemStackDistance * index, pinEnd - top + stackAt + itemStackDistance * index) : 0;
      const state: TransformState = {
        y: Math.round(Math.max(0, y) * 10) / 10,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(index * rotationAmount * progress * 10) / 10,
        blur: index < topIndex ? (topIndex - index) * blurAmount : 0,
      };
      const previous = lastRef.current.get(index);
      if (!previous || JSON.stringify(previous) !== JSON.stringify(state)) {
        card.style.transform = `translate3d(0, ${state.y}px, 0) scale(${state.scale}) rotate(${state.rotation}deg)`;
        card.style.filter = state.blur ? `blur(${state.blur}px)` : '';
        lastRef.current.set(index, state);
      }
      if (index === cardsRef.current.length - 1) {
        const complete = scrollTop >= start && scrollTop <= pinEnd;
        if (complete && !completedRef.current) onStackComplete?.();
        completedRef.current = complete;
      }
    });
  }, [baseScale, blurAmount, getLayoutTop, itemScale, itemStackDistance, onStackComplete, pageVisible, parsePosition, reducedMotion, rotationAmount, scaleEndPosition, stackPosition, useWindowScroll]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    cardsRef.current = Array.from(root.querySelectorAll<HTMLElement>(`.${styles.card}`));
    cardsRef.current.forEach((card, index) => {
      card.style.marginBottom = index < cardsRef.current.length - 1 ? `${itemDistance}px` : '0';
    });
    if (reducedMotion || window.innerWidth <= 760) return;

    const lenis = new Lenis(
      useWindowScroll
        ? { duration: 1.05, smoothWheel: true, syncTouch: false }
        : { wrapper: root, content: root.querySelector(`.${styles.inner}`) as HTMLElement },
    );
    lenis.on('scroll', update);
    const animate = (time: number) => {
      lenis.raf(time);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    const resize = new ResizeObserver(update);
    resize.observe(root);
    document.fonts.ready.then(update).catch(() => undefined);
    root.querySelectorAll('img').forEach((image) => image.addEventListener('load', update, { once: true }));
    update();
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      resize.disconnect();
      lenis.destroy();
      cardsRef.current.forEach((card) => {
        card.style.removeProperty('transform');
        card.style.removeProperty('filter');
        card.style.removeProperty('margin-bottom');
      });
      cardsRef.current = [];
      lastRef.current.clear();
    };
  }, [itemDistance, reducedMotion, update, useWindowScroll]);

  return (
    <div ref={rootRef} className={`${styles.scroller} ${reducedMotion ? styles.reduced : ''} ${className}`.trim()}>
      <div className={styles.inner}>
        {children}
        <div className={styles.end} aria-hidden="true" />
      </div>
    </div>
  );
}
