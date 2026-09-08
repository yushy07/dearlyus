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
            ♡ Making LDR couples experience dates like other couples
          </>
        )}
      </span>
    </div>
  );
}
