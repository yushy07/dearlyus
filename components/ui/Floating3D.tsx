'use client';

import React from 'react';

interface Floating3DProps extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number;
  depth?: number;
  className?: string;
  children: React.ReactNode;
}

export function Floating3D({
  duration = 6,
  depth = 16,
  className = '',
  children,
  style,
  ...props
}: Floating3DProps) {
  return (
    <div
      className={`floating-3d ${className}`}
      style={{
        ...style,
        animationDuration: `${duration}s`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
