import React from 'react';

interface RibbonProps {
  text?: React.ReactNode;
}

export function Ribbon({ text }: RibbonProps) {
  return (
    <div className="ribbon">
      <span className="ribbon-in">
        {text ?? (
          <>
            ♡ Realtime Date Night &amp; Synced Photobooth for Long Distance Couples
          </>
        )}
      </span>
    </div>
  );
}
