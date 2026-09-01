'use client';

import React, { useRef, useState, MouseEvent } from 'react';

interface MagnetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  magnetStrength?: number;
  className?: string;
  children: React.ReactNode;
}

export function MagnetButton({
  magnetStrength = 0.25,
  className = '',
  children,
  style,
  ...props
}: MagnetButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * magnetStrength;
    const deltaY = (e.clientY - centerY) * magnetStrength;

    setOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0 ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.08s ease-out',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
