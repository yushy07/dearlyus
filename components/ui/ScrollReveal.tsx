'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: 'fade-up' | 'scale' | 'slide-left' | 'slide-right';
  stagger?: boolean;
  threshold?: number;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

export function ScrollReveal({
  animation = 'fade-up',
  stagger = false,
  threshold = 0.15,
  delay = 0,
  className = '',
  children,
  style,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const animClass =
    animation === 'scale'
      ? 'reveal-scale'
      : animation === 'slide-left'
      ? 'reveal-slide-left'
      : animation === 'slide-right'
      ? 'reveal-slide-right'
      : 'reveal-fade-up';

  const staggerClass = stagger ? 'reveal-stagger' : '';

  return (
    <div
      ref={ref}
      className={`${animClass} ${staggerClass} ${isInView ? 'in-view' : ''} ${className}`}
      style={{
        ...style,
        transitionDelay: delay ? `${delay}s` : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
