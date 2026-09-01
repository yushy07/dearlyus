'use client';

import React from 'react';

interface GlowBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  size?: 'sm' | 'md';
  glowColor?: string;
  className?: string;
}

export function GlowBadge({
  text,
  size = 'md',
  glowColor = 'rgba(255, 123, 163, 0.4)',
  className = '',
  style,
  ...props
}: GlowBadgeProps) {
  const isSmall = size === 'sm';

  return (
    <span
      className={`border-glow-mask ${className}`}
      style={{
        padding: isSmall ? '3px 10px' : '5px 14px',
        fontSize: isSmall ? '10px' : '12px',
        fontWeight: 800,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        background: 'rgba(255, 255, 255, 0.92)',
        color: '#17181C',
        boxShadow: `0 0 16px ${glowColor}`,
        ...style,
      }}
      {...props}
    >
      <span
        style={{
          background: 'linear-gradient(90deg, #FF7BA3, #5FA0FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 900,
        }}
      >
        {text}
      </span>
    </span>
  );
}
