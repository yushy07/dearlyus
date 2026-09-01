'use client';

import React from 'react';

interface KineticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function KineticCard({
  children,
  className = '',
  style,
  ...props
}: KineticCardProps) {
  return (
    <div
      className={`kinetic-card card-3d ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      <div className="shimmer-sweep" />
      {children}
    </div>
  );
}
