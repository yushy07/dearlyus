'use client';

import { CSSProperties, useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import styles from './FoldText.module.css';

type Split = 'char' | 'word' | 'line';
type Hinge = 'top' | 'bottom' | 'left' | 'right';
type Trigger = 'mount' | 'hover' | 'scroll' | 'loop';

type FoldTextProps = {
  text: string;
  splitBy?: Split;
  hinge?: Hinge;
  duration?: number;
  stagger?: number;
  ease?: string;
  perspective?: number;
  creaseShading?: number;
  trigger?: Trigger;
  fontSize?: string | number;
  fontWeight?: string | number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

const hingeConfig = {
  top: { origin: '50% 0%', rotateX: -88, rotateY: 0 },
  bottom: { origin: '50% 100%', rotateX: 88, rotateY: 0 },
  left: { origin: '0% 50%', rotateX: 0, rotateY: 88 },
  right: { origin: '100% 50%', rotateX: 0, rotateY: -88 },
} satisfies Record<Hinge, { origin: string; rotateX: number; rotateY: number }>;

export function FoldText({
  text,
  splitBy = 'word',
  hinge = 'top',
  duration = .65,
  stagger = .045,
  ease = 'power3.out',
  perspective = 700,
  creaseShading = .45,
  trigger = 'scroll',
  fontSize = 'inherit',
  fontWeight = 'inherit',
  color = 'currentColor',
  className = '',
  style,
}: FoldTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const config = hingeConfig[hinge];
  const segments = useMemo(() => {
    const make = (content: string, key: string, split = splitBy) => (
      <span className={styles.segment} data-fold-split={split} key={key} style={{ '--fold-perspective': `${Math.max(120, perspective)}px` } as CSSProperties}>
        <span className={styles.piece} data-fold-hinge={hinge}>{content || '\u00a0'}</span>
      </span>
    );
    if (splitBy === 'line') return text.split('\n').map((line, index) => <span className={styles.line} key={index}>{make(line, `line-${index}`, 'line')}</span>);
    if (splitBy === 'word') return text.split(/(\s+)/).map((part, index) => /^\s+$/.test(part) ? <span className={styles.space} key={index}>{part.replace(/ /g, '\u00a0')}</span> : make(part, `word-${index}`));
    return Array.from(text).map((char, index) => char === '\n' ? <br key={index} /> : make(char === ' ' ? '\u00a0' : char, `char-${index}`));
  }, [hinge, perspective, splitBy, text]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pieces = Array.from(root.querySelectorAll<HTMLElement>(`.${styles.piece}`));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { gsap.set(pieces, { opacity: 1, rotateX: 0, rotateY: 0 }); return; }
    const from = { opacity: 0, rotateX: config.rotateX, rotateY: config.rotateY, '--fold-crease': Math.min(1, Math.max(0, creaseShading)), transformOrigin: config.origin };
    const play = (repeat = false) => gsap.fromTo(pieces, from, { opacity: 1, rotateX: 0, rotateY: 0, '--fold-crease': 0, duration, ease, stagger, repeat: repeat ? -1 : 0, repeatDelay: .9 });
    let animation: gsap.core.Tween | undefined;
    let observer: IntersectionObserver | undefined;
    const onHover = () => { animation?.kill(); animation = play(); };
    if (trigger === 'hover') { gsap.set(pieces, { opacity: 1 }); root.addEventListener('mouseenter', onHover); }
    else if (trigger === 'scroll') { gsap.set(pieces, from); observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { animation = play(); observer?.disconnect(); } }, { rootMargin: '0px 0px -14% 0px' }); observer.observe(root); }
    else animation = play(trigger === 'loop');
    return () => { observer?.disconnect(); root.removeEventListener('mouseenter', onHover); animation?.kill(); gsap.killTweensOf(pieces); };
  }, [config, creaseShading, duration, ease, stagger, trigger]);

  const vars = { '--fold-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, '--fold-weight': fontWeight, '--fold-color': color, ...style } as CSSProperties;
  return <span ref={rootRef} className={`${styles.root} ${className}`} style={vars}><span className={styles.srOnly}>{text}</span><span className={styles.visual} aria-hidden="true">{segments}</span></span>;
}
