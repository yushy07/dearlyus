'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 3.5,
  className = '',
  style = {},
}: ShinyTextProps) {
  return (
    <span
      className={`shiny-text ${className}`}
      style={{
        ...style,
        animationDuration: `${speed}s`,
        ...(disabled ? { background: 'none', WebkitTextFillColor: 'currentColor' } : {}),
      }}
    >
      {text}
    </span>
  );
}
