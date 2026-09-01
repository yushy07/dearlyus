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
            ♡ Online Photobooth &amp; Realtime Date Nights · <b>Free for Couples on Angie</b>
          </>
        )}
      </span>
    </div>
  );
}
