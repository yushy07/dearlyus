'use client';

import React from 'react';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function AuroraBackground({ children, className = '', style = {} }: AuroraBackgroundProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div className="aurora-mesh" />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
