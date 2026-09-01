import React from 'react';

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  if (!active) return null;

  const emojis = ['🌸', '💖', '✨', '🎉', '🎊', '🫰', '🌟', '💕'];

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, overflow: 'hidden' }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${Math.random() * 100}%`,
            fontSize: `${16 + Math.random() * 18}px`,
            animation: `gl-pulse ${1.5 + Math.random() * 2}s linear infinite`,
            transform: `translateY(${Math.random() * 800}px)`,
          }}
        >
          {emojis[i % emojis.length]}
        </span>
      ))}
    </div>
  );
}
